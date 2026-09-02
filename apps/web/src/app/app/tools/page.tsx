"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Download,
  FileImage,
  FileText,
  Files,
  Languages,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { Spinner } from "@/components/ui";
import { downloadBlob } from "@/lib/download";
import { errorMessage } from "@/lib/api";
import type { ConversionResult } from "@/lib/conversion";
import type {
  ConversionMode,
  ConversionOptions,
  ImageFormat,
} from "@/lib/conversion-core";

const modes: {
  id: ConversionMode;
  label: string;
  description: string;
  icon: typeof Files;
}[] = [
  {
    id: "images-pdf",
    label: "图片转 PDF",
    description: "将 PNG、JPG、WebP 按顺序合成一份 PDF。",
    icon: Files,
  },
  {
    id: "pdf-images",
    label: "PDF 转图片",
    description: "将选中页导出为图片，多页自动打包 ZIP。",
    icon: FileImage,
  },
  {
    id: "image-format",
    label: "图片格式互转",
    description: "PNG、JPG、WebP 互转；保留尺寸，JPG 透明处填白。",
    icon: FileImage,
  },
  {
    id: "pdf-text",
    label: "PDF 提取文字",
    description: "提取可复制文字并下载 TXT，不改变原始 PDF。",
    icon: FileText,
  },
];

export default function ToolsPage() {
  const { t } = useLocale();
  const [mode, setMode] = useState<ConversionMode>("images-pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<ImageFormat>("png");
  const [paper, setPaper] = useState<ConversionOptions["paper"]>("a4");
  const [pages, setPages] = useState("1");
  const [scale, setScale] = useState(2);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ConversionResult>();
  const [error, setError] = useState<unknown>();
  const [cancelled, setCancelled] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const selectionVersion = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const imageMode = mode === "images-pdf" || mode === "image-format";
  const selected = modes.find((item) => item.id === mode)!;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
    };
  }, []);
  function changeMode(next: ConversionMode) {
    selectionVersion.current++;
    setMode(next);
    setFiles([]);
    setResult(undefined);
    setError(undefined);
    setCancelled(false);
    setProgress({ done: 0, total: 0 });
    setPages(next === "pdf-text" ? "" : "1");
    if (input.current) input.current.value = "";
  }
  async function selectFiles(incoming: File[]) {
    if (busy || !incoming.length) return;
    const version = ++selectionVersion.current;
    try {
      const { validateFiles } = await import("@/lib/conversion-core");
      if (!mounted.current || selectionVersion.current !== version) return;
      const next = imageMode ? [...files, ...incoming] : incoming;
      validateFiles(next, mode);
      setFiles(next);
      setResult(undefined);
      setError(undefined);
      setCancelled(false);
    } catch (e) {
      if (mounted.current && selectionVersion.current === version) setError(e);
    }
    if (input.current) input.current.value = "";
  }
  function reorder(index: number, delta: number) {
    setFiles((previous) => {
      const next = [...previous];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
    setResult(undefined);
  }
  async function convert() {
    if (busy) return;
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setResult(undefined);
    setError(undefined);
    setCancelled(false);
    setProgress({ done: 0, total: 0 });
    try {
      const { convertFiles } = await import("@/lib/conversion");
      const output = await convertFiles(
        files,
        { mode, format, paper, pages, scale },
        controller.signal,
        valueProgress,
      );
      if (mounted.current && !controller.signal.aborted) setResult(output);
    } catch (e) {
      if (mounted.current) {
        if (controller.signal.aborted) setCancelled(true);
        else setError(e);
      }
    } finally {
      if (mounted.current) setBusy(false);
      abort.current = null;
    }
  }
  function valueProgress(done: number, total: number) {
    if (mounted.current) setProgress({ done, total });
  }

  return (
    <div className="file-tools">
      <header className="tools-heading">
        <div>
          <p className="eyebrow">{t("学习工具箱")}</p>
          <h1>{t("资料处理，不必来回切换。")}</h1>
          <p>{t("转换文件留在浏览器中，不需要 AI 密钥。")}</p>
        </div>
        <ShieldCheck size={30} strokeWidth={1.4} />
      </header>
      <div className="tools-layout">
        <nav className="tool-selector" aria-label={t("选择转换工具")}>
          {modes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              disabled={busy}
              className={mode === id ? "active" : ""}
              aria-pressed={mode === id}
              onClick={() => changeMode(id)}
            >
              <Icon size={20} />
              <span>{t(label)}</span>
            </button>
          ))}
          <Link className="translation-tool-link" href="/app/library">
            <Languages size={20} />
            <span>
              {t("论文中英翻译")}
              <small>{t("打开资料，选择“对照翻译”")}</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        </nav>
        <section
          className="converter-surface"
          aria-labelledby="converter-title"
        >
          <div className="converter-heading">
            <h2 id="converter-title">{t(selected.label)}</h2>
            <p>{t(selected.description)}</p>
          </div>
          <label
            className={`file-dropzone ${busy ? "disabled" : ""}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              void selectFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <Upload size={28} strokeWidth={1.4} />
            <strong>{t("选择文件，或拖到这里")}</strong>
            <span>
              {imageMode
                ? t("PNG / JPG / WebP，每批最多 20 张")
                : t("选择一份 PDF，最多 300 页")}
            </span>
            <small>{t("单个文件 20 MB 以内，每批总计 50 MB 以内")}</small>
            <input
              ref={input}
              type="file"
              disabled={busy}
              multiple={imageMode}
              accept={imageMode ? ".png,.jpg,.jpeg,.webp" : ".pdf"}
              aria-label={t("选择待转换文件")}
              onChange={(event) =>
                void selectFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>
          {files.length > 0 && (
            <ol className="conversion-files">
              {files.map((file, index) => (
                <li key={`${index}-${file.name}`}>
                  <span className="file-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{file.name}</strong>
                    <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                  <div className="file-order-actions">
                    {imageMode && (
                      <>
                        <button
                          className="icon-button"
                          disabled={busy || index === 0}
                          aria-label={t("上移文件 {0}", file.name)}
                          onClick={() => reorder(index, -1)}
                        >
                          <ArrowUp size={17} />
                        </button>
                        <button
                          className="icon-button"
                          disabled={busy || index === files.length - 1}
                          aria-label={t("下移文件 {0}", file.name)}
                          onClick={() => reorder(index, 1)}
                        >
                          <ArrowDown size={17} />
                        </button>
                      </>
                    )}
                    <button
                      className="icon-button"
                      disabled={busy}
                      aria-label={t("移除文件 {0}", file.name)}
                      onClick={() => {
                        setFiles((previous) =>
                          previous.filter((_, i) => i !== index),
                        );
                        setResult(undefined);
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <fieldset className="conversion-options" disabled={busy}>
            <legend>{t("输出选项")}</legend>
            <div className="tool-fields">
              {mode === "images-pdf" && (
                <label>
                  {t("纸张尺寸")}
                  <select
                    value={paper}
                    onChange={(event) => {
                      setPaper(
                        event.target.value as ConversionOptions["paper"],
                      );
                      setResult(undefined);
                    }}
                  >
                    <option value="a4">{t("A4 自适应横竖版，保留留白")}</option>
                    <option value="image">{t("跟随图片比例，不裁切")}</option>
                  </select>
                </label>
              )}
              {(mode === "image-format" || mode === "pdf-images") && (
                <label>
                  {t("输出格式")}
                  <select
                    value={format}
                    onChange={(event) => {
                      setFormat(event.target.value as ImageFormat);
                      setResult(undefined);
                    }}
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPG</option>
                    <option value="webp">WebP</option>
                  </select>
                </label>
              )}
              {mode === "pdf-images" && (
                <label>
                  {t("输出清晰度")}
                  <select
                    value={scale}
                    onChange={(event) => {
                      setScale(Number(event.target.value));
                      setResult(undefined);
                    }}
                  >
                    <option value={1}>72 DPI</option>
                    <option value={2}>144 DPI</option>
                    <option value={3}>216 DPI</option>
                  </select>
                </label>
              )}
              {!imageMode && (
                <label>
                  {t("页码范围")}
                  <input
                    value={pages}
                    maxLength={200}
                    placeholder={t("例如 1-3,5；留空表示全部页")}
                    onChange={(event) => {
                      setPages(event.target.value);
                      setResult(undefined);
                    }}
                  />
                </label>
              )}
            </div>
          </fieldset>
          <p className="tool-fineprint">
            {mode === "pdf-images"
              ? t(
                  "转图片每批最多 20 页，单页最多 2400 万像素；输出总计不超过 100 MB。",
                )
              : mode === "pdf-text"
                ? t(
                    "仅提取已有文本，不提供 OCR；双栏、公式和表格顺序可能需要人工整理。",
                  )
                : t(
                    "保持图片比例。动画图片仅取首帧，格式互转会重新编码；不保证保留元数据或色彩配置。",
                  )}
          </p>
          <div className="tool-actions">
            <button
              className="button primary"
              disabled={busy || !files.length}
              onClick={() => void convert()}
            >
              {busy ? <Spinner /> : <Files size={17} />}
              {t("开始转换")}
            </button>
            {busy && (
              <button
                className="button secondary"
                onClick={() => abort.current?.abort()}
              >
                {t("取消转换")}
              </button>
            )}
          </div>
          {busy && (
            <div
              className="conversion-progress"
              role="status"
              aria-live="polite"
            >
              <progress max={progress.total || 1} value={progress.done} />
              <span>
                {progress.total
                  ? t("已处理 {0} / {1}", progress.done, progress.total)
                  : t("正在准备转换…")}
              </span>
            </div>
          )}
          {cancelled && (
            <p role="status">{t("转换已取消，原文件没有改变。")}</p>
          )}
          {error !== undefined && (
            <p className="tool-error" role="alert">
              {errorMessage(error)}
            </p>
          )}
          {result && (
            <div className="conversion-result" role="status">
              <div>
                <strong>{t("转换完成，可以下载了。")}</strong>
                <p>
                  {result.name} · {(result.blob.size / 1024 / 1024).toFixed(2)}{" "}
                  MB · {t("共 {0} 项", result.count)}
                </p>
              </div>
              <button
                className="button primary"
                onClick={() => downloadBlob(result.blob, result.name)}
              >
                <Download size={18} />
                {t("下载文件")}
              </button>
            </div>
          )}
        </section>
      </div>
      <p className="tools-bottom-note">
        {t(
          "文件转换在本机进行，刷新页面后需重新选择文件。图片转 PDF 不会自动让扫描文字变成可搜索文本；暂不支持 Word、PPT 与 PDF 的版式互转。",
        )}
      </p>
    </div>
  );
}
