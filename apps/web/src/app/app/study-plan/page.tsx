"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";
import { CalendarDays, Check, Clock3, Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  EmptyState,
  ErrorState,
  Modal,
  PageHeading,
  Skeleton,
  Spinner,
} from "@/components/ui";
import { dateLabel, errorMessage, patch, post, todayISO } from "@/lib/api";
import type { Document, StudyPlan, StudyTask } from "@/lib/types";
export default function StudyPlanPage() {
  const { t, locale } = useLocale();
  const { data: plans, error, mutate } = useSWR<StudyPlan[]>("/plans");
  const { data: documents } = useSWR<Document[]>("/documents");
  const [open, setOpen] = useState(false);
  const [docId, setDocId] = useState("");
  const [exam, setExam] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  );
  const [minutes, setMinutes] = useState(45);
  const [days, setDays] = useState(5);
  const [priority, setPriority] = useState("balanced");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [selected, setSelected] = useState("");
  const available =
    documents?.filter((d) => d.status === "ready" && d.knowledge_count > 0) ??
    [];
  const plan = plans?.find((p) => p.id === selected) ?? plans?.[0];
  const groups = Object.groupBy(plan?.tasks ?? [], (t) => t.scheduled_date);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    try {
      const result = await post<StudyPlan>(
        `/documents/${docId || available[0]?.id}/plans`,
        {
          exam_date: exam,
          daily_minutes: minutes,
          days_per_week: days,
          priority,
        },
      );
      setSelected(result.id);
      await mutate();
      setOpen(false);
      toast.success(t("复习计划已生成，按自己的节奏开始吧。"));
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function complete(task: StudyTask) {
    try {
      await patch(`/tasks/${task.id}`, { completed: !task.completed });
      await mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={t("稳稳地学，慢慢地进步")}
        title={t("每天，学得更扎实一点。")}
        description={t("让计划适合你的时间，而不是让生活追着计划走。")}
      >
        <button className="button primary" onClick={() => setOpen(true)}>
          <Plus size={18} />
          {t("创建复习计划")}
        </button>
      </PageHeading>
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : !plans ? (
        <Skeleton lines={4} />
      ) : !plan ? (
        <div className="panel">
          <EmptyState
            title={t("让学习，有自己的节奏。")}
            description={t(
              "选择资料和目标日期，留出每天可用的时间。系统会安排初次学习、间隔复习和最后的知识回顾。",
            )}
          >
            <button className="button primary" onClick={() => setOpen(true)}>
              {t("创建第一个计划")}
              <ArrowUpRight size={16} />
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="plan-overview">
            <div>
              <Badge tone="green">{t("当前学习计划")}</Badge>
              <h2>
                {documents?.find((d) => d.id === plan.document_id)?.title}
              </h2>
              <p>
                <CalendarDays size={16} />
                {t("目标日期：")}
                {dateLabel(plan.exam_date)} <span>·</span>
                <Clock3 size={16} />
                {t("{0} 分钟 / 天", plan.daily_minutes)}
                <span>·</span>
                {t("{0} 天 / 周", plan.days_per_week)}
              </p>
            </div>
            <div className="plan-completion">
              <strong>
                {plan.tasks.filter((t) => t.completed).length}
                <span> / {plan.tasks.length}</span>
              </strong>
              <small>{t("已完成任务")}</small>
            </div>
          </div>
          <div className="plan-toolbar">
            <h2>{t("你的学习路径")}</h2>
            {plans.length > 1 && (
              <select
                aria-label={t("选择复习计划")}
                value={plan.id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {documents?.find((d) => d.id === p.document_id)?.title ??
                      t("复习计划")}
                  </option>
                ))}
              </select>
            )}
            <div className="plan-legend">
              <span className="learn-dot" />
              {t("学习")}
              <span className="review-dot" />
              {t("复习")}
              <span className="focus-dot" />
              {t("重点复习")}
            </div>
          </div>
          <div className="plan-timeline">
            {Object.entries(groups).map(([day, tasks]) => (
              <section className="plan-day" key={day}>
                <div className="plan-date">
                  <span>
                    {new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                      weekday: "short",
                    })}
                  </span>
                  <strong>{new Date(`${day}T12:00:00`).getDate()}</strong>
                  <small>
                    {new Date(`${day}T12:00:00`).toLocaleDateString(locale, {
                      month: "short",
                    })}
                  </small>
                  {day === todayISO() && (
                    <Badge tone="green">{t("今天")}</Badge>
                  )}
                </div>
                <div className="plan-day-tasks">
                  {tasks?.map((task) => (
                    <div
                      className={`plan-task ${task.completed ? "completed" : ""}`}
                      key={task.id}
                    >
                      <button
                        className={`task-check ${task.completed ? "checked" : ""}`}
                        aria-label={`${task.completed ? t("标记为未完成") : t("完成")} ${task.title}`}
                        onClick={() => complete(task)}
                      >
                        <Check size={16} />
                      </button>
                      <div>
                        <span className={`task-kind kind-${task.kind}`}>
                          {task.kind === "learn"
                            ? t("初次学习")
                            : task.kind === "focus"
                              ? t("重点知识回顾")
                              : task.kind === "sprint"
                                ? t("综合回顾")
                                : t("间隔复习")}
                        </span>
                        <h3>{task.title}</h3>
                      </div>
                      <span className="task-duration">
                        {t("{0} 分钟", task.minutes)}
                      </span>
                      <Link
                        className="icon-button"
                        aria-label={t("查看原文：{0}", task.title)}
                        href={`/app/documents/${task.document_id}?tab=knowledge`}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
      {open && (
        <Modal
          title={t("为每天的进步，留一点时间。")}
          onClose={() => setOpen(false)}
        >
          {!available.length ? (
            <EmptyState
              title={t("先准备一份知识地图。")}
              description={t(
                "先添加原创样例，或连接 AI 模型处理自己的 PDF，再创建复习计划。",
              )}
            >
              <Link href="/app/library" className="button primary">
                {t("前往我的资料")}
              </Link>
            </EmptyState>
          ) : (
            <form onSubmit={create} className="plan-form">
              <label className="field">
                {t("学习资料")}
                <select
                  value={docId || available[0]?.id}
                  onChange={(e) => setDocId(e.target.value)}
                >
                  {available.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label className="field">
                  {t("目标 / 考试日期")}
                  <input
                    type="date"
                    value={exam}
                    min={todayISO()}
                    required
                    onChange={(e) => setExam(e.target.value)}
                  />
                </label>
                <label className="field">
                  {t("每天学习时长（分钟）")}
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  {t("每周学习天数")}
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <option value={d} key={d}>
                        {t("{0} 天", d)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  {t("学习顺序")}
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="balanced">{t("按文档顺序")}</option>
                    <option value="important">{t("优先学习重点")}</option>
                  </select>
                </label>
              </div>
              <div className="form-note">
                {t(
                  "学习时长会根据难度调整，复习至少间隔一天。创建后会替换这份文档已有的计划；如果时间不足，系统会提示调整，不会强行塞入超出容量的任务。",
                )}
              </div>
              {failure && (
                <p role="alert" className="form-error">
                  {t(failure)}
                </p>
              )}
              <button className="button primary full" disabled={busy}>
                {busy ? (
                  <Spinner label={t("正在制定计划")} />
                ) : (
                  t("生成我的复习计划")
                )}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
