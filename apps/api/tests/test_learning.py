from collections import defaultdict
from datetime import date, timedelta

import pytest

from studypilot.errors import AppError
from studypilot.learning import build_schedule, demo_answer, review_schedule
from studypilot.models import KnowledgePoint


def point(identifier="concept", importance="high"):
    return KnowledgePoint(
        id=identifier, title=identifier, page_number=1, difficulty="medium", importance=importance
    )


@pytest.mark.parametrize("grade", ["again", "hard", "good", "easy"])
def test_review_moves_into_future(grade):
    today = date(2026, 9, 1)
    result = review_schedule(grade, 1, 2.5, 0, today)
    assert result["next_review_date"] > today
    assert result["review_count"] == 1
    assert 1.3 <= result["ease"] <= 3.5


def test_review_rejects_unknown_grade():
    with pytest.raises(ValueError):
        review_schedule("perfect", 1, 2.5, 0, date(2026, 9, 1))


def test_schedule_respects_capacity_and_review_order():
    today = date(2026, 9, 1)
    tasks = build_schedule(
        [point(str(i)) for i in range(4)], today + timedelta(days=30), 30, 5, "important", today
    )
    totals = defaultdict(int)
    for task in tasks:
        totals[task["scheduled_date"]] += task["minutes"]
    assert all(value <= 30 for value in totals.values())
    for identifier in map(str, range(4)):
        dates = {
            task["kind"]: task["scheduled_date"]
            for task in tasks
            if task["knowledge_ids"] == [identifier] and task["kind"] != "sprint"
        }
        assert dates["learn"] < dates["review"] < dates["focus"]


def test_schedule_rejects_insufficient_capacity():
    today = date(2026, 9, 1)
    with pytest.raises(AppError) as error:
        build_schedule([point()], today + timedelta(days=1), 15, 7, "balanced", today)
    assert error.value.code == "insufficient_capacity"


def test_schedule_requires_knowledge():
    today = date(2026, 9, 1)
    with pytest.raises(AppError) as error:
        build_schedule([], today + timedelta(days=30), 30, 5, "balanced", today)
    assert error.value.code == "knowledge_required"


def test_no_evidence_has_no_citations():
    result = demo_answer("unrelated question", [])
    assert result["chunk_ids"] == []
    assert result["answer"] == "当前资料中没有找到足够依据。"
