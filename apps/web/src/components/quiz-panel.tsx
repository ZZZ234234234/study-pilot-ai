"use client";
import { useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, Check, CircleHelp } from "lucide-react";
import { EmptyState, ErrorState, Spinner } from "./ui";
import { errorMessage, post } from "@/lib/api";
import type { Quiz, QuizResult } from "@/lib/types";

export function QuizPanel({
  id,
  onPage,
}: {
  id: string;
  onPage: (page: number) => void;
}) {
  const {
    data: quiz,
    mutate,
    error,
  } = useSWR<Quiz | null>(`/documents/${id}/quiz`);
  const [count, setCount] = useState(5);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [result, setResult] = useState<QuizResult>();
  async function generate() {
    setBusy(true);
    setFailure("");
    try {
      const data = await post<Quiz>(`/documents/${id}/quiz`, { count });
      setResult(undefined);
      setAnswers({});
      await mutate(data, false);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!quiz) return;
    setBusy(true);
    setFailure("");
    try {
      const value = await post<QuizResult>(`/quizzes/${quiz.id}/submit`, {
        answers: quiz.questions.map((_, i) => answers[i] ?? ""),
      });
      setResult(value);
      await mutate(null, false);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="quiz-panel">
      <div className="assistant-heading">
        <div className="eyebrow">
          <CircleHelp size={14} />
          CHECK YOUR UNDERSTANDING
        </div>
        <h2>What stayed with you?</h2>
        <p>Practice questions, rooted in what you’ve read.</p>
      </div>
      {error && <ErrorState error={error} />}
      <div className="quiz-controls">
        <label className="field inline">
          Questions
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={busy}
          >
            {[5, 10, 20].map((n) => (
              <option value={n} key={n}>
                {n} questions
              </option>
            ))}
          </select>
        </label>
        <button
          className="button primary small"
          onClick={generate}
          disabled={busy || !!quiz}
        >
          {busy ? (
            <Spinner label="Preparing" />
          ) : result ? (
            "Practice again"
          ) : (
            "Create quiz"
          )}
        </button>
      </div>
      {failure && (
        <p role="alert" className="form-error">
          {failure}
        </p>
      )}
      {!quiz && !result && !busy && (
        <EmptyState
          title="A question is a mirror."
          description="Multiple choice, true / false, and short answers help reveal what you understand—and what to revisit."
        />
      )}
      {quiz && (
        <div className="quiz-questions">
          {quiz.questions.map((q, i) => (
            <fieldset key={`${quiz.id}-${i}`} className="quiz-question">
              <legend>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {q.question}
              </legend>
              {q.kind === "short_answer" ? (
                <textarea
                  aria-label={`Answer question ${i + 1}`}
                  rows={3}
                  maxLength={2000}
                  value={answers[i] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [i]: e.target.value }))
                  }
                  placeholder="Explain it in your own words…"
                />
              ) : (
                q.options.map((option) => (
                  <label
                    className={answers[i] === option ? "selected" : ""}
                    key={option}
                  >
                    <input
                      type="radio"
                      name={`question-${i}`}
                      value={option}
                      checked={answers[i] === option}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [i]: option }))
                      }
                    />
                    {option}
                  </label>
                ))
              )}
            </fieldset>
          ))}
          <button
            className="button primary full"
            disabled={
              busy || quiz.questions.some((_, i) => !answers[i]?.trim())
            }
            onClick={submit}
          >
            {busy ? (
              <Spinner label="Checking answers" />
            ) : (
              "Check my understanding"
            )}
          </button>
        </div>
      )}
      {result && (
        <div className="quiz-results">
          <div className="quiz-score">
            <span>PRACTICE SCORE</span>
            <strong>
              {result.score}
              <small>/100</small>
            </strong>
            <p>
              {result.score >= 80
                ? "The ideas are connecting."
                : "Now you know what to revisit."}
            </p>
          </div>
          <p className="grading-note">{result.grading_note}</p>
          {result.results.map((q, i) => (
            <article key={i} className={q.correct ? "correct" : "incorrect"}>
              <span className="result-status">
                {q.correct ? <Check size={15} /> : <CircleHelp size={15} />}
                Question {i + 1} · {q.correct ? "Got it" : "Revisit this"}
              </span>
              <h3>{q.question}</h3>
              <p>
                <strong>Your answer:</strong> {q.your_answer}
              </p>
              <p>
                <strong>Reference answer:</strong> {q.correct_answer}
              </p>
              <p>{q.explanation}</p>
              <button
                className="source-link"
                onClick={() => onPage(q.page_number)}
              >
                Check source · Page {q.page_number}
                <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
