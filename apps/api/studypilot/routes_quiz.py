import json
import math

from fastapi import APIRouter, Depends
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import get_db
from .errors import AppError
from .models import KnowledgePoint, Quiz, User
from .providers import DemoProvider, get_provider, tokens
from .schemas import QuizAnswers, QuizRequest, QuizResponse
from .security import current_user, owned_document, require_ai

router = APIRouter(tags=["quiz"])


def public_quiz(quiz: Quiz) -> dict:
    allowed = {"question", "kind", "options", "page_number"}
    return {
        "id": quiz.id,
        "document_id": quiz.document_id,
        "submitted": quiz.score is not None,
        "questions": [{k: v for k, v in item.items() if k in allowed} for item in quiz.questions],
    }


@router.get("/documents/{document_id}/quiz")
def latest_quiz(
    document_id: str, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    owned_document(db, user, document_id)
    quiz = db.scalar(
        select(Quiz)
        .where(Quiz.document_id == document_id)
        .order_by(Quiz.created_at.desc())
        .limit(1)
    )
    return public_quiz(quiz) if quiz and quiz.score is None else None


@router.post("/documents/{document_id}/quiz", status_code=201)
def generate(
    document_id: str,
    body: QuizRequest,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    doc = owned_document(db, user, document_id)
    require_ai(doc)
    points = list(
        db.scalars(
            select(KnowledgePoint)
            .where(KnowledgePoint.document_id == doc.id)
            .order_by(KnowledgePoint.page_number)
            .limit(40)
        ).all()
    )
    if not points:
        raise AppError(
            "Knowledge points are needed before creating a quiz.", "knowledge_required", 409
        )
    provider = get_provider()
    if isinstance(provider, DemoProvider):
        questions = []
        for i in range(body.count):
            point = points[i % len(points)]
            if i % 3 == 0:
                question = {
                    "question": f"Which topic is described by this source statement?\n{point.source_excerpt}",
                    "kind": "multiple_choice",
                    "options": [points[(i + k) % len(points)].title for k in range(4)],
                    "correct_answer": point.title,
                }
                # Rotate options so the correct answer is not always first.
                offset = i % 4
                question["options"] = question["options"][offset:] + question["options"][:offset]
            elif i % 3 == 1:
                is_true = i % 2 == 1
                claim = (
                    point.source_excerpt
                    if is_true
                    else f"The source says that {point.title.lower()} is always unnecessary for every learning task."
                )
                question = {
                    "question": claim,
                    "kind": "true_false",
                    "options": ["True", "False"],
                    "correct_answer": "True" if is_true else "False",
                }
            else:
                question = {
                    "question": f"In your own words, explain {point.title.lower()}.",
                    "kind": "short_answer",
                    "options": [],
                    "correct_answer": point.explanation,
                }
            questions.append(
                {
                    **question,
                    "explanation": point.explanation,
                    "knowledge_id": point.id,
                    "page_number": point.page_number,
                    "source_excerpt": point.source_excerpt,
                    "keywords": point.keywords,
                }
            )
    else:
        instructions = f"Generate exactly {body.count} practice questions with a mix of multiple_choice, true_false, short_answer. Schema: {{questions:[{{question:string,kind:string,options:string[],correct_answer:string,explanation:string,knowledge_id:string,keywords:string[]}}]}}. For selection questions correct_answer MUST exactly equal an option. Short answers need 1-4 essential scoring keywords. Use only supplied knowledge and cite its exact id."
        try:
            result = QuizResponse.model_validate(
                provider.complete_json(
                    instructions,
                    json.dumps(
                        [
                            {
                                "id": p.id,
                                "title": p.title,
                                "text": p.explanation,
                                "source": p.source_excerpt,
                            }
                            for p in points
                        ],
                        ensure_ascii=False,
                    ),
                )
            )
        except ValidationError:
            raise AppError(
                "The provider returned an invalid quiz. Retry with a JSON-capable model.",
                "invalid_quiz",
                502,
            ) from None
        lookup = {p.id: p for p in points}
        questions = []
        for item in result.questions:
            point = lookup.get(item.knowledge_id)
            if point is None or (
                item.kind != "short_answer" and item.correct_answer not in item.options
            ):
                raise AppError(
                    "A generated question has invalid source evidence or answer options. Please retry.",
                    "invalid_quiz",
                    502,
                )
            if item.kind == "short_answer" and not item.keywords:
                raise AppError(
                    "A short-answer question is missing a scoring rubric. Please retry.",
                    "invalid_quiz",
                    502,
                )
            questions.append(
                {
                    **item.model_dump(),
                    "page_number": point.page_number,
                    "source_excerpt": point.source_excerpt,
                }
            )
        if len(questions) != body.count:
            raise AppError(
                "The model returned fewer questions than requested. Try a smaller quiz.",
                "invalid_quiz",
                502,
            )
    quiz = Quiz(document_id=doc.id, questions=questions)
    db.add(quiz)
    db.commit()
    return public_quiz(quiz)


@router.post("/quizzes/{quiz_id}/submit")
def submit(
    quiz_id: str,
    body: QuizAnswers,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    quiz = db.scalar(select(Quiz).where(Quiz.id == quiz_id).with_for_update())
    if not quiz:
        raise AppError("Quiz not found.", "not_found", 404)
    owned_document(db, user, quiz.document_id)
    if len(body.answers) != len(quiz.questions) or any(len(a) > 2000 for a in body.answers):
        raise AppError("Submit one answer per question (up to 2000 characters each).")
    if quiz.score is not None:
        raise AppError(
            "This quiz has already been submitted. Start a new quiz to practice again.",
            "already_submitted",
            409,
        )
    results = []
    for question, answer in zip(quiz.questions, body.answers, strict=True):
        if question["kind"] == "short_answer":
            key_words = question["keywords"]
            count = sum(
                k.lower() in answer.lower() or set(tokens(k)).issubset(set(tokens(answer)))
                for k in key_words
            )
            correct = bool(key_words) and count >= max(1, math.ceil(len(key_words) / 2))
        else:
            correct = answer.strip().casefold() == question["correct_answer"].strip().casefold()
        results.append({**question, "your_answer": answer, "correct": correct})
    quiz.responses = body.answers
    quiz.score = round(100 * sum(r["correct"] for r in results) / len(results))
    db.commit()
    return {
        "score": quiz.score,
        "results": results,
        "grading_note": "Short answers use keyword matching for practice, not expert grading. Compare your reasoning with the source.",
    }
