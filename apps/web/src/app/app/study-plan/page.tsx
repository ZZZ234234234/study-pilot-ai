"use client";
import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import { CalendarDays, Check, Clock3, Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  EmptyState,
  ErrorState,
  Modal,
  PageHeading,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { dateLabel, errorMessage, patch, post, todayISO } from "@/lib/api";
import type { Document, StudyPlan, StudyTask } from "@/lib/types";

export default function StudyPlanPage() {
  const { data: plans, error, mutate } = useSWR<StudyPlan[]>("/plans");
  const { data: documents } = useSWR<Document[]>("/documents");
  const [open, setOpen] = useState(false);
  const [docId, setDocId] = useState("");
  const [exam, setExam] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [minutes, setMinutes] = useState(45);
  const [days, setDays] = useState(5);
  const [priority, setPriority] = useState("balanced");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [selected, setSelected] = useState("");
  const available =
    documents?.filter((d) => d.status === "ready" && d.knowledge_count > 0) ??
    [];
  const plan = plans?.find((p) => p.id === selected) ?? plans?.[0];
  const groups = Object.groupBy(plan?.tasks ?? [], (t) => t.scheduled_date);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      const result = await post<StudyPlan>(
        `/documents/${docId || available[0]?.id}/plans`,
        {
          exam_date: exam,
          daily_minutes: minutes,
          days_per_week: days,
          priority,
        },
      );
      setSelected(result.id);
      await mutate();
      setOpen(false);
      toast.success("A realistic learning plan, ready for you.");
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function complete(task: StudyTask) {
    try {
      await patch(`/tasks/${task.id}`, { completed: !task.completed });
      await mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="STEADY IS A SUPERPOWER"
        title="A little better, every day."
        description="Make a plan that fits your life—not the other way around."
      >
        <button className="button primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Create study plan
        </button>
      </PageHeading>
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : !plans ? (
        <Skeleton lines={4} />
      ) : !plan ? (
        <div className="panel">
          <EmptyState
            title="Give your learning a rhythm."
            description="Choose a document, a target date, and a little time each day. We’ll schedule learning, spaced review, and a final recall session."
          >
            <button className="button primary" onClick={() => setOpen(true)}>
              Build my first plan <ArrowUpRight size={16} />
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="plan-overview">
            <div>
              <Badge tone="green">YOUR ACTIVE PLAN</Badge>
              <h2>
                {documents?.find((d) => d.id === plan.document_id)?.title}
              </h2>
              <p>
                <CalendarDays size={16} />
                Target: {dateLabel(plan.exam_date)} <span>·</span>
                <Clock3 size={16} />
                {plan.daily_minutes} min / day <span>·</span>
                {plan.days_per_week} days / week
              </p>
            </div>
            <div className="plan-completion">
              <strong>
                {plan.tasks.filter((t) => t.completed).length}
                <span> / {plan.tasks.length}</span>
              </strong>
              <small>TASKS COMPLETE</small>
            </div>
          </div>
          <div className="plan-toolbar">
            <h2>Your learning path</h2>
            {plans.length > 1 && (
              <select
                aria-label="Choose study plan"
                value={plan.id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {documents?.find((d) => d.id === p.document_id)?.title ??
                      "Study plan"}
                  </option>
                ))}
              </select>
            )}
            <div className="plan-legend">
              <span className="learn-dot" />
              Learn <span className="review-dot" />
              Review <span className="focus-dot" />
              Focus
            </div>
          </div>
          <div className="plan-timeline">
            {Object.entries(groups).map(([day, tasks]) => (
              <section className="plan-day" key={day}>
                <div className="plan-date">
                  <span>
                    {new Date(`${day}T12:00:00`).toLocaleDateString("en", {
                      weekday: "short",
                    })}
                  </span>
                  <strong>{new Date(`${day}T12:00:00`).getDate()}</strong>
                  <small>{dateLabel(day).split(" ")[0]}</small>
                  {day === todayISO() && <Badge tone="green">Today</Badge>}
                </div>
                <div className="plan-day-tasks">
                  {tasks?.map((task) => (
                    <div
                      className={`plan-task ${task.completed ? "completed" : ""}`}
                      key={task.id}
                    >
                      <button
                        className={`task-check ${task.completed ? "checked" : ""}`}
                        aria-label={`${task.completed ? "Mark incomplete" : "Complete"} ${task.title}`}
                        onClick={() => complete(task)}
                      >
                        <Check size={16} />
                      </button>
                      <div>
                        <span className={`task-kind kind-${task.kind}`}>
                          {task.kind === "learn"
                            ? "FIRST LEARNING"
                            : task.kind === "focus"
                              ? "KEY CONCEPT REVIEW"
                              : task.kind === "sprint"
                                ? "FINAL RECALL"
                                : "SPACED REVIEW"}
                        </span>
                        <h3>{task.title}</h3>
                      </div>
                      <span className="task-duration">{task.minutes} min</span>
                      <Link
                        className="icon-button"
                        aria-label={`Open source for ${task.title}`}
                        href={`/app/documents/${task.document_id}?tab=knowledge`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      {open && (
        <Modal
          title="Make a little time for progress."
          onClose={() => setOpen(false)}
        >
          {!available.length ? (
            <EmptyState
              title="Start with a knowledge map."
              description="Add the original sample or process a PDF with an AI provider before creating a plan."
            >
              <Link href="/app/library" className="button primary">
                Go to library
              </Link>
            </EmptyState>
          ) : (
            <form onSubmit={create} className="plan-form">
              <label className="field">
                Document
                <select
                  value={docId || available[0]?.id}
                  onChange={(e) => setDocId(e.target.value)}
                >
                  {available.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label className="field">
                  Target / exam date
                  <input
                    type="date"
                    value={exam}
                    min={todayISO()}
                    required
                    onChange={(e) => setExam(e.target.value)}
                  />
                </label>
                <label className="field">
                  Minutes per day
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  Days per week
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <option value={d} key={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Priority
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="balanced">Follow the document</option>
                    <option value="important">Important concepts first</option>
                  </select>
                </label>
              </div>
              <div className="form-note">
                Learning time adapts to difficulty; review is spaced by at least
                one day. An existing plan for this document will be replaced.
                Schedules that exceed your capacity are rejected, not silently
                overbooked.
              </div>
              {failure && (
                <p role="alert" className="form-error">
                  {failure}
                </p>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? (
                  <Spinner label="Building your plan" />
                ) : (
                  "Create my study plan"
                )}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
