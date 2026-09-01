"use client";
import { useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, Layers3, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, Spinner } from "./ui";
import { dateLabel, errorMessage, post, todayISO } from "@/lib/api";
import type { Flashcard } from "@/lib/types";

export function FlashcardsPanel({
  id,
  onPage,
}: {
  id: string;
  onPage: (page: number) => void;
}) {
  const { data, error, mutate } = useSWR<Flashcard[]>(
    `/documents/${id}/flashcards`,
  );
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const due = data?.filter((c) => c.next_review_date <= todayISO()) ?? [];
  const card = due[0];
  async function create() {
    setBusy(true);
    try {
      await post(`/documents/${id}/flashcards`);
      await mutate();
      toast.success("Source-linked flashcards created.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function grade(value: string) {
    if (!card || busy) return;
    setBusy(true);
    try {
      const updated = await post<Flashcard>(`/flashcards/${card.id}/review`, {
        grade: value,
      });
      setFlipped(false);
      await mutate();
      toast.success(
        `Review saved · next on ${dateLabel(updated.next_review_date)}`,
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flashcards-panel">
      <div className="assistant-heading">
        <div className="eyebrow">
          <Layers3 size={14} />A LITTLE PRACTICE, OFTEN
        </div>
        <h2>Make the ideas stick.</h2>
        <p>Try recalling the answer before turning the card.</p>
      </div>
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : !data ? (
        <Spinner />
      ) : !data.length ? (
        <EmptyState
          title="One idea. One good question."
          description="Create source-linked cards from this document’s knowledge points."
        >
          <button className="button primary" onClick={create} disabled={busy}>
            {busy ? <Spinner /> : "Create flashcards"}
          </button>
        </EmptyState>
      ) : !card ? (
        <EmptyState
          title="You’ve made room for tomorrow."
          description={`All ${data.length} cards are scheduled. Next review: ${dateLabel(data.reduce((a, b) => (a.next_review_date < b.next_review_date ? a : b)).next_review_date)}.`}
        >
          <button className="button secondary" onClick={create} disabled={busy}>
            Sync new knowledge
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="card-progress">
            <span>{due.length} due today</span>
            <span>{data.length} total cards</span>
          </div>
          <button
            className={`flashcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((v) => !v)}
            aria-label={
              flipped ? "Show question" : "Flip card to reveal answer"
            }
          >
            <span className="eyebrow">
              {flipped ? "THE IDEA" : "RECALL FIRST"}
            </span>
            <h3>{flipped ? card.answer : card.question}</h3>
            <span className="flip-hint">
              <RotateCw size={14} />
              {flipped ? "Tap to see question" : "Tap to reveal answer"}
            </span>
          </button>
          <button
            className="source-link"
            onClick={() => onPage(card.page_number)}
          >
            Original source · Page {card.page_number}
            <ArrowUpRight size={14} />
          </button>
          {flipped ? (
            <div className="review-grades">
              {["again", "hard", "good", "easy"].map((grade) => (
                <button
                  key={grade}
                  className={`grade-${grade}`}
                  disabled={busy}
                  onClick={() => void gradeAction(grade)}
                >
                  {grade}
                  <small>
                    {grade === "again"
                      ? "Revisit soon"
                      : grade === "hard"
                        ? "A little longer"
                        : grade === "good"
                          ? "I remembered"
                          : "Very clear"}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p className="calm-empty">
              Recall it in your own words. Then reveal and rate.
            </p>
          )}
          <p className="tiny muted">
            An explainable spaced-review schedule. “Again” means tomorrow;
            successful recall increases the interval.
          </p>
        </>
      )}
    </div>
  );
  async function gradeAction(value: string) {
    await grade(value);
  }
}
