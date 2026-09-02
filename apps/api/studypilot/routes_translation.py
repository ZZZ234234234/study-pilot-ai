from threading import BoundedSemaphore

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .errors import AppError
from .models import Page, User
from .providers import get_provider
from .security import current_user, owned_document, require_ready
from .translation import TranslationRequest, translate_page

router = APIRouter(prefix="/documents", tags=["translation"])
translation_slots = BoundedSemaphore(2)


@router.post("/{document_id}/translate")
def translate(
    document_id: str,
    body: TranslationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    document = owned_document(db, user, document_id)
    # A failed embedding/knowledge job must not block translation of already parsed pages.
    if not (document.status == "failed" and document.progress >= 30):
        require_ready(document)
    page = db.scalar(
        select(Page).where(Page.document_id == document_id, Page.page_number == body.page)
    )
    if page is None:
        raise AppError("This page does not exist.", "not_found", 404)
    settings = get_settings()
    if settings.ai_provider == "demo" or (
        settings.ai_provider == "openai" and not settings.ai_api_key
    ):
        raise AppError(
            "Translation requires a configured real chat model; demo never simulates it.",
            "translation_provider_required",
            409,
        )
    if not translation_slots.acquire(blocking=False):
        raise AppError("Translation is busy. Please retry.", "provider_busy", 429)
    try:
        # No embeddings, re-indexing, writes to PDF/pages, or persistent translation cache.
        result = translate_page(page.text, body, get_provider())
        return {**result, "document_id": document_id, "model": settings.chat_model}
    finally:
        translation_slots.release()
