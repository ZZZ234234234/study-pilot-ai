"use client";
import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import useSWR from "swr";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Minus,
  Plus,
  AlignLeft,
} from "lucide-react";
import { ensureSession, errorMessage } from "@/lib/api";
import { ErrorState, Spinner } from "./ui";

export function PdfReader({
  id,
  page,
  count,
  onPage,
}: {
  id: string;
  page: number;
  count: number;
  onPage: (page: number) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [width, setWidth] = useState(500);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string>();
  const [rendering, setRendering] = useState(false);
  const [textView, setTextView] = useState(false);
  const { data: pageText } = useSWR<{ text: string }[]>(
    textView ? `/documents/${id}/pages?page=${page}` : null,
  );
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width - 48),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    let task:
      ReturnType<(typeof import("pdfjs-dist"))["getDocument"]> | undefined;
    void (async () => {
      try {
        await ensureSession();
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        task = pdfjs.getDocument({
          url: `/api/v1/documents/${id}/file`,
          withCredentials: true,
        });
        const loaded = await task.promise;
        if (!disposed) setPdf(loaded);
      } catch (e) {
        if (!disposed) setError(errorMessage(e));
      }
    })();
    return () => {
      disposed = true;
      void task?.destroy();
    };
  }, [id]);
  useEffect(() => {
    if (!pdf || !canvas.current || textView) return;
    let disposed = false;
    let render:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    void (async () => {
      try {
        setRendering(true);
        const current = await pdf.getPage(page);
        if (disposed || !canvas.current) return;
        const natural = current.getViewport({ scale: 1 });
        const scale = Math.max(0.3, width / natural.width) * zoom;
        const viewport = current.getViewport({ scale });
        const target = canvas.current;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        target.width = viewport.width * dpr;
        target.height = viewport.height * dpr;
        target.style.width = `${viewport.width}px`;
        target.style.height = `${viewport.height}px`;
        const context = target.getContext("2d");
        if (!context) return;
        render = current.render({
          canvas: target,
          canvasContext: context,
          viewport,
          transform: [dpr, 0, 0, dpr, 0, 0],
        });
        await render.promise;
      } catch (e) {
        if (
          !disposed &&
          e instanceof Error &&
          e.name !== "RenderingCancelledException"
        )
          setError(e.message);
      } finally {
        if (!disposed) setRendering(false);
      }
    })();
    return () => {
      disposed = true;
      render?.cancel();
    };
  }, [pdf, page, width, zoom, textView]);
  return (
    <div className="pdf-reader">
      <div className="reader-toolbar">
        <div>
          <span className="reader-label">ORIGINAL PDF</span>
          <button
            className="icon-button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <label className="page-select">
            <select
              aria-label="PDF page"
              value={page}
              onChange={(e) => onPage(Number(e.target.value))}
            >
              {Array.from({ length: Math.max(1, count) }, (_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span>/ {count || "—"}</span>
          </label>
          <button
            className="icon-button"
            aria-label="Next page"
            disabled={page >= count}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div>
          <button
            className="icon-button"
            aria-label="Zoom out"
            disabled={zoom <= 0.7}
            onClick={() => setZoom((v) => Math.max(0.7, v - 0.1))}
          >
            <Minus size={15} />
          </button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button
            className="icon-button"
            aria-label="Zoom in"
            disabled={zoom >= 1.5}
            onClick={() => setZoom((v) => Math.min(1.5, v + 0.1))}
          >
            <Plus size={15} />
          </button>
          <button
            className={`icon-button ${textView ? "selected" : ""}`}
            aria-label="Toggle accessible text view"
            onClick={() => setTextView((v) => !v)}
          >
            <AlignLeft size={17} />
          </button>
          <a
            className="icon-button"
            aria-label="Download original PDF"
            href={`/api/v1/documents/${id}/file`}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
      <div className="pdf-canvas-area" ref={holder} data-page={page}>
        {error ? (
          <ErrorState error={new Error(error)} />
        ) : textView ? (
          <article className="pdf-text-view">
            <h3>Page {page} · extracted text</h3>
            <p>{pageText?.[0]?.text ?? "Loading text…"}</p>
          </article>
        ) : (
          <>
            {!pdf && <Spinner label="Opening original PDF" />}
            {rendering && pdf && (
              <span className="pdf-rendering">
                <Spinner label="Rendering" />
              </span>
            )}
            <canvas ref={canvas} aria-label={`PDF page ${page} of ${count}`} />
          </>
        )}
      </div>
      <div className="reader-footer">
        <span className="status-dot" />
        You’re reading the original source.<span>Page {page}</span>
      </div>
    </div>
  );
}
