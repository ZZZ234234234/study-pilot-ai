from datetime import date

from fastapi import APIRouter, Depends, Request, Response
from itsdangerous import BadSignature
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from .ai_profiles import selected_profile
from .config import get_settings
from .db import get_db
from .models import (
    ChatMessage,
    ChatSession,
    Document,
    Flashcard,
    KnowledgePoint,
    ReviewRecord,
    StudyTask,
    User,
)
from .providers import get_provider
from .routes_documents import document_json
from .security import COOKIE_NAME, current_user, signer
from .serialization import row_dict

router = APIRouter(tags=["workspace"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    vector = db.scalar(text("SELECT extversion FROM pg_extension WHERE extname='vector'"))
    return {"status": "ok", "database": "postgresql", "pgvector": vector, "version": "0.1.0"}


@router.post("/session")
def session(request: Request, response: Response, db: Session = Depends(get_db)):
    user = None
    try:
        user_id = signer().loads(request.cookies.get(COOKIE_NAME, ""), max_age=60 * 60 * 24 * 30)
        user = db.get(User, user_id)
    except BadSignature:
        pass
    if not user:
        user = User()
        db.add(user)
        db.commit()
    response.set_cookie(
        COOKIE_NAME,
        signer().dumps(user.id),
        max_age=60 * 60 * 24 * 30,
        httponly=True,
        secure=get_settings().cookie_secure,
        samesite="lax",
        path="/",
    )
    return {
        "workspace": "personal",
        "created_at": user.created_at,
        "authentication": "anonymous-cookie",
    }


@router.get("/settings")
def settings(db: Session = Depends(get_db), user: User = Depends(current_user)):
    config = get_settings()
    profile = selected_profile(db, user, None)
    return {
        "provider": config.ai_provider,
        "base_url": config.ollama_base_url
        if config.ai_provider == "ollama"
        else config.ai_base_url,
        "chat_model": config.chat_model,
        "embedding_model": config.embedding_model,
        "has_api_key": bool(config.ai_api_key),
        "max_upload_mb": config.max_upload_mb,
        "max_pdf_pages": config.max_pdf_pages,
        "configuration": "server-managed",
        "default_profile_id": profile.id if profile else None,
        "chat_available": bool(profile)
        or config.ai_provider == "ollama"
        or (config.ai_provider == "openai" and bool(config.ai_api_key)),
        "chat_connection": f"{profile.name} · {profile.model}" if profile else None,
        "mode": "demo" if config.ai_provider == "demo" else "live",
    }


@router.post("/settings/test")
def test_provider(user: User = Depends(current_user)):
    provider = get_provider()
    vector = provider.embeddings(["StudyPilot connection check."])
    return {
        "ok": True,
        "dimensions": len(vector[0]),
        "mode": get_settings().ai_provider,
        "message": "演示模式运行正常，本次检查没有调用外部模型。"
        if get_settings().ai_provider == "demo"
        else "嵌入模型接口连接正常。对话模型尚未在本次检查中验证，请通过处理文档进一步测试。",
    }


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(current_user)):
    documents = list(
        db.scalars(
            select(Document).where(Document.user_id == user.id).order_by(Document.created_at.desc())
        ).all()
    )
    ids = [d.id for d in documents]
    today = date.today()
    tasks = list(db.scalars(select(StudyTask).where(StudyTask.document_id.in_(ids))).all())
    due = list(
        db.scalars(
            select(Flashcard)
            .where(Flashcard.document_id.in_(ids), Flashcard.next_review_date <= today)
            .order_by(Flashcard.next_review_date)
            .limit(30)
        ).all()
    )
    reviews_today = (
        db.scalar(
            select(func.count())
            .select_from(ReviewRecord)
            .where(ReviewRecord.document_id.in_(ids), func.date(ReviewRecord.reviewed_at) == today)
        )
        or 0
    )
    recent = db.scalars(
        select(ChatMessage)
        .join(ChatSession)
        .where(ChatSession.document_id.in_(ids), ChatMessage.role == "user")
        .order_by(ChatMessage.created_at.desc())
        .limit(3)
    ).all()
    names = {d.id: d.title for d in documents}
    return {
        "documents": [document_json(d) for d in documents[:4]],
        "document_count": len(documents),
        "knowledge_count": db.scalar(
            select(func.count())
            .select_from(KnowledgePoint)
            .where(KnowledgePoint.document_id.in_(ids))
        )
        or 0,
        "reviews_today": reviews_today,
        "pages": sum(d.page_count for d in documents),
        "progress": round(100 * sum(t.completed for t in tasks) / len(tasks)) if tasks else 0,
        "completed_tasks": sum(t.completed for t in tasks),
        "total_tasks": len(tasks),
        "study_minutes": sum(t.minutes for t in tasks if t.completed),
        "tasks": [
            {**row_dict(t), "document_title": names.get(t.document_id)}
            for t in sorted(tasks, key=lambda x: x.scheduled_date)
            if t.scheduled_date <= today and not t.completed
        ][:12],
        "due_cards": [row_dict(c) for c in due],
        "recent_questions": [row_dict(m) for m in recent],
    }
