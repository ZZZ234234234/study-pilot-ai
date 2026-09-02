import json

from fastapi import APIRouter, Depends
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .db import get_db
from .errors import AppError
from .learning import demo_answer, retrieve
from .models import ChatMessage, ChatSession, Citation, User
from .pdf import normalize
from .providers import DemoProvider, get_provider
from .schemas import AnswerResponse, ChatRequest
from .security import current_user, owned_document, require_ai
from .serialization import row_dict

router = APIRouter(prefix="/documents/{document_id}/chat", tags=["chat"])


def message_json(db: Session, message: ChatMessage) -> dict:
    return {
        **row_dict(message),
        "citations": [
            row_dict(c)
            for c in db.scalars(select(Citation).where(Citation.message_id == message.id)).all()
        ],
    }


@router.get("")
def history(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    owned_document(db, user, document_id)
    session = db.scalar(select(ChatSession).where(ChatSession.document_id == document_id))
    if not session:
        return []
    return [
        message_json(db, m)
        for m in db.scalars(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id)
            .order_by(ChatMessage.created_at)
        ).all()
    ]


@router.post("")
def ask(
    document_id: str,
    body: ChatRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    doc = owned_document(db, user, document_id)
    require_ai(doc)
    settings = get_settings()
    provider = get_provider()
    chunks = retrieve(
        db, doc, body.question, provider, settings.retrieval_top_k, settings.min_similarity
    )
    if not chunks:
        result = {
            "answer": "当前资料中没有找到足够依据。",
            "chunk_ids": [],
        }
    elif isinstance(provider, DemoProvider):
        result = demo_answer(body.question, chunks)
    else:
        instructions = 'Answer the question using only the provided chunks. JSON schema: {"answer":"answer with [p. N] references", "chunk_ids":["exact ids supporting the answer"]}. If unsupported, return the insufficient-evidence message and an empty chunk_ids array.'
        payload = {
            "question": body.question,
            "sources": [{"id": c.id, "page": c.page_number, "text": c.text} for c in chunks],
        }
        try:
            result = AnswerResponse.model_validate(
                provider.complete_json(instructions, json.dumps(payload, ensure_ascii=False))
            ).model_dump()
        except ValidationError:
            raise AppError(
                "The AI answer did not contain valid citations. Please retry.",
                "invalid_citations",
                502,
            ) from None
    lookup = {c.id: c for c in chunks}
    supported = list(dict.fromkeys(cid for cid in result["chunk_ids"] if cid in lookup))
    if not supported:
        result["answer"] = "当前资料中没有找到足够依据。"
    session = db.scalar(select(ChatSession).where(ChatSession.document_id == document_id))
    if not session:
        session = ChatSession(document_id=document_id)
        db.add(session)
        db.flush()
    mode = "demo" if isinstance(provider, DemoProvider) else "live"
    question = ChatMessage(session_id=session.id, role="user", content=body.question, mode=mode)
    answer = ChatMessage(
        session_id=session.id, role="assistant", content=result["answer"], mode=mode
    )
    db.add_all([question, answer])
    db.flush()
    for cid in supported:
        source = lookup[cid]
        db.add(
            Citation(
                message_id=answer.id,
                chunk_id=cid,
                page_number=source.page_number,
                quote=normalize(source.text)[:450],
            )
        )
    db.commit()
    return message_json(db, answer)
