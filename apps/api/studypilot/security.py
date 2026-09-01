import secrets
from functools import lru_cache

from fastapi import Depends, Request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .errors import AppError
from .models import Document, User

COOKIE_NAME = "studypilot_session"


@lru_cache
def signer() -> URLSafeTimedSerializer:
    settings = get_settings()
    key = settings.session_secret
    if not key:
        settings.data_dir.mkdir(parents=True, exist_ok=True)
        path = settings.data_dir / ".session-key"
        try:
            with path.open("x") as file:
                file.write(secrets.token_urlsafe(48))
            path.chmod(0o600)
        except FileExistsError:
            pass
        key = path.read_text()
    return URLSafeTimedSerializer(key, salt="studypilot-workspace-v1")


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get(COOKIE_NAME, "")
    try:
        user_id = signer().loads(token, max_age=60 * 60 * 24 * 30)
    except (BadSignature, SignatureExpired):
        raise AppError(
            "Your workspace session expired. Refresh to open a new workspace.",
            "session_required",
            401,
        ) from None
    user = db.get(User, user_id)
    if user is None:
        raise AppError("Workspace not found. Please refresh the page.", "session_required", 401)
    return user


def owned_document(db: Session, user: User, document_id: str) -> Document:
    document = db.get(Document, document_id)
    if document is None or document.user_id != user.id:
        raise AppError("This document is unavailable in your workspace.", "not_found", 404)
    return document


def require_ready(document: Document):
    if document.status != "ready":
        raise AppError(
            "Wait for PDF processing to finish before using this feature.", "not_ready", 409
        )


def require_ai(document: Document):
    require_ready(document)
    if get_settings().ai_provider == "demo" and not document.is_demo:
        raise AppError(
            "Configure an AI Provider to continue. Your PDF is parsed and searchable; AI features are not simulated for uploaded files.",
            "provider_required",
            409,
        )
