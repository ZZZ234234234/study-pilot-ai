"""Private OpenAI-compatible connections with a strict provider allowlist."""

import json
import re

import httpx
from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator
from sqlalchemy.orm import Session

from .config import get_settings
from .errors import AppError
from .models import AIProfile, User
from .provider_catalog import (
    ProviderId,
    provider_spec,
)
from .providers import SAFETY

MODEL_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,119}$"


class ProfileInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=60)
    provider: ProviderId
    base_url: str = Field(max_length=200)
    model: str = Field(pattern=MODEL_PATTERN)
    api_key: SecretStr = Field(default=SecretStr(""), max_length=512)

    @field_validator("name")
    @classmethod
    def valid_name(cls, value: str) -> str:
        if not value.strip() or any(ord(c) < 32 for c in value):
            raise ValueError("Invalid display name")
        return value.strip()

    @field_validator("api_key")
    @classmethod
    def valid_key(cls, value: SecretStr) -> SecretStr:
        key = value.get_secret_value().strip()
        if key and (not key.isascii() or any(not 33 <= ord(c) <= 126 for c in key)):
            raise ValueError("Invalid API key format")
        return SecretStr(key)


class ProfileProbe(ProfileInput):
    profile_id: str | None = Field(default=None, pattern=r"^[a-f0-9-]{36}$")


def canonical_endpoint(provider: str, base_url: str) -> str:
    try:
        spec = provider_spec(provider)
    except ValueError:
        raise AppError("Unsupported model provider.", "profile_provider", 422) from None
    value = base_url.strip().rstrip("/")
    if provider == "deepseek" and value == "https://api.deepseek.com":
        value += "/v1"
    allowed = {endpoint.url for endpoint in spec.endpoints}
    if value not in allowed:
        raise AppError(
            "Only the selected provider's official endpoint is allowed.", "profile_endpoint", 422
        )
    return value


def owned_profile(db: Session, user: User, profile_id: str) -> AIProfile:
    profile = db.get(AIProfile, profile_id)
    if profile is None or profile.user_id != user.id:
        raise AppError("This model connection no longer exists.", "profile_not_found", 404)
    return profile


def selected_profile(
    db: Session, user: User, profile_id: str | None, revision: int | None = None
) -> AIProfile | None:
    # Explicit 'server' means the original .env configuration / fixed demo.
    if profile_id == "server":
        return None
    selected = profile_id or user.ai_profile_id
    profile = owned_profile(db, user, selected) if selected else None
    if profile and revision is not None and profile.revision != revision:
        raise AppError(
            "This connection changed. Refresh and confirm the model again.", "profile_changed", 409
        )
    return profile


def public_profile(profile: AIProfile) -> dict:
    return {
        name: getattr(profile, name)
        for name in ("id", "name", "provider", "base_url", "model", "revision")
    } | {"has_api_key": bool(profile.api_key)}


def resolve_input(body: ProfileInput, existing: AIProfile | None = None) -> dict:
    spec = provider_spec(body.provider)
    base = canonical_endpoint(body.provider, body.base_url)
    key = body.api_key.get_secret_value()
    if not key and existing and existing.provider == body.provider:
        key = existing.api_key
    if spec.key_required and not key:
        raise AppError("Enter an API key for this provider.", "profile_key_required", 422)
    return {
        "name": body.name,
        "provider": body.provider,
        "base_url": base,
        "model": body.model,
        "api_key": key,
    }


class ProfileProvider:
    """Chat-only adapter. Switching it never changes a document's embedding index."""

    signature = "chat-only"

    def __init__(self, profile: AIProfile):
        self.profile = profile
        self.spec = provider_spec(profile.provider)
        self.base_url = canonical_endpoint(profile.provider, profile.base_url)

    def request(self, method: str, route: str, payload: dict | None = None) -> dict:
        # No redirects, environment proxies, or automatic retries of billable completions.
        try:
            with httpx.Client(
                timeout=get_settings().ai_timeout_seconds, follow_redirects=False, trust_env=False
            ) as client:
                headers = {}
                if self.profile.api_key:
                    headers["Authorization"] = f"Bearer {self.profile.api_key}"
                with client.stream(
                    method,
                    f"{self.base_url}/{route}",
                    json=payload,
                    headers=headers,
                ) as r:
                    if r.status_code in {401, 403}:
                        raise AppError(
                            "Check the key and this model's access permissions.",
                            "profile_auth",
                            502,
                        )
                    if r.status_code in {402, 429}:
                        raise AppError(
                            "Check balance, quota and request frequency.", "profile_quota", 502
                        )
                    if not 200 <= r.status_code < 300:
                        raise AppError(
                            "Check the exact model ID and its JSON support.", "profile_request", 502
                        )
                    data = bytearray()
                    for block in r.iter_bytes():
                        data.extend(block)
                        if len(data) > 1_000_000:
                            raise ValueError
            result = json.loads(data)
            if not isinstance(result, dict):
                raise ValueError
            return result
        except httpx.TimeoutException:
            raise AppError(
                "The model timed out. Try a faster model.", "provider_timeout", 504
            ) from None
        except (httpx.HTTPError, ValueError):
            raise AppError(
                "Unable to read the provider response.", "provider_unavailable", 502
            ) from None

    def complete_messages_json(
        self,
        instructions: str,
        messages: list[dict[str, str]],
        max_tokens: int = 8192,
    ) -> dict:
        """Complete a small, explicit conversation and require one JSON object.

        This is intentionally separate from stored chat history: callers decide exactly
        which turns leave the machine, and the provider never receives hidden records.
        """
        payload = {
            "model": self.profile.model,
            "messages": [
                {"role": "system", "content": SAFETY + "\n" + instructions},
                *messages,
            ],
            "stream": False,
        }
        payload[self.spec.token_parameter] = max_tokens
        if self.spec.json_mode:
            payload["response_format"] = {"type": "json_object"}
        if self.profile.provider == "deepseek" or self.profile.model.startswith(
            ("glm-5", "glm-4.5", "glm-4.6", "glm-4.7")
        ):
            payload["thinking"] = {"type": "disabled"}
        result = self.request("POST", "chat/completions", payload)
        try:
            choice = result["choices"][0]
            if choice.get("finish_reason") not in {None, "stop"}:
                raise ValueError
            content = choice["message"]["content"].strip()
            if content.startswith("```json") and content.endswith("```"):
                content = content[7:-3].strip()
            elif content.startswith("```") and content.endswith("```"):
                content = content[3:-3].strip()
            parsed = json.loads(content)
            if not isinstance(parsed, dict):
                raise ValueError
            return parsed
        except (AttributeError, KeyError, IndexError, TypeError, ValueError):
            raise AppError(
                "The model did not return complete JSON data.", "invalid_ai_output", 502
            ) from None

    def complete_json(self, instructions: str, data: str, max_tokens: int = 8192) -> dict:
        return self.complete_messages_json(
            instructions,
            [{"role": "user", "content": data}],
            max_tokens,
        )

    def embeddings(self, texts: list[str]) -> list[list[float]]:
        raise AppError("This connection is chat-only.", "profile_chat_only", 409)

    def models(self) -> list[str]:
        result = self.request("GET", "models")
        try:
            rows = result["data"]
            if not isinstance(rows, list):
                raise ValueError
            ids = sorted(
                {
                    row["id"]
                    for row in rows
                    if isinstance(row, dict)
                    and isinstance(row.get("id"), str)
                    and re.fullmatch(MODEL_PATTERN, row["id"])
                }
            )[:200]
            if not ids:
                raise ValueError
            return ids
        except (KeyError, TypeError, ValueError):
            raise AppError(
                "The provider returned no readable model IDs.", "profile_models", 502
            ) from None
