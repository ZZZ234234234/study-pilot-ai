from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .db import get_db
from .errors import AppError
from .learning import build_schedule, review_schedule
from .models import Flashcard, KnowledgePoint, ReviewRecord, StudyPlan, StudyTask, User
from .schemas import PlanRequest, ReviewRequest, TaskRequest
from .security import current_user, owned_document, require_ready
from .serialization import row_dict

router = APIRouter(tags=["study"])


@router.get("/plans")
def plans(db: Session = Depends(get_db), user: User = Depends(current_user)):
    from .models import Document

    rows = db.scalars(
        select(StudyPlan)
        .join(Document)
        .where(Document.user_id == user.id)
        .order_by(StudyPlan.created_at.desc())
    ).all()
    return [
        {
            **row_dict(plan),
            "tasks": [
                row_dict(t)
                for t in db.scalars(
                    select(StudyTask)
                    .where(StudyTask.plan_id == plan.id)
                    .order_by(StudyTask.scheduled_date)
                ).all()
            ],
        }
        for plan in rows
    ]


@router.post("/documents/{document_id}/plans", status_code=201)
def create_plan(
    document_id: str,
    body: PlanRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    doc = owned_document(db, user, document_id)
    require_ready(doc)
    points = list(
        db.scalars(select(KnowledgePoint).where(KnowledgePoint.document_id == document_id)).all()
    )
    tasks = build_schedule(
        points, body.exam_date, body.daily_minutes, body.days_per_week, body.priority
    )
    # Replacing a plan is explicit in the form; one active plan per document.
    db.execute(delete(StudyPlan).where(StudyPlan.document_id == document_id))
    plan = StudyPlan(document_id=document_id, **body.model_dump())
    db.add(plan)
    db.flush()
    stored = [StudyTask(plan_id=plan.id, document_id=document_id, **task) for task in tasks]
    db.add_all(stored)
    db.commit()
    return {**row_dict(plan), "tasks": [row_dict(t) for t in stored]}


@router.patch("/tasks/{task_id}")
def toggle_task(
    task_id: str,
    body: TaskRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    task = db.get(StudyTask, task_id)
    if task is None:
        raise AppError("Study task not found.", "not_found", 404)
    owned_document(db, user, task.document_id)
    task.completed = body.completed
    db.commit()
    return row_dict(task)


@router.get("/documents/{document_id}/flashcards")
def cards(document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    owned_document(db, user, document_id)
    return [
        row_dict(card)
        for card in db.scalars(
            select(Flashcard)
            .where(Flashcard.document_id == document_id)
            .order_by(Flashcard.next_review_date, Flashcard.page_number)
        ).all()
    ]


@router.post("/documents/{document_id}/flashcards", status_code=201)
def create_cards(
    document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    owned_document(db, user, document_id)
    points = db.scalars(
        select(KnowledgePoint).where(KnowledgePoint.document_id == document_id)
    ).all()
    if not points:
        raise AppError(
            "Generate knowledge points before creating flashcards.", "knowledge_required", 409
        )
    existing = set(
        db.scalars(select(Flashcard.knowledge_id).where(Flashcard.document_id == document_id)).all()
    )
    for point in points:
        if point.id not in existing:
            db.add(
                Flashcard(
                    document_id=document_id,
                    knowledge_id=point.id,
                    question=f"Explain: {point.title}",
                    answer=point.explanation,
                    page_number=point.page_number,
                )
            )
    db.commit()
    return cards(document_id, db, user)


@router.post("/flashcards/{card_id}/review")
def review(
    card_id: str,
    body: ReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    card = db.scalar(select(Flashcard).where(Flashcard.id == card_id).with_for_update())
    if card is None:
        raise AppError("Flashcard not found.", "not_found", 404)
    owned_document(db, user, card.document_id)
    # Avoid double-submission updating a due card twice.
    if card.next_review_date > date.today():
        raise AppError(
            "This card has already been reviewed. Come back on its next review date.",
            "already_reviewed",
            409,
        )
    updated = review_schedule(body.grade, card.interval, card.ease, card.review_count, date.today())
    for key, value in updated.items():
        setattr(card, key, value)
    db.add(
        ReviewRecord(
            card_id=card.id, document_id=card.document_id, grade=body.grade, interval=card.interval
        )
    )
    db.commit()
    return row_dict(card)
