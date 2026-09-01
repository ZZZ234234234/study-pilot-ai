"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Layers3,
  ListTree,
  MessageSquare,
  Search,
  RotateCw,
  CircleHelp,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, ErrorState, Modal, Skeleton, Spinner } from "./ui";
import { PdfReader } from "./pdf-reader";
import { KnowledgePanel } from "./knowledge-panel";
import { ChatPanel } from "./chat-panel";
import { FlashcardsPanel } from "./flashcards-panel";
import { QuizPanel } from "./quiz-panel";
import { api, cn, errorMessage, post } from "@/lib/api";
import type { Document, SearchResult } from "@/lib/types";

export function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  return index < 0 ? (
    <>{text}</>
  ) : (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

const tabs = [
  { id: "chat", label: "Ask AI", icon: MessageSquare },
  { id: "knowledge", label: "Knowledge", icon: ListTree },
  { id: "flashcards", label: "Flashcards", icon: Layers3 },
  { id: "quiz", label: "Quiz", icon: CircleHelp },
];
export function DocumentWorkspace({ id }: { id: string }) {
  const {
    data: doc,
    error,
    mutate,
  } = useSWR<Document>(`/documents/${id}`, {
    refreshInterval: (latest) =>
      latest?.status === "ready" || latest?.status === "failed" ? 0 : 2000,
  });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = tabs.some((t) => t.id === searchParams.get("tab"))
    ? searchParams.get("tab")!
    : "chat";
  const [page, setPage] = useState(1);
  const [mobile, setMobile] = useState("assistant");
  const [split, setSplit] = useState(49);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>();
  const [searching, setSearching] = useState(false);
  const [reprocess, setReprocess] = useState(false);
  const [busy, setBusy] = useState(false);
  function jump(value: number) {
    setPage(value);
    setMobile("pdf");
    setSearchOpen(false);
    toast.info(`Original source · Page ${value}`);
  }
  async function search() {
    if (!q.trim()) return;
    setSearching(true);
    try {
      setResults(
        await api<SearchResult[]>(
          `/documents/${id}/search?q=${encodeURIComponent(q)}`,
        ),
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSearching(false);
    }
  }
  async function retry() {
    setBusy(true);
    try {
      await post(`/documents/${id}/reprocess`);
      setReprocess(false);
      mutate();
      toast.success("Document queued for reprocessing.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (error) return <ErrorState error={error} retry={() => mutate()} />;
  if (!doc) return <Skeleton lines={5} />;
  return (
    <>
      <div className="document-heading">
        <div>
          <Link className="back-link" href="/app/library">
            <ArrowLeft size={15} />
            My library
          </Link>
          <h1>{doc.title}</h1>
          <div className="document-meta">
            <span>{doc.page_count} pages</span>
            <span>·</span>
            <span>{doc.knowledge_count} knowledge points</span>
            <Badge tone={doc.status === "ready" ? "green" : "amber"}>
              {doc.status}
            </Badge>
            {doc.ai_status === "demo" && (
              <Badge tone="amber">Demo sample</Badge>
            )}
          </div>
        </div>
        <div className="document-top-actions">
          <button
            className="icon-button"
            aria-label="Search original PDF"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={20} />
          </button>
          <button
            className="icon-button"
            aria-label="Reprocess document"
            onClick={() => setReprocess(true)}
            disabled={["queued", "parsing", "indexing"].includes(doc.status)}
          >
            <RotateCw size={18} />
          </button>
          <Link href="/app/study-plan" className="button secondary small">
            <CalendarDays size={16} />
            <span>Plan your study</span>
          </Link>
        </div>
      </div>
      {doc.status !== "ready" ? (
        <section className="processing-panel">
          <div className="process-art">
            <BookOpen size={46} strokeWidth={1.2} />
          </div>
          <p className="eyebrow">
            {doc.status === "failed"
              ? "LET’S TRY A DIFFERENT APPROACH"
              : "MAKING SENSE OF YOUR MATERIAL"}
          </p>
          <h2>
            {doc.status === "failed"
              ? "This PDF needs a little attention."
              : doc.status === "queued"
                ? "Your document is in the queue."
                : doc.status === "parsing"
                  ? "Reading, one page at a time."
                  : "Connecting the ideas."}
          </h2>
          <p>
            {doc.error ??
              "Keep this page open or come back later. Processing continues in the background."}
          </p>
          <div className="upload-progress">
            <span style={{ width: `${doc.progress}%` }} />
          </div>
          <div className="processing-steps">
            {["Upload", "Parse", "Index", "Knowledge", "Ready"].map(
              (step, i) => (
                <span
                  className={doc.progress > i * 24 ? "complete" : ""}
                  key={step}
                >
                  {String(i + 1).padStart(2, "0")} {step}
                </span>
              ),
            )}
          </div>
          {doc.status === "failed" ? (
            <button className="button primary" onClick={retry} disabled={busy}>
              Retry document
            </button>
          ) : (
            <Spinner label={`${doc.progress}% · ${doc.status}`} />
          )}
        </section>
      ) : (
        <>
          {doc.ai_status === "not_configured" && (
            <div className="mode-notice">
              Your PDF is parsed and searchable.{" "}
              <Link href="/app/settings">Configure an AI Provider</Link> to
              generate knowledge and answers, then reprocess this document.
            </div>
          )}
          <div className="document-mobile-switch">
            <button
              className={mobile === "pdf" ? "active" : ""}
              onClick={() => setMobile("pdf")}
            >
              <BookOpen size={16} />
              PDF
            </button>
            <button
              className={mobile === "assistant" ? "active" : ""}
              onClick={() => setMobile("assistant")}
            >
              <MessageSquare size={16} />
              Learning assistant
            </button>
          </div>
          <div
            className="split-workspace"
            style={{ "--reader-width": `${split}%` } as React.CSSProperties}
          >
            <div
              className={cn("reader-side", mobile !== "pdf" && "mobile-hidden")}
            >
              <PdfReader
                id={id}
                page={page}
                count={doc.page_count}
                onPage={setPage}
              />
            </div>
            <div className="split-handle">
              <label className="sr-only" htmlFor="split">
                Reader width
              </label>
              <input
                id="split"
                type="range"
                min={35}
                max={65}
                value={split}
                onChange={(e) => setSplit(Number(e.target.value))}
              />
            </div>
            <div
              className={cn(
                "assistant-side",
                mobile !== "assistant" && "mobile-hidden",
              )}
            >
              <nav className="document-tabs" aria-label="Document tools">
                {tabs.map(({ id: tab, label, icon: Icon }) => (
                  <button
                    key={tab}
                    className={active === tab ? "active" : ""}
                    onClick={() =>
                      router.replace(`${pathname}?tab=${tab}`, {
                        scroll: false,
                      })
                    }
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>
              <div className="assistant-panel">
                {active === "chat" ? (
                  <ChatPanel
                    id={id}
                    onPage={jump}
                    isDemo={doc.ai_status === "demo"}
                  />
                ) : active === "knowledge" ? (
                  <KnowledgePanel id={id} onPage={jump} />
                ) : active === "flashcards" ? (
                  <FlashcardsPanel id={id} onPage={jump} />
                ) : (
                  <QuizPanel id={id} onPage={jump} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {searchOpen && (
        <Modal
          title="Find it in the original."
          onClose={() => setSearchOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void search();
            }}
            className="document-search-form"
          >
            <label className="search-input">
              <Search size={18} />
              <input
                aria-label="Search PDF text"
                placeholder="A word, phrase, or idea…"
                maxLength={120}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
            </label>
            <button
              className="button primary small"
              disabled={searching || !q.trim()}
            >
              {searching ? <Spinner /> : "Find"}
            </button>
          </form>
          <div className="search-results">
            {results?.length === 0 ? (
              <p className="calm-empty">No matches found in this document.</p>
            ) : (
              results?.map((r) => (
                <button key={r.page_number} onClick={() => jump(r.page_number)}>
                  <strong>
                    Page {r.page_number}
                    <ArrowUpRight size={16} />
                  </strong>
                  <p>
                    <Highlight text={r.snippet} query={q} />
                  </p>
                </button>
              ))
            )}
          </div>
        </Modal>
      )}
      {reprocess && (
        <Modal
          title="Rebuild this workspace?"
          onClose={() => setReprocess(false)}
        >
          <p>
            Reprocessing uses the current AI provider. Existing knowledge, chat
            history, plans, cards, and quizzes for this document will be
            replaced. The original PDF is kept.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReprocess(false)}
            >
              Cancel
            </button>
            <button className="button primary" onClick={retry} disabled={busy}>
              {busy ? <Spinner /> : "Reprocess document"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
