"use client";
import { useLocale } from "@/components/locale-provider";
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
  Expand,
  ScanLine,
} from "lucide-react";
import { ensureSession, errorMessage } from "@/lib/api";
import { pdfDocumentOptions, PDF_WORKER_SRC } from "@/lib/pdf-options";
import { ErrorState, Spinner } from "./ui";
import { rasterRatio } from "@/lib/reader-layout";
export function PdfReader({
  id,
  page,
  count,
  onPage,
  fullscreen = false,
  onExpand,
}: {
  id: string;
  page: number;
  count: number;
  onPage: (page: number) => void;
  fullscreen?: boolean;
  onExpand?: () => void;
}) {
  const { t } = useLocale();
  const holder = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [width, setWidth] = useState(500);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string>();
  const [rendering, setRendering] = useState(false);
  const [textView, setTextView] = useState(false);
  const showingText = textView && !fullscreen;
  const { data: pageText } = useSWR<
    {
      text: string;
    }[]
  >(showingText ? `/documents/${id}/pages?page=${page}` : null);
  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0)
        setWidth(Math.max(1, entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    holder.current?.scrollTo({ top: 0, left: 0 });
  }, [page, fullscreen]);
  useEffect(() => {
    let disposed = false;
    let task:
      ReturnType<(typeof import("pdfjs-dist"))["getDocument"]> | undefined;
    void (async () => {
      try {
        await ensureSession();
        const pdfjs = await import("pdfjs-dist");
        if (disposed) return;
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        task = pdfjs.getDocument(pdfDocumentOptions(id));
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
    if (!pdf || !canvas.current || showingText) return;
    let disposed = false;
    let render:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    void (async () => {
      try {
        setRendering(true);
        setError(undefined);
        const current = await pdf.getPage(page);
        if (disposed || !canvas.current) return;
        const natural = current.getViewport({ scale: 1 });
        const scale = Math.max(0.05, width / natural.width) * zoom;
        const viewport = current.getViewport({ scale });
        const target = canvas.current;
        const dpr = rasterRatio(
          viewport.width,
          viewport.height,
          window.devicePixelRatio || 1,
        );
        target.width = Math.max(1, Math.floor(viewport.width * dpr));
        target.height = Math.max(1, Math.floor(viewport.height * dpr));
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
          setError(errorMessage(e));
      } finally {
        if (!disposed) setRendering(false);
      }
    })();
    return () => {
      disposed = true;
      render?.cancel();
    };
  }, [pdf, page, width, zoom, showingText]);
  return (
    <div className="pdf-reader">
      <div className="reader-toolbar">
        <div>
          <span className="reader-label">{t("原始 PDF")}</span>
          <button
            className="icon-button"
            aria-label={t("上一页")}
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft size={17} />
          </button>
          <label className="page-select">
            <select
              aria-label={t("PDF 页码")}
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
            aria-label={t("下一页")}
            disabled={page >= count}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div>
          <button
            className="icon-button"
            aria-label={t("缩小")}
            disabled={zoom <= 0.5}
            onClick={() =>
              setZoom((v) => Math.max(0.5, Math.round((v - 0.1) * 10) / 10))
            }
          >
            <Minus size={15} />
          </button>
          <span className="zoom-label" title={t("100% 表示适应阅读区宽度")}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="icon-button"
            aria-label={t("放大")}
            disabled={zoom >= 3}
            onClick={() =>
              setZoom((v) => Math.min(3, Math.round((v + 0.1) * 10) / 10))
            }
          >
            <Plus size={15} />
          </button>
          <button
            className="icon-button"
            aria-label={t("适应宽度")}
            title={t("适应宽度")}
            onClick={() => {
              setZoom(1);
              holder.current?.scrollTo({ left: 0, top: 0 });
            }}
          >
            <ScanLine size={17} />
          </button>
          {!fullscreen && (
            <button
              className={`icon-button ${showingText ? "selected" : ""}`}
              aria-label={t("切换文字阅读视图")}
              onClick={() => setTextView((v) => !v)}
            >
              <AlignLeft size={17} />
            </button>
          )}
          <a
            className="icon-button"
            aria-label={t("下载原始 PDF")}
            href={`/api/v1/documents/${id}/file`}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={16} />
          </a>
        </div>
      </div>
      <div
        className="pdf-canvas-area"
        ref={holder}
        data-page={page}
        tabIndex={0}
        aria-label={t("PDF 阅读区域")}
      >
        {error && <ErrorState error={new Error(error)} />}
        {showingText ? (
          <article className="pdf-text-view">
            <h3>{t("第 {0} 页 · 提取的原文", page)}</h3>
            <p>{pageText?.[0]?.text ?? t("正在加载原文…")}</p>
          </article>
        ) : (
          <>
            {!pdf && !error && <Spinner label={t("正在打开原始 PDF")} />}
            {rendering && pdf && (
              <span className="pdf-rendering">
                <Spinner label={t("正在渲染")} />
              </span>
            )}
            <div className="pdf-page-surface" hidden={!!error || !pdf}>
              <canvas
                ref={canvas}
                role={onExpand && !fullscreen ? "button" : "img"}
                tabIndex={onExpand && !fullscreen ? 0 : undefined}
                aria-label={
                  onExpand && !fullscreen
                    ? t("PDF 第 {0} 页，共 {1} 页；点击全屏阅读", page, count)
                    : t("PDF 第 {0} 页，共 {1} 页", page, count)
                }
                onClick={
                  onExpand && !fullscreen
                    ? () => {
                        setTextView(false);
                        onExpand();
                      }
                    : undefined
                }
                onKeyDown={
                  onExpand && !fullscreen
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onExpand();
                        }
                      }
                    : undefined
                }
              />
            </div>
          </>
        )}
      </div>
      <div className="reader-footer">
        <span className="status-dot" />
        {t("你正在阅读原始资料。")}
        {onExpand && !fullscreen && (
          <button
            type="button"
            className="reader-expand-link"
            onClick={() => {
              setTextView(false);
              onExpand();
            }}
          >
            <Expand size={13} />
            {t("点击页面可全屏阅读")}
          </button>
        )}
        <span>{t("第 {0} 页", page)}</span>
      </div>
    </div>
  );
}
