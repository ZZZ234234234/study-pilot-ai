import json
from datetime import date, timedelta

from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from .demo_content import CHAPTERS
from .errors import AppError
from .models import Chunk, Document, KnowledgePoint
from .pdf import normalize
from .providers import DemoProvider, Provider, demo_search_text, tokens
from .schemas import ExtractionResponse


def extract_knowledge(chunks: list[Chunk], provider: Provider, is_demo: bool) -> list[dict]:
    if isinstance(provider, DemoProvider):
        if not is_demo:
            return []
        points = []
        for page, (chapter, topics) in enumerate(CHAPTERS, 1):
            for title, explanation, importance, difficulty, keywords in topics:
                excerpt = explanation.split(". ")[0] + "."
                chunk = next(
                    (
                        c
                        for c in chunks
                        if c.page_number == page and normalize(excerpt) in normalize(c.text)
                    ),
                    None,
                )
                if chunk:
                    points.append(
                        dict(
                            chunk_id=chunk.id,
                            chapter=chapter,
                            topic=title,
                            title=title,
                            explanation=explanation,
                            source_excerpt=excerpt,
                            page_number=page,
                            importance=importance,
                            difficulty=difficulty,
                            keywords=keywords,
                        )
                    )
        return points
    instructions = """Extract at most 2 essential knowledge points per source chunk. Do not repeat topics.
    Schema: {"points":[{"chunk_id":"exact id", "chapter":"chapter", "topic":"topic", "title":"short title",
    "explanation":"concise explanation grounded in the source", "source_excerpt":"15-600 character verbatim quote",
    "importance":"high|medium|low", "difficulty":"high|medium|low", "keywords":["word"]}]}.
    Every point needs a literal source excerpt and an exact chunk_id. Empty points are valid if no useful information exists."""
    try:
        result = ExtractionResponse.model_validate(
            provider.complete_json(
                instructions,
                json.dumps(
                    [{"chunk_id": c.id, "page": c.page_number, "text": c.text} for c in chunks],
                    ensure_ascii=False,
                ),
            )
        )
    except ValidationError:
        raise AppError(
            "The model returned an invalid knowledge structure. Retry with a JSON-capable model.",
            "invalid_knowledge",
            502,
        ) from None
    lookup = {c.id: c for c in chunks}
    points = []
    for point in result.points:
        source = lookup.get(point.chunk_id)
        if source and normalize(point.source_excerpt) in normalize(source.text):
            points.append({**point.model_dump(), "page_number": source.page_number})
    return points


def retrieve(
    db: Session,
    document: Document,
    question: str,
    provider: Provider,
    top_k: int,
    min_similarity: float,
) -> list[Chunk]:
    if document.embedding_signature != provider.signature:
        raise AppError(
            "The embedding model changed. Reprocess this document to rebuild its index.",
            "reindex_required",
            409,
        )
    query = demo_search_text(question) if isinstance(provider, DemoProvider) else question
    vector = provider.embeddings([query])[0]
    distance = Chunk.embedding.cosine_distance(vector)
    results = db.execute(
        select(Chunk, distance.label("distance"))
        .where(Chunk.document_id == document.id)
        .order_by(distance)
        .limit(top_k)
    ).all()
    return [chunk for chunk, score in results if 1 - float(score) >= min_similarity]


def demo_answer(question: str, chunks: list[Chunk]) -> dict:
    # Extractive preview, not generated prose. Require actual lexical overlap as well as hashed ranking.
    query = set(tokens(demo_search_text(question)))
    candidates = [c for c in chunks if len(query & set(tokens(c.text))) >= 1]
    if not candidates:
        return {
            "answer": "当前资料中没有找到足够依据。",
            "chunk_ids": [],
        }
    best = candidates[:2]
    snippets = []
    for chunk in best:
        sentences = [normalize(x) for x in chunk.text.split(". ") if len(x) > 30]
        sentences.sort(key=lambda x: len(query & set(tokens(x))), reverse=True)
        snippets.append(f"{sentences[0][:500].rstrip('.')}.")
    return {
        "answer": "演示 · 以下为英文样例的原文摘录，不是真实 AI 生成的回答。\n\n"
        + "\n\n".join(snippets),
        "chunk_ids": [c.id for c in best],
    }


def review_schedule(grade: str, interval: int, ease: float, review_count: int, today: date) -> dict:
    if grade == "again":
        interval, ease = 1, max(1.3, ease - 0.2)
    elif grade == "hard":
        interval, ease = max(1, round(max(interval, 1) * 1.2)), max(1.3, ease - 0.15)
    elif grade == "good":
        interval = 1 if review_count == 0 else 3 if interval <= 1 else round(interval * ease)
    elif grade == "easy":
        interval, ease = max(4, round(max(interval, 1) * (ease + 0.3))), min(3.5, ease + 0.15)
    else:
        raise ValueError("Invalid review grade")
    interval = min(interval, 365)
    return {
        "interval": interval,
        "ease": ease,
        "review_count": review_count + 1,
        "next_review_date": today + timedelta(days=interval),
    }


def build_schedule(
    points: list[KnowledgePoint],
    exam_date: date,
    daily_minutes: int,
    days_per_week: int,
    priority: str,
    today: date | None = None,
) -> list[dict]:
    today = today or date.today()
    if not today < exam_date <= today + timedelta(days=365):
        raise AppError(
            "Choose an exam date between tomorrow and one year from today.", "invalid_exam_date"
        )
    if not points:
        raise AppError(
            "Generate knowledge points before creating a study plan.", "knowledge_required", 409
        )
    # Evenly distributed active days, anchored at plan creation rather than locale-specific weekdays.
    weekdays = set(round(i * 7 / days_per_week) % 7 for i in range(days_per_week))
    available = [
        today + timedelta(days=i) for i in range((exam_date - today).days + 1) if i % 7 in weekdays
    ]
    used = {day: 0 for day in available}
    tasks = []

    def place(point: KnowledgePoint, kind: str, earliest: date, minutes: int):
        slot = next(
            (day for day in available if day >= earliest and used[day] + minutes <= daily_minutes),
            None,
        )
        if slot is None:
            raise AppError(
                "There is not enough time for learning plus spaced reviews. Increase daily minutes, study days, or move the exam date.",
                "insufficient_capacity",
                422,
            )
        used[slot] += minutes
        tasks.append(
            dict(
                title=point.title,
                scheduled_date=slot,
                minutes=minutes,
                kind=kind,
                knowledge_ids=[point.id],
            )
        )
        return slot

    ordered = sorted(
        points,
        key=lambda p: (
            0 if priority == "important" and p.importance == "high" else 1,
            p.page_number,
        ),
    )
    for point in ordered:
        duration = min(daily_minutes, {"low": 8, "medium": 12, "high": 16}[point.difficulty])
        learned = place(point, "learn", today, duration)
        reviewed = place(point, "review", learned + timedelta(days=1), 5)
        if point.importance == "high":
            place(point, "focus", reviewed + timedelta(days=3), 5)
    # Final active day gets a short synthesis task; capacity remains enforced.
    final = available[-1]
    if used[final] + 10 <= daily_minutes:
        tasks.append(
            dict(
                title="综合回顾 · 串联核心知识点",
                scheduled_date=final,
                minutes=10,
                kind="sprint",
                knowledge_ids=[p.id for p in ordered if p.importance == "high"],
            )
        )
    return sorted(tasks, key=lambda t: (t["scheduled_date"], t["kind"]))
