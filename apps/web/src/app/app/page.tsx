"use client";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeading,
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import { DemoButton } from "@/components/demo-button";
import type { Dashboard } from "@/lib/types";
import { dateLabel, errorMessage, patch } from "@/lib/api";

export default function DashboardPage() {
  const { data, error, mutate } = useSWR<Dashboard>("/dashboard", {
    refreshInterval: 5000,
  });
  if (error) return <ErrorState error={error} retry={() => mutate()} />;
  if (!data) return <Skeleton lines={5} />;
  async function complete(id: string) {
    try {
      await patch(`/tasks/${id}`, { completed: true });
      await mutate();
      toast.success("A little progress, saved.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR LEARNING, IN FOCUS"
        title="A good day to understand more."
        description="Pick up a thought. Make a little progress. Keep going."
      >
        <Link href="/app/library?upload=1" className="button primary">
          <Plus size={18} />
          Upload a PDF
        </Link>
      </PageHeading>
      <div className="dashboard-stats">
        {[
          [data.document_count, "Documents", "A growing collection"],
          [data.knowledge_count, "Knowledge points", "Ideas worth keeping"],
          [data.reviews_today, "Reviews today", "Small steps, real progress"],
          [`${data.study_minutes}m`, "Study time", "From completed tasks"],
        ].map(([value, label, note]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              {value}
              <i />
            </strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <h2>Continue learning</h2>
            <Link href="/app/library">
              View library <ArrowUpRight size={16} />
            </Link>
          </div>
          {!data.documents.length ? (
            <div className="panel">
              <EmptyState
                title="Your next chapter starts here."
                description="Upload a PDF to build your first knowledge map, or explore our original sample."
              >
                <DemoButton onCreated={() => mutate()} />
              </EmptyState>
            </div>
          ) : (
            <div className="continue-list">
              {data.documents.slice(0, 2).map((doc, index) => (
                <Link
                  className={`continue-document document-tone-${index}`}
                  key={doc.id}
                  href={`/app/documents/${doc.id}`}
                >
                  <div className="book-cover">
                    <BookOpen size={38} strokeWidth={1.2} />
                    <span>
                      FIELD
                      <br />
                      NOTES
                    </span>
                  </div>
                  <div className="continue-info">
                    <div>
                      <Badge tone={doc.status === "ready" ? "green" : "amber"}>
                        {doc.status === "ready" ? "Ready to learn" : doc.status}
                      </Badge>
                      {doc.is_demo && (
                        <span className="muted tiny">Original sample</span>
                      )}
                    </div>
                    <h3>{doc.title}</h3>
                    <p>
                      {doc.page_count} pages <span>·</span>{" "}
                      {doc.knowledge_count} knowledge points
                    </p>
                    <span className="text-button">
                      Open workspace <ArrowRight size={15} />
                    </span>
                  </div>
                  <ArrowUpRight className="continue-arrow" size={23} />
                </Link>
              ))}
            </div>
          )}
          <div className="learning-note">
            <span>
              <Sparkles size={22} />
            </span>
            <div>
              <p className="eyebrow">MAKE IT STICK</p>
              <h3>
                Reading gives you information.
                <br />
                Retrieval makes it yours.
              </h3>
              <p>Try explaining one concept before looking at your notes.</p>
            </div>
          </div>
          <div className="section-heading">
            <h2>Recent questions</h2>
            <span className="muted tiny">Your curiosity, collected</span>
          </div>
          <div className="recent-questions">
            {data.recent_questions.length ? (
              data.recent_questions.map((q) => (
                <p key={q.id}>
                  <span>Q</span>
                  {q.content}
                </p>
              ))
            ) : (
              <p className="muted">
                No questions yet. Open a document and follow an idea.
              </p>
            )}
          </div>
        </section>
        <aside className="dashboard-aside">
          <section className="panel today-panel">
            <div className="section-heading">
              <h2>On your desk today</h2>
              <span className="tiny muted">
                {dateLabel(new Date().toISOString())}
              </span>
            </div>
            <div className="today-count">
              <strong>{data.tasks.length + data.due_cards.length}</strong>
              <span>
                things to revisit
                <br />
                <small>A little at a time.</small>
              </span>
              <Clock3 size={25} />
            </div>
            {data.tasks.slice(0, 4).map((task) => (
              <div className="task-row" key={task.id}>
                <button
                  aria-label={`Complete ${task.title}`}
                  className="task-check"
                  onClick={() => complete(task.id)}
                >
                  <Check size={14} />
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <span>
                    {task.kind} · {task.minutes} min
                  </span>
                </div>
              </div>
            ))}
            {data.due_cards.length > 0 && (
              <Link
                href={`/app/documents/${data.due_cards[0].document_id}?tab=flashcards`}
                className="review-callout"
              >
                <BookOpen size={17} />
                {data.due_cards.length} flashcards ready
                <ChevronRight size={16} />
              </Link>
            )}
            {!data.tasks.length && !data.due_cards.length && (
              <p className="calm-empty">
                A clear desk. Create a study plan or flashcards to schedule your
                next session.
              </p>
            )}
            <Link className="button secondary full" href="/app/study-plan">
              View study plan <ArrowUpRight size={16} />
            </Link>
          </section>
          <section className="progress-panel">
            <div>
              <p className="eyebrow">THE BIGGER PICTURE</p>
              <h3>Every session counts.</h3>
              <p>
                {data.completed_tasks} of {data.total_tasks} tasks complete
              </p>
            </div>
            <div
              className="progress-ring"
              style={
                { "--progress": `${data.progress}%` } as React.CSSProperties
              }
            >
              <span>
                {data.progress}
                <small>%</small>
              </span>
            </div>
          </section>
          <div className="workspace-privacy">
            <span className="status-dot" />
            <p>
              This is your personal browser workspace.
              <br />
              <Link href="/privacy">How your data is stored ↗</Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
