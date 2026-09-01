"use client";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ArrowUp, ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { ErrorState, Skeleton, Spinner } from "./ui";
import { errorMessage, post } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export function ChatPanel({
  id,
  onPage,
  isDemo,
}: {
  id: string;
  onPage: (page: number) => void;
  isDemo: boolean;
}) {
  const { data, error, mutate } = useSWR<ChatMessage[]>(
    `/documents/${id}/chat`,
  );
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState("");
  const [failure, setFailure] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [data, busy]);
  async function ask(question = value) {
    if (question.trim().length < 2 || busy) return;
    setBusy(true);
    setPending(question);
    setValue("");
    setFailure("");
    try {
      await post(`/documents/${id}/chat`, { question });
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
      <div className="assistant-heading">
        <div className="eyebrow">
          <Sparkles size={14} />
          YOUR THOUGHT PARTNER
        </div>
        <h2>Follow your curiosity.</h2>
        <p>Good questions deserve grounded answers.</p>
      </div>
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
            <h3>What would you like to understand?</h3>
            <p>I’ll look in this document and bring the sources with me.</p>
            <div className="suggested-questions">
              {[
                "Why is convolution useful?",
                "How does backpropagation work?",
                "What is the difference between validation and test data?",
              ].map((q) => (
                <button key={q} onClick={() => ask(q)}>
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
                  "YOU"
                ) : (
                  <>
                    <Sparkles size={13} />
                    {message.mode === "demo"
                      ? "DEMO · SOURCE EXCERPTS"
                      : "STUDYPILOT"}
                  </>
                )}
              </div>
              <div className="message-content">{message.content}</div>
              {message.citations?.length > 0 && (
                <div className="citations">
                  <span className="eyebrow">FOLLOW THE SOURCE</span>
                  {message.citations.map((c) => (
                    <button
                      className="citation"
                      key={c.id}
                      onClick={() => onPage(c.page_number)}
                    >
                      <span>
                        <BookOpen size={15} />
                        <strong>Page {c.page_number}</strong>
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
            <span className="message-label">YOU</span>
            <p>{pending}</p>
          </div>
        )}
        {busy && (
          <div className="chat-thinking">
            <Spinner label="Finding the right pages…" />
          </div>
        )}
        {failure && (
          <p role="alert" className="form-error">
            {failure}
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
          Ask about this document
        </label>
        <textarea
          id="question"
          placeholder="Ask about this document…"
          maxLength={1200}
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void ask();
            }
          }}
        />
        <button
          className="send-button"
          aria-label="Send question"
          disabled={busy || value.trim().length < 2}
        >
          <ArrowUp size={20} />
        </button>
        <span>↵ to ask · Shift + ↵ for a new line</span>
      </form>
      <p className="chat-disclaimer">
        {isDemo
          ? "Demo uses deterministic source excerpts, not a live model."
          : "AI can be wrong. Check important claims against the source."}
      </p>
    </div>
  );
}
