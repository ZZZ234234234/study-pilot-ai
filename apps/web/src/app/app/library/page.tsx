"use client";
import Link from "next/link";
import useSWR from "swr";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileText,
  Plus,
  Search,
  Trash2,
  Pencil,
  RotateCw,
  ListFilter,
} from "lucide-react";
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
import { DemoButton } from "@/components/demo-button";
import { UploadDialog } from "@/components/upload-dialog";
import { api, dateLabel, errorMessage, patch, post } from "@/lib/api";
import type { Document } from "@/lib/types";

export default function LibraryPage() {
  return (
    <Suspense fallback={<Skeleton lines={4} />}>
      <LibraryContent />
    </Suspense>
  );
}

function LibraryContent() {
  const params = useSearchParams();
  const { data, error, mutate } = useSWR<Document[]>("/documents", {
    refreshInterval: 3000,
  });
  const [upload, setUpload] = useState(params.get("upload") === "1");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState<Document>();
  const [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState<Document>();
  const [busy, setBusy] = useState(false);
  const documents = data?.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || d.status === filter),
  );
  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await patch(`/documents/${edit.id}`, { title });
      setEdit(undefined);
      mutate();
      toast.success("Document renamed.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/documents/${deleting.id}`, { method: "DELETE" });
      setDeleting(undefined);
      mutate();
      toast.success("Document and related learning data deleted.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function retry(id: string) {
    try {
      await post(`/documents/${id}/reprocess`);
      mutate();
      toast.success("Document queued again.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="COLLECT LESS. CONNECT MORE."
        title="Your library."
        description="A home for the ideas you’re making your own."
      >
        <button className="button primary" onClick={() => setUpload(true)}>
          <Plus size={18} />
          Upload PDF
        </button>
      </PageHeading>
      <div className="library-tools">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Search documents"
            placeholder="Find something in your library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>PDF</kbd>
        </label>
        <label className="filter-select">
          <ListFilter size={16} />
          <select
            aria-label="Filter document status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All documents</option>
            <option value="ready">Ready</option>
            <option value="indexing">Indexing</option>
            <option value="failed">Failed</option>
          </select>
        </label>
      </div>
      <div className="section-heading">
        <h2>
          {search ? "Search results" : "All documents"}{" "}
          <span className="count-label">{documents?.length ?? 0}</span>
        </h2>
        <span className="tiny muted">Most recent first</span>
      </div>
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : !documents ? (
        <Skeleton lines={4} />
      ) : documents.length ? (
        <div className="library-grid">
          {documents.map((doc, i) => (
            <article className="library-document" key={doc.id}>
              <Link
                href={`/app/documents/${doc.id}`}
                className={`document-art art-${i % 3}`}
              >
                <div className="document-sheet">
                  <span>STUDYPILOT / READING NOTES</span>
                  <BookOpen size={39} strokeWidth={1.2} />
                  <strong>{doc.title}</strong>
                  <span className="sheet-line" />
                  <span className="sheet-line short" />
                  <small>
                    {doc.page_count || "—"} PAGES <ArrowUpRight size={14} />
                  </small>
                </div>
                {doc.is_demo && (
                  <span className="sample-flag">Original sample</span>
                )}
              </Link>
              <div className="library-doc-info">
                <div>
                  <Badge tone={doc.status === "ready" ? "green" : "amber"}>
                    {doc.status === "ready" ? (
                      <>
                        <Check size={11} />
                        Ready
                      </>
                    ) : doc.status === "failed" ? (
                      "Needs attention"
                    ) : (
                      <Spinner label={doc.status} />
                    )}
                  </Badge>
                  <span className="tiny muted">
                    {dateLabel(doc.created_at)}
                  </span>
                </div>
                <Link href={`/app/documents/${doc.id}`}>
                  <h3>{doc.title}</h3>
                </Link>
                <p>
                  {doc.page_count} pages <span>·</span> {doc.knowledge_count}{" "}
                  knowledge points
                </p>
                {doc.status === "failed" && (
                  <p className="form-error small-error">{doc.error}</p>
                )}
                {doc.status !== "ready" && doc.status !== "failed" && (
                  <div className="upload-progress">
                    <span style={{ width: `${doc.progress}%` }} />
                  </div>
                )}
                <div className="document-actions">
                  <Link
                    href={`/app/documents/${doc.id}`}
                    className="text-button"
                  >
                    Open document <ArrowUpRight size={15} />
                  </Link>
                  <div>
                    {doc.status === "failed" && (
                      <button
                        className="icon-button"
                        aria-label={`Retry ${doc.title}`}
                        onClick={() => retry(doc.id)}
                      >
                        <RotateCw size={15} />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      aria-label={`Rename ${doc.title}`}
                      onClick={() => {
                        setEdit(doc);
                        setTitle(doc.title);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${doc.title}`}
                      onClick={() => setDeleting(doc)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          <button className="add-document" onClick={() => setUpload(true)}>
            <span>
              <Plus size={26} />
            </span>
            <strong>Make room for a new idea.</strong>
            <p>Add another PDF to your library</p>
          </button>
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title={
              search ? "No documents found." : "A blank page. A good beginning."
            }
            description={
              search
                ? "Try a different title or status filter."
                : "Add course notes, a research paper, or our original eight-page sample."
            }
          >
            {!search && <DemoButton onCreated={() => mutate()} />}
          </EmptyState>
        </div>
      )}
      <div className="library-bottom-note">
        <FileText size={20} />
        <p>
          Text-based PDFs work best. Scanned documents need OCR before
          uploading.
          <br />
          <span>Maximum 20 MB and 300 pages per document.</span>
        </p>
        <DemoButton className="text-button" onCreated={() => mutate()}>
          Add sample
        </DemoButton>
      </div>
      {upload && (
        <UploadDialog
          onClose={() => setUpload(false)}
          onUploaded={() => {
            setUpload(false);
            mutate();
          }}
        />
      )}
      {edit && (
        <Modal title="Rename document" onClose={() => setEdit(undefined)}>
          <label className="field">
            Document title
            <input
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <button
            className="button primary full"
            disabled={busy || !title.trim()}
            onClick={save}
          >
            {busy ? <Spinner /> : "Save title"}
          </button>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Let this document go?"
          onClose={() => setDeleting(undefined)}
        >
          <p>
            Deleting <strong>{deleting.title}</strong> also permanently removes
            its PDF, extracted text, embeddings, knowledge points,
            conversations, study plan, cards, and quiz records.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(undefined)}
            >
              Keep document
            </button>
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? <Spinner /> : "Delete permanently"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
