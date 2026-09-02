"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Download, Languages, Square } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Settings } from "@/lib/types";
import { downloadBlob, safeDownloadName } from "@/lib/download";
import {
  translationKey,
  translationPages,
  translationText,
  type PageTranslation,
  type TranslationOptions,
} from "@/lib/translation";
import { useLocale } from "./locale-provider";
import { Spinner } from "./ui";

export function TranslationPanel({
  id,
  title,
  page,
  count,
  onPage,
}: {
  id: string;
  title: string;
  page: number;
  count: number;
  onPage: (page: number) => void;
}) {
  const { t } = useLocale();
  const { data: settings, error: settingsError } =
    useSWR<Settings>("/settings");
  const [options, setOptions] = useState<TranslationOptions>({
    target: "zh-CN",
    style: "academic",
    glossary: "",
  });
  const [scope, setScope] = useState("current");
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(Math.min(count, 10));
  const [consent, setConsent] = useState(false);
  const [cache, setCache] = useState<Record<string, PageTranslation>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<unknown>();
  const [stopping, setStopping] = useState(false);
  const stop = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop.current = true;
    };
  }, []);
  const configured =
    settings &&
    settings.provider !== "demo" &&
    (settings.provider === "ollama" || settings.has_api_key);
  const current = cache[translationKey(page, options)];
  const matching = Object.entries(cache)
    .filter(([key, item]) => key === translationKey(item.page, options))
    .map(([, item]) => item)
    .sort((a, b) => a.page - b.page);

  async function translate() {
    if (busy || !consent || !configured) return;
    let pages: number[];
    try {
      pages = translationPages(
        scope === "current" ? page : from,
        scope === "current" ? page : to,
        count,
      );
    } catch (e) {
      setError(e);
      return;
    }
    setError(undefined);
    setBusy(true);
    setStopping(false);
    stop.current = false;
    setProgress({ done: 0, total: pages.length });
    try {
      for (let i = 0; i < pages.length; i++) {
        if (stop.current) break;
        const key = translationKey(pages[i], options);
        if (!cache[key]) {
          const result = await api<PageTranslation>(
            `/documents/${id}/translate`,
            {
              method: "POST",
              body: JSON.stringify({
                ...options,
                glossary: options.glossary.trim(),
                page: pages[i],
              }),
            },
          );
          if (!mounted.current) return;
          setCache((previous) => ({
            ...previous,
            [key]: { ...result, glossary: options.glossary.trim() },
          }));
        }
        if (mounted.current) setProgress({ done: i + 1, total: pages.length });
      }
    } catch (e) {
      if (mounted.current) setError(e);
    } finally {
      if (mounted.current) {
        setBusy(false);
        setStopping(false);
      }
    }
  }

  function exportText() {
    downloadBlob(
      new Blob(["\uFEFF", translationText(title, matching)], {
        type: "text/plain;charset=utf-8",
      }),
      `${safeDownloadName(title)}-${options.target}-translation.txt`,
    );
  }

  return (
    <section className="translation-panel">
      <div className="tool-panel-heading">
        <Languages size={22} />
        <div>
          <h2>{t("论文对照翻译")}</h2>
          <p>{t("原文不改写，译文逐段对照。")}</p>
        </div>
      </div>
      <p className="tool-notice">
        {t(
          "AI 译文可能有误。公式、表格和双栏阅读顺序请对照原 PDF 核实；这不是原版排版翻译。",
        )}
      </p>
      {!configured && (
        <div className="tool-notice" role="status">
          {settingsError
            ? errorMessage(settingsError)
            : settings
              ? t(
                  "翻译需要真实聊天模型，演示模式不会生成假译文。无需嵌入模型或重新建立索引。",
                )
              : t("正在读取模型配置…")}
          <Link href="/app/settings">{t("前往模型设置")}</Link>
        </div>
      )}
      <fieldset className="translation-controls" disabled={busy}>
        <legend className="sr-only">{t("翻译选项")}</legend>
        <div className="tool-fields">
          <label>
            {t("目标语言")}
            <select
              value={options.target}
              onChange={(e) =>
                setOptions({
                  ...options,
                  target: e.target.value as TranslationOptions["target"],
                })
              }
            >
              <option value="zh-CN">{t("简体中文译文")}</option>
              <option value="en">{t("英文译文")}</option>
            </select>
          </label>
          <label>
            {t("译文风格")}
            <select
              value={options.style}
              onChange={(e) =>
                setOptions({
                  ...options,
                  style: e.target.value as TranslationOptions["style"],
                })
              }
            >
              <option value="academic">{t("学术严谨")}</option>
              <option value="clear">{t("自然易读")}</option>
            </select>
          </label>
        </div>
        <label>
          {t("术语偏好（可选）")}
          <textarea
            rows={2}
            maxLength={2000}
            placeholder={t("每行一组，例如：backpropagation = 反向传播")}
            value={options.glossary}
            onChange={(e) =>
              setOptions({ ...options, glossary: e.target.value })
            }
          />
        </label>
        <label>
          {t("翻译范围")}
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="current">
              {t("当前阅读页（第 {0} 页）", page)}
            </option>
            <option value="range">{t("指定页码，每批最多 10 页")}</option>
          </select>
        </label>
        {scope === "range" && (
          <div className="tool-fields">
            <label>
              {t("起始页")}
              <input
                type="number"
                min={1}
                max={count}
                value={from}
                onChange={(e) => setFrom(Number(e.target.value))}
              />
            </label>
            <label>
              {t("结束页")}
              <input
                type="number"
                min={from}
                max={count}
                value={to}
                onChange={(e) => setTo(Number(e.target.value))}
              />
            </label>
          </div>
        )}
        <label className="tool-consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            {t(
              "我确认将选中页原文和术语发送到已配置的模型；远程服务可能计费。",
            )}
          </span>
        </label>
      </fieldset>
      <div className="tool-actions">
        <button
          className="button primary small"
          disabled={busy || !configured || !consent}
          onClick={() => void translate()}
        >
          {busy ? <Spinner /> : <Languages size={16} />}
          {t("翻译选中页")}
        </button>
        {busy && (
          <button
            className="button secondary small"
            disabled={stopping}
            onClick={() => {
              stop.current = true;
              setStopping(true);
            }}
          >
            <Square size={14} />
            {t("停止后续页")}
          </button>
        )}
        <button
          className="button secondary small"
          disabled={!matching.length}
          onClick={exportText}
        >
          <Download size={16} />
          {t("导出对照文本")}
        </button>
      </div>
      <p className="tool-fineprint">
        {t(
          "相同选项下跳过已完成页。译文仅保留在本次阅读中，刷新前请导出；停止不会撤回已发送的模型请求。",
        )}
      </p>
      {progress.total > 0 && (
        <p role="status" aria-live="polite">
          {t("已完成 {0} / {1} 页", progress.done, progress.total)}
          {stopping && ` · ${t("当前页完成后停止")}`}
        </p>
      )}
      {error !== undefined && (
        <p className="tool-error" role="alert">
          {errorMessage(error)}
        </p>
      )}
      {matching.length > 0 && (
        <nav className="translated-pages" aria-label={t("已翻译页码")}>
          {matching.map((item) => (
            <button
              key={item.page}
              className={item.page === page ? "active" : ""}
              onClick={() => onPage(item.page)}
            >
              {t("第 {0} 页", item.page)}
            </button>
          ))}
        </nav>
      )}
      {current ? (
        <div className="translation-result">
          <p className="tool-fineprint">
            {t("第 {0} 页", page)} · {current.model} · {current.target}
          </p>
          {current.segments.map((segment) => (
            <article className="translation-segment" key={segment.id}>
              <details>
                <summary>{t("查看这一段原文")}</summary>
                <p className="translation-source">{segment.source}</p>
              </details>
              <p lang={options.target === "en" ? "en" : "zh-CN"}>
                {segment.translation}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="translation-empty">
          {t("选择语言和页码，开始读懂这一页。已完成的页面会显示在这里。")}
        </div>
      )}
    </section>
  );
}
