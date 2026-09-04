import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = (
    Path(os.environ["STUDYPILOT_RESOURCE_ROOT"])
    if os.environ.get("STUDYPILOT_RESOURCE_ROOT")
    else Path(__file__).resolve().parents[3]
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / ".env", extra="ignore")
    app_env: Literal["development", "production", "test"] = "development"
    database_url: str = ""
    data_dir: Path = ROOT / "data"
    session_secret: str = ""
    cookie_secure: bool = False
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    ai_provider: Literal["demo", "openai", "ollama"] = "demo"
    ai_base_url: str = "https://api.openai.com/v1"
    ai_api_key: str = Field(default="", repr=False)
    ollama_base_url: str = "http://localhost:11434/v1"
    chat_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    ai_timeout_seconds: int = Field(default=90, ge=5, le=300)
    chunk_size: int = Field(default=1400, ge=200, le=4000)
    chunk_overlap: int = Field(default=180, ge=0, le=500)
    retrieval_top_k: int = Field(default=6, ge=1, le=12)
    min_similarity: float = Field(default=0.18, ge=0, le=1)
    max_upload_mb: int = Field(default=20, ge=1, le=30)
    max_pdf_pages: int = Field(default=300, ge=1, le=1000)
    max_documents: int = 30

    @model_validator(mode="after")
    def validate_configuration(self):
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("CHUNK_OVERLAP must be smaller than CHUNK_SIZE")
        if self.app_env == "production":
            if len(self.session_secret) < 32 or not self.cookie_secure:
                raise ValueError(
                    "Production requires SESSION_SECRET (32+ chars) and COOKIE_SECURE=true"
                )
            if not self.database_url:
                raise ValueError("Production requires DATABASE_URL")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
