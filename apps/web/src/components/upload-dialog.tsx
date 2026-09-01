"use client";
import { useRef, useState } from "react";
import { UploadCloud, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Modal, Spinner } from "./ui";
import { errorMessage, uploadPdf } from "@/lib/api";
import type { Document } from "@/lib/types";

export function UploadDialog({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (doc: Document) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  function choose(value?: File) {
    setError("");
    if (!value) return;
    if (!value.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF document.");
      return;
    }
    if (value.size > 20 * 1024 * 1024) {
      setError("Choose a PDF smaller than 20 MB.");
      return;
    }
    setFile(value);
  }
  async function submit() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const doc = await uploadPdf<Document>(file, setProgress);
      toast.success(
        "PDF uploaded. Your knowledge workspace is being prepared.",
      );
      onUploaded(doc);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Start with a document."
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="muted">
        Bring the material. We’ll help you find the meaning.
      </p>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Choose PDF file"
        className="sr-only"
        onChange={(e) => choose(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        className={`upload-zone ${drag ? "dragging" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choose(e.dataTransfer.files[0]);
        }}
      >
        <span>
          <UploadCloud size={30} strokeWidth={1.4} />
        </span>
        <strong>
          {file ? "Choose a different PDF" : "Drop your PDF here"}
        </strong>
        <p>or click to browse your files</p>
        <small>PDF only · up to 20 MB · text-based documents</small>
      </button>
      {file && (
        <div className="selected-file">
          <FileText size={23} />
          <div>
            <strong>{file.name}</strong>
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          {busy && <b>{progress}%</b>}
        </div>
      )}
      {busy && (
        <div className="upload-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <p className="privacy-hint">
        <ShieldCheck size={15} />
        Your PDF is private to this browser workspace. In live AI mode, text is
        sent to your configured provider.
      </p>
      <button
        disabled={!file || busy}
        className="button primary full"
        onClick={submit}
      >
        {busy ? (
          <Spinner
            label={progress === 100 ? "Queuing document" : "Uploading PDF"}
          />
        ) : (
          <>
            Upload & prepare <UploadCloud size={17} />
          </>
        )}
      </button>
    </Modal>
  );
}
