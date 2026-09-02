"use client";
import { useLocale } from "@/components/locale-provider";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ArrowUp, ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { ErrorState, Skeleton, Spinner } from "./ui";
import { errorMessage, post } from "@/lib/api";
import type { AIProfiles, ChatMessage } from "@/lib/types";
import { ModelSelector } from "./model-selector";
import { shouldSendQuestion } from "@/lib/keyboard";
export function ChatPanel({
  id,
  onPage,
  isDemo,
  connections,
  modelId = "server",
  onModel = () => {},
  connectionError = false,
  serverAvailable = true,
}: {
  id: string;
  onPage: (page: number) => void;
  isDemo: boolean;
  connections?: AIProfiles;
  modelId?: string;
  onModel?: (id: string) => void;
  connectionError?: boolean;
  serverAvailable?: boolean;
}) {
  const { t } = useLocale();
  const { data, error, mutate } = useSWR<ChatMessage[]>(
    `/documents/${id}/chat`,
  );
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  const [failure, setFailure] = useState("");
  const [consentKey, setConsentKey] = useState("");
  const selected = connections?.profiles.find((p) => p.id === modelId);
  const selectionKey = selected ? `${selected.id}:${selected.revision}` : "";
  const available = modelId === "server" ? serverAvailable : !!selected;
  const allowed =
    available && (modelId === "server" || consentKey === selectionKey);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [data, busy]);
  async function ask(question = value) {
    if (question.trim().length < 2 || busy || !allowed) return;
    setBusy(true);
    setPending(question);
    setValue("");
    setFailure("");
    try {
      await post(`/documents/${id}/chat`, {
        question,
        profile_id: modelId,
        profile_revision: selected?.revision,
      });
      await mutate();
    } catch (e) {
      setFailure(errorMessage(e));
      setValue(question);
    } finally {
      setPending("");
      setBusy(false);
    }
  }
  return (
    <div className="chat-panel">
      <div className="chat-compact-heading">
        <Sparkles size={14} />
        <h2>{t("文档问答")}</h2>
        <span>{t("回答附原文依据")}</span>
      </div>
      <ModelSelector
        data={connections}
        value={modelId}
        onChange={onModel}
        disabled={busy}
        failed={connectionError}
      />
      {selected && (
        <label className="chat-model-consent">
          <input
            type="checkbox"
            checked={consentKey === selectionKey}
            disabled={busy}
            onChange={(e) =>
              setConsentKey(e.target.checked ? selectionKey : "")
            }
          />
          <span>
            {t(
              "允许向 {0} 发送问题与相关原文，可能产生费用。",
              selected.provider === "deepseek" ? "DeepSeek" : t("智谱"),
            )}
          </span>
        </label>
      )}
      {!available && (
        <p className="chat-disclaimer" role="status">
          {t("请先添加模型连接，或重新选择可用型号。")}
        </p>
      )}
      <div className="chat-messages">
        {error ? (
          <ErrorState error={error} retry={() => mutate()} />
        ) : !data ? (
          <Skeleton />
        ) : !data.length ? (
          <div className="chat-welcome">
            <div className="chat-spark">
              <Sparkles size={25} />
            </div>
            <h3>{t("这份资料里，你想弄懂什么？")}</h3>
            <p>{t("我会从这份文档中查找依据，并附上对应的原文。")}</p>
            <div className="suggested-questions">
              {(isDemo
                ? [
                    t("卷积为什么有用？"),
                    t("反向传播是怎样工作的？"),
                    t("验证集和测试集有什么区别？"),
                  ]
                : [
                    t("这份资料的核心观点是什么？"),
                    t("有哪些概念需要重点理解？"),
                    t("作者给出了哪些依据或限制？"),
                  ]
              ).map((q) => (
                <button
                  key={q}
                  disabled={!allowed || busy}
                  onClick={() => ask(q)}
                >
                  {q}
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          data.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div className="message-label">
                {message.role === "user" ? (
                  t("你")
                ) : (
                  <>
                    <Sparkles size={13} />
                    {message.mode === "demo"
                      ? t("演示 · 原文摘录")
                      : (message.model_label ?? "STUDYPILOT")}
                  </>
                )}
              </div>
              <div className="message-content">{message.content}</div>
              {message.citations?.length > 0 && (
                <div className="citations">
                  <span className="eyebrow">{t("查看回答依据")}</span>
                  {message.citations.map((c) => (
                    <button
                      className="citation"
                      key={c.id}
                      onClick={() => onPage(c.page_number)}
                    >
                      <span>
                        <BookOpen size={15} />
                        <strong>{t("第 {0} 页", c.page_number)}</strong>
                        <ArrowUpRight size={14} />
                      </span>
                      <p>{c.quote}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {pending && (
          <div className="chat-message user">
            <span className="message-label">{t("你")}</span>
            <p>{pending}</p>
          </div>
        )}
        {busy && (
          <div className="chat-thinking">
            <Spinner label={t("正在查找相关原文…")} />
          </div>
        )}
        {failure && (
          <p role="alert" className="form-error">
            {t(failure)}
          </p>
        )}
        <div ref={bottom} />
      </div>
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <label className="sr-only" htmlFor="question">
          {t("输入关于这份文档的问题")}
        </label>
        <textarea
          id="question"
          placeholder={t("关于这份资料，你想问什么？")}
          maxLength={1200}
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (shouldSendQuestion(e.nativeEvent)) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        <button
          className="send-button"
          aria-label={t("发送问题")}
          disabled={busy || !allowed || value.trim().length < 2}
        >
          <ArrowUp size={20} />
        </button>
        <span>{t("回车发送 · Shift + 回车换行")}</span>
      </form>
      <p className="chat-disclaimer">
        {selected
          ? t("跨语言检索词 + 本地关键词检索；重要结论请核对原文。")
          : isDemo && modelId === "server"
            ? t("演示模式仅展示固定原文摘录，不调用真实 AI。")
            : t("AI 也可能出错，重要结论请核对原文。")}
      </p>
    </div>
  );
}
