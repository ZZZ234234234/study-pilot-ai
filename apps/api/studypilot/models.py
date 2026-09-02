import uuid
from datetime import UTC, date, datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


def uid() -> str:
    return str(uuid.uuid4())


def now() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    # Workspace preference, deliberately not a foreign key (profiles belong to users).
    ai_profile_id: Mapped[str | None] = mapped_column(String(36))


class AIProfile(Base):
    __tablename__ = "ai_profiles"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(60))
    provider: Mapped[str] = mapped_column(String(20))
    base_url: Mapped[str] = mapped_column(String(200))
    model: Mapped[str] = mapped_column(String(120))
    # Server-private database only. Never serialize this model using row_dict.
    # Not encrypted at rest: protect the data directory/database and its backups.
    api_key: Mapped[str] = mapped_column(Text)
    revision: Mapped[int] = mapped_column(default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(180))
    filename: Mapped[str] = mapped_column(String(200))
    size_bytes: Mapped[int] = mapped_column(default=0)
    status: Mapped[str] = mapped_column(String(20), default="queued", index=True)
    progress: Mapped[int] = mapped_column(default=0)
    page_count: Mapped[int] = mapped_column(default=0)
    chunk_count: Mapped[int] = mapped_column(default=0)
    knowledge_count: Mapped[int] = mapped_column(default=0)
    is_demo: Mapped[bool] = mapped_column(default=False)
    ai_status: Mapped[str] = mapped_column(String(32), default="pending")
    embedding_signature: Mapped[str] = mapped_column(String(256), default="")
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)


class Page(Base):
    __tablename__ = "document_pages"
    __table_args__ = (UniqueConstraint("document_id", "page_number"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    page_number: Mapped[int]
    heading: Mapped[str] = mapped_column(String(300))
    text: Mapped[str] = mapped_column(Text)


class Chunk(Base):
    __tablename__ = "document_chunks"
    __table_args__ = (Index("ix_chunks_document_order", "document_id", "chunk_index"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    page_number: Mapped[int]
    chunk_index: Mapped[int]
    text: Mapped[str] = mapped_column(Text)
    # Variable dimension supports different provider models; a document pins its model signature.
    embedding: Mapped[list[float]] = mapped_column(Vector())


class KnowledgePoint(Base):
    __tablename__ = "knowledge_points"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    chunk_id: Mapped[str] = mapped_column(ForeignKey("document_chunks.id", ondelete="CASCADE"))
    chapter: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str] = mapped_column(String(200))
    title: Mapped[str] = mapped_column(String(200))
    explanation: Mapped[str] = mapped_column(Text)
    source_excerpt: Mapped[str] = mapped_column(Text)
    page_number: Mapped[int]
    importance: Mapped[str] = mapped_column(String(10))
    difficulty: Mapped[str] = mapped_column(String(10))
    keywords: Mapped[list[str]] = mapped_column(JSON, default=list)


class StudyPlan(Base):
    __tablename__ = "study_plans"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    exam_date: Mapped[date]
    daily_minutes: Mapped[int]
    days_per_week: Mapped[int]
    priority: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class StudyTask(Base):
    __tablename__ = "study_tasks"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    plan_id: Mapped[str] = mapped_column(
        ForeignKey("study_plans.id", ondelete="CASCADE"), index=True
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(240))
    scheduled_date: Mapped[date] = mapped_column(index=True)
    minutes: Mapped[int]
    kind: Mapped[str] = mapped_column(String(20))
    knowledge_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    completed: Mapped[bool] = mapped_column(default=False)


class Flashcard(Base):
    __tablename__ = "flashcards"
    __table_args__ = (UniqueConstraint("knowledge_id"),)
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    knowledge_id: Mapped[str] = mapped_column(ForeignKey("knowledge_points.id", ondelete="CASCADE"))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    page_number: Mapped[int]
    next_review_date: Mapped[date] = mapped_column(default=date.today, index=True)
    interval: Mapped[int] = mapped_column(default=0)
    ease: Mapped[float] = mapped_column(default=2.5)
    review_count: Mapped[int] = mapped_column(default=0)


class ReviewRecord(Base):
    __tablename__ = "review_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    card_id: Mapped[str] = mapped_column(
        ForeignKey("flashcards.id", ondelete="CASCADE"), index=True
    )
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    grade: Mapped[str] = mapped_column(String(10))
    interval: Mapped[int]
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), unique=True
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    session_id: Mapped[str] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(12))
    content: Mapped[str] = mapped_column(Text)
    mode: Mapped[str] = mapped_column(String(20))
    # Immutable provenance survives a profile rename or deletion.
    model_label: Mapped[str | None] = mapped_column(String(220))
    retrieval: Mapped[str | None] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Citation(Base):
    __tablename__ = "citations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    message_id: Mapped[str] = mapped_column(
        ForeignKey("chat_messages.id", ondelete="CASCADE"), index=True
    )
    chunk_id: Mapped[str] = mapped_column(ForeignKey("document_chunks.id", ondelete="CASCADE"))
    page_number: Mapped[int]
    quote: Mapped[str] = mapped_column(Text)


class Quiz(Base):
    __tablename__ = "quizzes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    document_id: Mapped[str] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), index=True
    )
    questions: Mapped[list[dict]] = mapped_column(JSON)
    responses: Mapped[list[str] | None] = mapped_column(JSON)
    score: Mapped[int | None]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
