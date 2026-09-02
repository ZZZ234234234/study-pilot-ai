"use client";
import { useLocale } from "@/components/locale-provider";
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
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, EmptyState, ErrorState, Modal, Skeleton, Spinner } from "./ui";
import { PdfReader } from "./pdf-reader";
import { TranslationPanel } from "./translation-panel";
import { KnowledgePanel } from "./knowledge-panel";
import { ChatPanel } from "./chat-panel";
import { FlashcardsPanel } from "./flashcards-panel";
import { QuizPanel } from "./quiz-panel";
import { api, cn, errorMessage, post } from "@/lib/api";
import type { Document, SearchResult } from "@/lib/types";
import { documentStatus } from "@/lib/locale";
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
  { id: "translation", label: "对照翻译", icon: Languages },
  { id: "chat", label: "文档问答", icon: MessageSquare },
  { id: "knowledge", label: "知识地图", icon: ListTree },
  { id: "flashcards", label: "知识闪卡", icon: Layers3 },
  { id: "quiz", label: "理解测验", icon: CircleHelp },
];
export function DocumentWorkspace({ id }: { id: string }) {
  const { t } = useLocale();
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
    : doc?.status === "failed" && doc.progress >= 30
      ? "translation"
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
    toast.info(t("原文出处 · 第 {0} 页", value));
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
      toast.success(t("已加入队列，将重新处理这份文档。"));
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
            {t("我的资料")}
          </Link>
          <h1>{doc.title}</h1>
          <div className="document-meta">
            <span>{t("{0} 页", doc.page_count)}</span>
            <span>·</span>
            <span>{t("{0} 个知识点", doc.knowledge_count)}</span>
            <Badge tone={doc.status === "ready" ? "green" : "amber"}>
              {t(documentStatus[doc.status])}
            </Badge>
            {doc.ai_status === "demo" && (
              <Badge tone="amber">{t("演示样例")}</Badge>
            )}
          </div>
        </div>
        <div className="document-top-actions">
          <button
            className="icon-button"
            aria-label={t("搜索 PDF 原文")}
            onClick={() => setSearchOpen(true)}
          >
            <Search size={20} />
          </button>
          <button
            className="icon-button"
            aria-label={t("重新处理文档")}
            onClick={() => setReprocess(true)}
            disabled={["queued", "parsing", "indexing"].includes(doc.status)}
          >
            <RotateCw size={18} />
          </button>
          <Link href="/app/study-plan" className="button secondary small">
            <CalendarDays size={16} />
            <span>{t("制定复习计划")}</span>
          </Link>
        </div>
      </div>
      {doc.status !== "ready" &&
      !(doc.status === "failed" && doc.progress >= 30) ? (
        <section className="processing-panel">
          <div className="process-art">
            <BookOpen size={46} strokeWidth={1.2} />
          </div>
          <p className="eyebrow">
            {doc.status === "failed"
              ? t("我们换个方式再试试")
              : t("正在整理你的资料")}
          </p>
          <h2>
            {doc.status === "failed"
              ? t("这份 PDF 暂时未能处理完成。")
              : doc.status === "queued"
                ? t("文档已加入处理队列。")
                : doc.status === "parsing"
                  ? t("正在逐页解析文档。")
                  : t("正在建立知识索引。")}
          </h2>
          <p>
            {doc.error
              ? errorMessage(new Error(doc.error))
              : t("你可以留在这里，也可以稍后回来。文档会继续在后台处理。")}
          </p>
          <div className="upload-progress">
            <span style={{ width: `${doc.progress}%` }} />
          </div>
          <div className="processing-steps">
            {[
              t("上传"),
              t("解析"),
              t("建立索引"),
              t("知识地图"),
              t("已就绪"),
            ].map((step, i) => (
              <span
                className={doc.progress > i * 24 ? "complete" : ""}
                key={step}
              >
                {String(i + 1).padStart(2, "0")} {step}
              </span>
            ))}
          </div>
          {doc.status === "failed" ? (
            <button className="button primary" onClick={retry} disabled={busy}>
              {t("重新尝试")}
            </button>
          ) : (
            <Spinner
              label={`${doc.progress}% · ${t(documentStatus[doc.status])}`}
            />
          )}
        </section>
      ) : (
        <>
          {doc.status === "failed" && (
            <div className="mode-notice" role="status">
              {t(
                "原文已解析，但知识索引未完成。仍可阅读与翻译；其他学习功能需修复模型配置后重新处理。",
              )}
            </div>
          )}
          {doc.ai_status === "not_configured" && (
            <div className="mode-notice">
              {t("PDF 已解析，可以阅读和搜索。")}{" "}
              <Link href="/app/settings">{t("配置 AI 模型")}</Link>{" "}
              {t("后，重新处理这份文档，即可生成知识点并进行问答。")}
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
              {t("学习助手")}
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
                key={id}
                id={id}
                page={page}
                count={doc.page_count}
                onPage={setPage}
              />
            </div>
            <div className="split-handle">
              <label className="sr-only" htmlFor="split">
                {t("阅读区域宽度")}
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
              <nav className="document-tabs" aria-label={t("文档工具")}>
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
                    {t(label)}
                  </button>
                ))}
              </nav>
              <div className="assistant-panel">
                <div hidden={active !== "translation"}>
                  <TranslationPanel
                    key={id}
                    id={id}
                    title={doc.title}
                    page={page}
                    count={doc.page_count}
                    onPage={setPage}
                  />
                </div>
                {active === "translation" ? null : doc.ai_status ===
                    "not_configured" || doc.status === "failed" ? (
                  <div className="provider-notice" role="status">
                    <EmptyState
                      title={t("原文已就绪，AI 功能还差一步。")}
                      description={t(
                        "现在可以阅读、翻页和搜索 PDF。生成知识点、文档问答、闪卡与测验，需要先配置模型服务。",
                      )}
                    >
                      <ol className="provider-steps">
                        <li>{t("进入“模型设置”，生成服务端配置。")}</li>
                        <li>
                          {t("将配置应用到服务端，重启 API 与后台任务进程。")}
                        </li>
                        <li>{t("回到这里，点击“重新处理文档”。")}</li>
                      </ol>
                      <div className="provider-actions">
                        <Link href="/app/settings" className="button primary">
                          {t("前往模型设置")}
                          <ArrowUpRight size={16} />
                        </Link>
                        <button
                          className="button secondary"
                          onClick={() => setMobile("pdf")}
                        >
                          {t("先阅读 PDF")}
                        </button>
                      </div>
                    </EmptyState>
                  </div>
                ) : active === "chat" ? (
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
          title={t("在原文里找一找。")}
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
                aria-label={t("搜索 PDF 内容")}
                placeholder={t("输入关键词或一句话…")}
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
              {searching ? <Spinner /> : t("搜索")}
            </button>
          </form>
          <div className="search-results">
            {results?.length === 0 ? (
              <p className="calm-empty">{t("这份文档中没有找到匹配内容。")}</p>
            ) : (
              results?.map((r) => (
                <button key={r.page_number} onClick={() => jump(r.page_number)}>
                  <strong>
                    {t("第 {0} 页", r.page_number)}
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
          title={t("重新整理这份文档？")}
          onClose={() => setReprocess(false)}
        >
          <p>
            {t(
              "将使用当前配置的 AI 模型重新处理。此文档已有的知识点、问答记录、计划、闪卡和测验将被替换，原始 PDF 会保留。",
            )}
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setReprocess(false)}
            >
              {t("取消")}
            </button>
            <button className="button primary" onClick={retry} disabled={busy}>
              {busy ? <Spinner /> : t("重新处理文档")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
