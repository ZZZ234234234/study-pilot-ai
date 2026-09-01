import logging
import signal
import time
from datetime import timedelta

from sqlalchemy import delete, select, update

from .config import get_settings
from .db import session_factory
from .errors import AppError
from .learning import extract_knowledge
from .models import Chunk, Document, KnowledgePoint, Page, now
from .pdf import chunk_pages, parse_pdf
from .providers import get_provider

logger = logging.getLogger("studypilot.worker")
running = True


def process_document(document_id: str):
    settings = get_settings()
    with session_factory() as db:
        document = db.get(Document, document_id)
        if document is None:
            return
        try:
            document.status, document.progress = "parsing", 10
            db.commit()
            pages = parse_pdf(
                settings.data_dir / "uploads" / f"{document.id}.pdf", settings.max_pdf_pages
            )
            chunks = chunk_pages(pages, settings.chunk_size, settings.chunk_overlap)
            db.execute(delete(Page).where(Page.document_id == document.id))
            db.execute(delete(Chunk).where(Chunk.document_id == document.id))
            db.add_all(
                [
                    Page(
                        document_id=document.id,
                        page_number=p.number,
                        heading=p.heading,
                        text=p.text,
                    )
                    for p in pages
                ]
            )
            document.page_count = len(pages)
            document.status, document.progress = "indexing", 30
            db.commit()
            provider = get_provider()
            document.embedding_signature = provider.signature
            for offset in range(0, len(chunks), 8):
                batch = chunks[offset : offset + 8]
                vectors = provider.embeddings([c.text for c in batch])
                stored = [
                    Chunk(
                        document_id=document.id,
                        page_number=c.page_number,
                        chunk_index=c.chunk_index,
                        text=c.text,
                        embedding=vector,
                    )
                    for c, vector in zip(batch, vectors, strict=True)
                ]
                db.add_all(stored)
                db.flush()
                points = extract_knowledge(stored, provider, document.is_demo)
                db.add_all([KnowledgePoint(document_id=document.id, **point) for point in points])
                document.progress = min(95, 30 + round((offset + len(batch)) / len(chunks) * 65))
                document.updated_at = now()
                db.commit()
            document.chunk_count = len(chunks)
            document.knowledge_count = len(
                db.scalars(
                    select(KnowledgePoint.id).where(KnowledgePoint.document_id == document.id)
                ).all()
            )
            document.status, document.progress, document.error = "ready", 100, None
            document.ai_status = (
                "demo"
                if document.is_demo and settings.ai_provider == "demo"
                else "not_configured"
                if settings.ai_provider == "demo"
                else "ready"
            )
            db.commit()
        except Exception as exc:
            db.rollback()
            message = (
                exc.message
                if isinstance(exc, AppError)
                else "Processing failed unexpectedly. Retry the document; if it fails again, export a smaller PDF."
            )
            document = db.get(Document, document_id)
            if document:
                document.status, document.error = "failed", message
                db.commit()
            # Never log PDF text, provider bodies, credentials, or unsanitized exception strings.
            logger.warning("Document processing failed: %s (%s)", document_id, type(exc).__name__)


def claim_document() -> str | None:
    with session_factory() as db:
        # Interrupted work is explicit and retryable; no silent partial-ready documents.
        db.execute(
            update(Document)
            .where(
                Document.status.in_(["parsing", "indexing"]),
                Document.updated_at < now() - timedelta(minutes=20),
            )
            .values(status="failed", error="Processing was interrupted. Retry this document.")
        )
        document = db.scalar(
            select(Document)
            .where(Document.status == "queued")
            .order_by(Document.created_at)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if document:
            document.status, document.updated_at = "parsing", now()
        db.commit()
        return document.id if document else None


def stop(*_):
    global running
    running = False


def main():
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    logging.basicConfig(level=logging.INFO)
    logger.info("PDF worker started")
    while running:
        try:
            document_id = claim_document()
            if document_id:
                process_document(document_id)
            else:
                time.sleep(1)
        except Exception as exc:
            logger.warning("Worker unavailable (%s); retrying in 5 seconds", type(exc).__name__)
            time.sleep(5)


if __name__ == "__main__":
    main()
