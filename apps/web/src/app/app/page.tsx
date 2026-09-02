"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import useSWR from "swr";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  PageHeading,
  Badge,
  EmptyState,
  ErrorState,
  Skeleton,
} from "@/components/ui";
import { DemoButton } from "@/components/demo-button";
import type { Dashboard } from "@/lib/types";
import { dateLabel, errorMessage, patch } from "@/lib/api";
import { documentStatus, taskKind } from "@/lib/locale";
export default function DashboardPage() {
  const { t } = useLocale();
  const { data, error, mutate } = useSWR<Dashboard>("/dashboard", {
    refreshInterval: 5000,
  });
  if (error) return <ErrorState error={error} retry={() => mutate()} />;
  if (!data) return <Skeleton lines={5} />;
  async function complete(id: string) {
    try {
      await patch(`/tasks/${id}`, { completed: true });
      await mutate();
      toast.success(t("已记录这次进步。"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={t("专注于你的学习")}
        title={t("今天，再多理解一点。")}
        description={t("接着上次的思路，完成今天的一小步。")}
      >
        <Link href="/app/library?upload=1" className="button primary">
          <Plus size={18} />
          {t("上传 PDF")}
        </Link>
      </PageHeading>
      <div className="dashboard-stats">
        {[
          [data.document_count, t("学习资料"), t("收集，也记得理解")],
          [data.knowledge_count, t("知识点"), t("值得留下的知识")],
          [data.reviews_today, t("今日待复习"), t("每天一点，慢慢巩固")],
          [
            t("{0} 分钟", data.study_minutes),
            t("已完成学习时长"),
            t("根据已完成任务统计"),
          ],
        ].map(([value, label, note]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>
              {value}
              <i />
            </strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <h2>{t("继续学习")}</h2>
            <Link href="/app/library">
              {t("查看全部资料")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          {!data.documents.length ? (
            <div className="panel">
              <EmptyState
                title={t("下一段学习，从这里开始。")}
                description={t(
                  "上传 PDF 开始阅读，或先通过原创样例体验知识地图与复习工具。",
                )}
              >
                <DemoButton onCreated={() => mutate()} />
              </EmptyState>
            </div>
          ) : (
            <div className="continue-list">
              {data.documents.slice(0, 2).map((doc, index) => (
                <Link
                  className={`continue-document document-tone-${index}`}
                  key={doc.id}
                  href={`/app/documents/${doc.id}`}
                >
                  <div className="book-cover">
                    <BookOpen size={38} strokeWidth={1.2} />
                    <span>
                      {t("学习")}
                      <br />
                      {t("笔记")}
                    </span>
                  </div>
                  <div className="continue-info">
                    <div>
                      <Badge tone={doc.status === "ready" ? "green" : "amber"}>
                        {t(documentStatus[doc.status])}
                      </Badge>
                      {doc.is_demo && (
                        <span className="muted tiny">{t("原创英文样例")}</span>
                      )}
                    </div>
                    <h3>{doc.title}</h3>
                    <p>
                      {t("{0} 页", doc.page_count)}
                      <span>·</span> {t("{0} 个知识点", doc.knowledge_count)}
                    </p>
                    <span className="text-button">
                      {t("进入学习空间")}
                      <ArrowRight size={15} />
                    </span>
                  </div>
                  <ArrowUpRight className="continue-arrow" size={23} />
                </Link>
              ))}
            </div>
          )}
          <div className="learning-note">
            <span>
              <Sparkles size={22} />
            </span>
            <div>
              <p className="eyebrow">{t("让理解真正留下来")}</p>
              <h3>
                {t("阅读带来信息，")}
                <br />
                {t("回忆让它变成你的知识。")}
              </h3>
              <p>{t("翻开笔记前，先试着解释一个刚学过的概念。")}</p>
            </div>
          </div>
          <div className="section-heading">
            <h2>{t("最近的问题")}</h2>
            <span className="muted tiny">{t("记下每一次好奇")}</span>
          </div>
          <div className="recent-questions">
            {data.recent_questions.length ? (
              data.recent_questions.map((q) => (
                <p key={q.id}>
                  <span>Q</span>
                  {q.content}
                </p>
              ))
            ) : (
              <p className="muted">
                {t("还没有提问记录。打开一份资料，从好奇的地方开始吧。")}
              </p>
            )}
          </div>
        </section>
        <aside className="dashboard-aside">
          <section className="panel today-panel">
            <div className="section-heading">
              <h2>{t("今天的学习安排")}</h2>
              <span className="tiny muted">
                {dateLabel(new Date().toISOString())}
              </span>
            </div>
            <div className="today-count">
              <strong>{data.tasks.length + data.due_cards.length}</strong>
              <span>
                {t("项待学习或复习")}
                <br />
                <small>{t("一次，做好一点。")}</small>
              </span>
              <Clock3 size={25} />
            </div>
            {data.tasks.slice(0, 4).map((task) => (
              <div className="task-row" key={task.id}>
                <button
                  aria-label={t("完成：{0}", task.title)}
                  className="task-check"
                  onClick={() => complete(task.id)}
                >
                  <Check size={14} />
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <span>
                    {t(taskKind[task.kind])} · {t("{0} 分钟", task.minutes)}
                  </span>
                </div>
              </div>
            ))}
            {data.due_cards.length > 0 && (
              <Link
                href={`/app/documents/${data.due_cards[0].document_id}?tab=flashcards`}
                className="review-callout"
              >
                <BookOpen size={17} />
                {t("{0} 张闪卡待复习", data.due_cards.length)}
                <ChevronRight size={16} />
              </Link>
            )}
            {!data.tasks.length && !data.due_cards.length && (
              <p className="calm-empty">
                {t(
                  "今天暂无安排。创建复习计划或知识闪卡，为下一次学习留一点时间。",
                )}
              </p>
            )}
            <Link className="button secondary full" href="/app/study-plan">
              {t("查看复习计划")}
              <ArrowUpRight size={16} />
            </Link>
          </section>
          <section className="progress-panel">
            <div>
              <p className="eyebrow">{t("让知识逐渐成体系")}</p>
              <h3>{t("每一次学习，都算数。")}</h3>
              <p>
                {data.completed_tasks} / {data.total_tasks}
                {t("项任务已完成")}
              </p>
            </div>
            <div
              className="progress-ring"
              style={
                { "--progress": `${data.progress}%` } as React.CSSProperties
              }
            >
              <span>
                {data.progress}
                <small>%</small>
              </span>
            </div>
          </section>
          <div className="workspace-privacy">
            <span className="status-dot" />
            <p>
              {t("这是属于当前浏览器的个人学习空间。")}
              <br />
              <Link href="/privacy">{t("了解数据如何保存 ↗")}</Link>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
