from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


class RenameRequest(BaseModel):
    title: str = Field(min_length=1, max_length=180)


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1200)


class PlanRequest(BaseModel):
    exam_date: date
    daily_minutes: int = Field(default=45, ge=15, le=240)
    days_per_week: int = Field(default=5, ge=1, le=7)
    priority: Literal["balanced", "important"] = "balanced"


class TaskRequest(BaseModel):
    completed: bool


class ReviewRequest(BaseModel):
    grade: Literal["again", "hard", "good", "easy"]


class QuizRequest(BaseModel):
    count: Literal[5, 10, 20] = 5


class QuizAnswers(BaseModel):
    answers: list[str] = Field(min_length=1, max_length=20)


class ExtractedPoint(BaseModel):
    chunk_id: str = Field(max_length=36)
    chapter: str = Field(min_length=1, max_length=200)
    topic: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=200)
    explanation: str = Field(min_length=5, max_length=1400)
    source_excerpt: str = Field(min_length=15, max_length=600)
    importance: Literal["high", "medium", "low"]
    difficulty: Literal["high", "medium", "low"]
    keywords: list[str] = Field(max_length=8)


class ExtractionResponse(BaseModel):
    points: list[ExtractedPoint] = Field(max_length=20)


class AnswerResponse(BaseModel):
    answer: str = Field(max_length=7000)
    chunk_ids: list[str] = Field(max_length=12)


class QuizQuestion(BaseModel):
    question: str = Field(min_length=5, max_length=600)
    kind: Literal["multiple_choice", "true_false", "short_answer"]
    options: list[str] = Field(max_length=5)
    correct_answer: str = Field(min_length=1, max_length=500)
    explanation: str = Field(max_length=1200)
    knowledge_id: str
    keywords: list[str] = Field(default_factory=list, max_length=8)


class QuizResponse(BaseModel):
    questions: list[QuizQuestion] = Field(min_length=1, max_length=20)
