"use client";
import { useLocale } from "@/components/locale-provider";
import { useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, Layers3, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, Spinner } from "./ui";
import { dateLabel, errorMessage, post, todayISO } from "@/lib/api";
import type { Flashcard } from "@/lib/types";
import { reviewGrade } from "@/lib/locale";
export function FlashcardsPanel({
  id,
  onPage,
}: {
  id: string;
  onPage: (page: number) => void;
}) {
  const { t } = useLocale();
  const { data, error, mutate } = useSWR<Flashcard[]>(
    `/documents/${id}/flashcards`,
  );
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const due = data?.filter((c) => c.next_review_date <= todayISO()) ?? [];
  const card = due[0];
  async function create() {
    setBusy(true);
    try {
      await post(`/documents/${id}/flashcards`);
      await mutate();
      toast.success(t("知识闪卡已生成，每张卡片都附有原文出处。"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function grade(value: string) {
    if (!card || busy) return;
    setBusy(true);
    try {
      const updated = await post<Flashcard>(`/flashcards/${card.id}/review`, {
        grade: value,
      });
      setFlipped(false);
      await mutate();
      toast.success(
        t("复习已记录 · 下次安排在 {0}", dateLabel(updated.next_review_date)),
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flashcards-panel">
      <div className="assistant-heading">
        <div className="eyebrow">
          <Layers3 size={14} />
          {t("少量练习，经常回顾")}
        </div>
        <h2>{t("让知识留得更久。")}</h2>
        <p>{t("先试着回忆，再翻开卡片核对答案。")}</p>
      </div>
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : !data ? (
        <Spinner />
      ) : !data.length ? (
        <EmptyState
          title={t("一个知识点，一个好问题。")}
          description={t("从这份文档的知识点生成闪卡，随时回到原文核对。")}
        >
          <button className="button primary" onClick={create} disabled={busy}>
            {busy ? <Spinner /> : t("生成知识闪卡")}
          </button>
        </EmptyState>
      ) : !card ? (
        <EmptyState
          title={t("今天的练习，先到这里。")}
          description={t(
            "全部 {0} 张卡片均已安排复习。下次复习：{1}。",
            data.length,
            dateLabel(
              data.reduce((a, b) =>
                a.next_review_date < b.next_review_date ? a : b,
              ).next_review_date,
            ),
          )}
        >
          <button className="button secondary" onClick={create} disabled={busy}>
            {t("同步新增知识点")}
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="card-progress">
            <span>{t("{0} 张今日待复习", due.length)}</span>
            <span>{t("{0} 张闪卡", data.length)}</span>
          </div>
          <button
            className={`flashcard ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((v) => !v)}
            aria-label={flipped ? t("查看问题") : t("翻开卡片查看答案")}
          >
            <span className="eyebrow">
              {flipped ? t("参考答案") : t("先试着回忆")}
            </span>
            <h3>{flipped ? card.answer : card.question}</h3>
            <span className="flip-hint">
              <RotateCw size={14} />
              {flipped ? t("点击返回问题") : t("点击查看答案")}
            </span>
          </button>
          <button
            className="source-link"
            onClick={() => onPage(card.page_number)}
          >
            {t("查看原文 · 第 {0} 页", card.page_number)}
            <ArrowUpRight size={14} />
          </button>
          {flipped ? (
            <div className="review-grades">
              {(["again", "hard", "good", "easy"] as const).map((grade) => (
                <button
                  key={grade}
                  className={`grade-${grade}`}
                  disabled={busy}
                  onClick={() => void gradeAction(grade)}
                >
                  {t(reviewGrade[grade])}
                  <small>
                    {grade === "again"
                      ? t("明天再复习")
                      : grade === "hard"
                        ? t("还需要巩固")
                        : grade === "good"
                          ? t("基本记住了")
                          : t("掌握得很清楚")}
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <p className="calm-empty">
              {t("先用自己的话回忆，再查看答案，选择掌握程度。")}
            </p>
          )}
          <p className="tiny muted">
            {t("选择“没记住”，明天会再次复习；回忆越熟练，下次复习间隔越长。")}
          </p>
        </>
      )}
    </div>
  );
  async function gradeAction(value: string) {
    await grade(value);
  }
}
