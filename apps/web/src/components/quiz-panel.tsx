"use client";
import { useLocale } from "@/components/locale-provider";
import { useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, Check, CircleHelp } from "lucide-react";
import { EmptyState, ErrorState, Spinner } from "./ui";
import { errorMessage, post } from "@/lib/api";
import type { Quiz, QuizResult } from "@/lib/types";
export function QuizPanel({
  id,
  onPage,
}: {
  id: string;
  onPage: (page: number) => void;
}) {
  const { t } = useLocale();
  const {
    data: quiz,
    mutate,
    error,
  } = useSWR<Quiz | null>(`/documents/${id}/quiz`);
  const [count, setCount] = useState(5);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [result, setResult] = useState<QuizResult>();
  async function generate() {
    setBusy(true);
    setFailure("");
    try {
      const data = await post<Quiz>(`/documents/${id}/quiz`, { count });
      setResult(undefined);
      setAnswers({});
      await mutate(data, false);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!quiz) return;
    setBusy(true);
    setFailure("");
    try {
      const value = await post<QuizResult>(`/quizzes/${quiz.id}/submit`, {
        answers: quiz.questions.map((_, i) => answers[i] ?? ""),
      });
      setResult(value);
      await mutate(null, false);
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="quiz-panel">
      <div className="assistant-heading">
        <div className="eyebrow">
          <CircleHelp size={14} />
          {t("看看自己理解了多少")}
        </div>
        <h2>{t("哪些知识，你真正记住了？")}</h2>
        <p>{t("根据读过的资料出题，让练习有据可依。")}</p>
      </div>
      {error && <ErrorState error={error} />}
      <div className="quiz-controls">
        <label className="field inline">
          {t("题目数量")}
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={busy}
          >
            {[5, 10, 20].map((n) => (
              <option value={n} key={n}>
                {t("{0} 道题", n)}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button primary small"
          onClick={generate}
          disabled={busy || !!quiz}
        >
          {busy ? (
            <Spinner label={t("正在准备")} />
          ) : result ? (
            t("再练一次")
          ) : (
            t("生成测验")
          )}
        </button>
      </div>
      {failure && (
        <p role="alert" className="form-error">
          {t(failure)}
        </p>
      )}
      {!quiz && !result && !busy && (
        <EmptyState
          title={t("用一个问题，看看理解到了哪里。")}
          description={t(
            "通过选择题、判断题和简答题，了解已经掌握的内容，以及还值得回顾的地方。",
          )}
        />
      )}
      {quiz && (
        <div className="quiz-questions">
          {quiz.questions.map((q, i) => (
            <fieldset key={`${quiz.id}-${i}`} className="quiz-question">
              <legend>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {q.question}
              </legend>
              {q.kind === "short_answer" ? (
                <textarea
                  aria-label={t("回答第 {0} 题", i + 1)}
                  rows={3}
                  maxLength={2000}
                  value={answers[i] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [i]: e.target.value }))
                  }
                  placeholder={t("试着用自己的话解释…")}
                />
              ) : (
                q.options.map((option) => (
                  <label
                    className={answers[i] === option ? "selected" : ""}
                    key={option}
                  >
                    <input
                      type="radio"
                      name={`question-${i}`}
                      value={option}
                      checked={answers[i] === option}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [i]: option }))
                      }
                    />
                    {option}
                  </label>
                ))
              )}
            </fieldset>
          ))}
          <button
            className="button primary full"
            disabled={
              busy || quiz.questions.some((_, i) => !answers[i]?.trim())
            }
            onClick={submit}
          >
            {busy ? <Spinner label={t("正在核对答案")} /> : t("提交并查看反馈")}
          </button>
        </div>
      )}
      {result && (
        <div className="quiz-results">
          <div className="quiz-score">
            <span>{t("本次练习得分")}</span>
            <strong>
              {result.score}
              <small>/100</small>
            </strong>
            <p>
              {result.score >= 80
                ? t("知识正在慢慢连起来。")
                : t("知道哪里还不熟悉，也是一种进步。")}
            </p>
          </div>
          <p className="grading-note">{t(result.grading_note)}</p>
          {result.results.map((q, i) => (
            <article key={i} className={q.correct ? "correct" : "incorrect"}>
              <span className="result-status">
                {q.correct ? <Check size={15} /> : <CircleHelp size={15} />}
                {t("第 {0} 题 ·", i + 1)}
                {q.correct ? t("已掌握") : t("建议回顾")}
              </span>
              <h3>{q.question}</h3>
              <p>
                <strong>{t("你的答案：")}</strong> {q.your_answer}
              </p>
              <p>
                <strong>{t("参考答案：")}</strong> {q.correct_answer}
              </p>
              <p>{q.explanation}</p>
              <button
                className="source-link"
                onClick={() => onPage(q.page_number)}
              >
                {t("核对原文 · 第 {0} 页", q.page_number)}
                <ArrowUpRight size={14} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
