import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .config import ROOT, get_settings
from .db import get_db
from .errors import AppError
from .models import ChatSession, Chunk, Document, KnowledgePoint, Page, Quiz, StudyPlan, User, uid
from .pdf import safe_filename
from .schemas import RenameRequest
from .security import current_user, owned_document
from .serialization import row_dict

router = APIRouter(prefix="/documents", tags=["documents"])


def document_json(document: Document) -> dict:
    return row_dict(document, ("user_id", "embedding_signature"))


def upload_path(document_id: str) -> Path:
    path = get_settings().data_dir / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path / f"{document_id}.pdf"


def check_quota(db: Session, user: User):
    if (
        db.scalar(select(func.count()).select_from(Document).where(Document.user_id == user.id))
        >= get_settings().max_documents
    ):
        raise AppError(
            "Your workspace has reached its 30-document limit. Delete a document before uploading another.",
            "document_limit",
            429,
        )


@router.get("")
def documents(
    q: str = Query(default="", max_length=120),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    statement = (
        select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
    )
    if q.strip():
        statement = statement.where(Document.title.ilike(f"%{q.strip()}%"))
    return [document_json(doc) for doc in db.scalars(statement).all()]


@router.post("", status_code=202)
def upload(
    file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(current_user)
):
    check_quota(db, user)
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise AppError("Only PDF files are supported.", "invalid_file_type", 415)
    filename = safe_filename(file.filename or "document.pdf")
    if not filename.lower().endswith(".pdf"):
        raise AppError("Choose a file with a .pdf extension.", "invalid_file_type", 415)
    document_id = uid()
    path = upload_path(document_id)
    size = 0
    try:
        with path.open("xb") as output:
            while block := file.file.read(1024 * 1024):
                if size == 0 and not block.startswith(b"%PDF-"):
                    raise AppError(
                        "This file does not contain a valid PDF header.", "invalid_pdf", 415
                    )
                size += len(block)
                if size > get_settings().max_upload_mb * 1024 * 1024:
                    raise AppError("This PDF exceeds the upload size limit.", "file_too_large", 413)
                output.write(block)
        if size < 100:
            raise AppError("This PDF is empty or incomplete.", "invalid_pdf")
        doc = Document(
            id=document_id,
            user_id=user.id,
            title=filename[:-4][:180],
            filename=filename,
            size_bytes=size,
        )
        db.add(doc)
        db.commit()
        return document_json(doc)
    except Exception:
        path.unlink(missing_ok=True)
        raise
    finally:
        file.file.close()


@router.post("/demo", status_code=202)
def create_demo(db: Session = Depends(get_db), user: User = Depends(current_user)):
    existing = db.scalar(
        select(Document).where(Document.user_id == user.id, Document.is_demo.is_(True))
    )
    if existing:
        return document_json(existing)
    check_quota(db, user)
    document_id = uid()
    source = ROOT / "docs" / "sample" / "introduction-to-neural-networks.pdf"
    if not source.exists():
        raise AppError(
            "The sample PDF is missing from this deployment. Run scripts/create_sample.py.",
            "sample_missing",
            503,
        )
    target = upload_path(document_id)
    shutil.copyfile(source, target)
    doc = Document(
        id=document_id,
        user_id=user.id,
        title="Introduction to Neural Networks",
        filename=source.name,
        size_bytes=source.stat().st_size,
        is_demo=True,
    )
    try:
        db.add(doc)
        db.commit()
    except Exception:
        target.unlink(missing_ok=True)
        raise
    return document_json(doc)


@router.get("/{document_id}")
def get_document(
    document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    return document_json(owned_document(db, user, document_id))


@router.patch("/{document_id}")
def rename(
    document_id: str,
    body: RenameRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    doc = owned_document(db, user, document_id)
    if not body.title.strip():
        raise AppError("Document title cannot be blank.")
    doc.title = body.title.strip()
    db.commit()
    return document_json(doc)


@router.delete("/{document_id}", status_code=204)
def remove(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    doc = owned_document(db, user, document_id)
    if doc.status in {"parsing", "indexing"}:
        raise AppError(
            "This document is processing. Try deleting it when processing finishes.",
            "processing",
            409,
        )
    path = upload_path(document_id)
    trash = path.with_suffix(".deleting")
    if path.exists():
        path.rename(trash)
    try:
        db.delete(doc)
        db.commit()
    except Exception:
        if trash.exists():
            trash.rename(path)
        raise
    trash.unlink(missing_ok=True)


@router.post("/{document_id}/reprocess", status_code=202)
def reprocess(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    doc = owned_document(db, user, document_id)
    if doc.status in {"queued", "parsing", "indexing"}:
        raise AppError("Processing is already in progress.", "processing", 409)
    for model in (StudyPlan, ChatSession, Quiz, Page, Chunk):
        db.execute(delete(model).where(model.document_id == doc.id))
    doc.status, doc.progress, doc.error = "queued", 0, None
    doc.chunk_count, doc.knowledge_count = 0, 0
    doc.ai_status = "pending"
    db.commit()
    return document_json(doc)


@router.get("/{document_id}/file")
def pdf_file(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    doc = owned_document(db, user, document_id)
    path = upload_path(document_id)
    if not path.exists():
        raise AppError("The original PDF is missing from storage.", "file_missing", 404)
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=doc.filename,
        content_disposition_type="inline",
        headers={"Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"},
    )


@router.get("/{document_id}/pages")
def pages(
    document_id: str,
    page: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    owned_document(db, user, document_id)
    query = select(Page).where(Page.document_id == document_id).order_by(Page.page_number)
    if page is not None:
        query = query.where(Page.page_number == page)
    return [
        row_dict(p) if page else {"page_number": p.page_number, "heading": p.heading}
        for p in db.scalars(query).all()
    ]


@router.get("/{document_id}/knowledge")
def knowledge(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    owned_document(db, user, document_id)
    return [
        row_dict(p)
        for p in db.scalars(
            select(KnowledgePoint)
            .where(KnowledgePoint.document_id == document_id)
            .order_by(KnowledgePoint.page_number, KnowledgePoint.title)
        ).all()
    ]


@router.get("/{document_id}/search")
def search(
    document_id: str,
    q: str = Query(min_length=1, max_length=120),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    owned_document(db, user, document_id)
    # Parameterized PostgreSQL substring search also supports CJK and punctuation literally.
    query = (
        select(Page)
        .where(Page.document_id == document_id, Page.text.icontains(q, autoescape=True))
        .order_by(Page.page_number)
        .limit(50)
    )
    results = []
    for page in db.scalars(query).all():
        position = page.text.lower().find(q.lower())
        results.append(
            {
                "page_number": page.page_number,
                "heading": page.heading,
                "snippet": page.text[max(0, position - 100) : position + len(q) + 240],
            }
        )
    return results
