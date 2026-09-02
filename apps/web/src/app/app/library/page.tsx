"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
import useSWR from "swr";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileText,
  Plus,
  Search,
  Trash2,
  Pencil,
  RotateCw,
  ListFilter,
} from "lucide-react";
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
import { DemoButton } from "@/components/demo-button";
import { UploadDialog } from "@/components/upload-dialog";
import { api, dateLabel, errorMessage, patch, post } from "@/lib/api";
import type { Document } from "@/lib/types";
import { documentStatus } from "@/lib/locale";
export default function LibraryPage() {
  return (
    <Suspense fallback={<Skeleton lines={4} />}>
      <LibraryContent />
    </Suspense>
  );
}
function LibraryContent() {
  const { t } = useLocale();
  const params = useSearchParams();
  const { data, error, mutate } = useSWR<Document[]>("/documents", {
    refreshInterval: 3000,
  });
  const [upload, setUpload] = useState(params.get("upload") === "1");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState<Document>();
  const [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState<Document>();
  const [busy, setBusy] = useState(false);
  const documents = data?.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || d.status === filter),
  );
  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await patch(`/documents/${edit.id}`, { title });
      setEdit(undefined);
      mutate();
      toast.success(t("文档名称已更新。"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/documents/${deleting.id}`, { method: "DELETE" });
      setDeleting(undefined);
      mutate();
      toast.success(t("文档及相关学习记录已删除。"));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function retry(id: string) {
    try {
      await post(`/documents/${id}/reprocess`);
      mutate();
      toast.success(t("文档已重新加入处理队列。"));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={t("少一点收藏，多一点理解")}
        title={t("我的学习资料。")}
        description={t("把值得理解的内容，放在触手可及的地方。")}
      >
        <button className="button primary" onClick={() => setUpload(true)}>
          <Plus size={18} />
          {t("上传 PDF")}
        </button>
      </PageHeading>
      <div className="library-tools">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label={t("搜索资料")}
            placeholder={t("搜索资料名称…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>PDF</kbd>
        </label>
        <label className="filter-select">
          <ListFilter size={16} />
          <select
            aria-label={t("筛选文档状态")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t("全部资料")}</option>
            <option value="ready">{t("已就绪")}</option>
            <option value="indexing">{t("处理中")}</option>
            <option value="failed">{t("处理失败")}</option>
          </select>
        </label>
      </div>
      <div className="section-heading">
        <h2>
          {search ? t("搜索结果") : t("全部资料")}{" "}
          <span className="count-label">{documents?.length ?? 0}</span>
        </h2>
        <span className="tiny muted">{t("最近添加的优先显示")}</span>
      </div>
      {error ? (
        <ErrorState error={error} retry={() => mutate()} />
      ) : !documents ? (
        <Skeleton lines={4} />
      ) : documents.length ? (
        <div className="library-grid">
          {documents.map((doc, i) => (
            <article className="library-document" key={doc.id}>
              <Link
                href={`/app/documents/${doc.id}`}
                className={`document-art art-${i % 3}`}
              >
                <div className="document-sheet">
                  <span>{t("STUDYPILOT / 阅读笔记")}</span>
                  <BookOpen size={39} strokeWidth={1.2} />
                  <strong>{doc.title}</strong>
                  <span className="sheet-line" />
                  <span className="sheet-line short" />
                  <small>
                    {t("{0} 页原文", doc.page_count || "—")}
                    <ArrowUpRight size={14} />
                  </small>
                </div>
                {doc.is_demo && (
                  <span className="sample-flag">{t("原创英文样例")}</span>
                )}
              </Link>
              <div className="library-doc-info">
                <div>
                  <Badge tone={doc.status === "ready" ? "green" : "amber"}>
                    {doc.status === "ready" ? (
                      <>
                        <Check size={11} />
                        {t("已就绪")}
                      </>
                    ) : doc.status === "failed" ? (
                      t("需要处理")
                    ) : (
                      <Spinner label={t(documentStatus[doc.status])} />
                    )}
                  </Badge>
                  <span className="tiny muted">
                    {dateLabel(doc.created_at)}
                  </span>
                </div>
                <Link href={`/app/documents/${doc.id}`}>
                  <h3>{doc.title}</h3>
                </Link>
                <p>
                  {t("{0} 页", doc.page_count)}
                  <span>·</span> {t("{0} 个知识点", doc.knowledge_count)}
                </p>
                {doc.status === "failed" && (
                  <p className="form-error small-error">
                    {errorMessage(
                      new Error(doc.error ?? t("文档处理未完成。")),
                    )}
                  </p>
                )}
                {doc.status !== "ready" && doc.status !== "failed" && (
                  <div className="upload-progress">
                    <span style={{ width: `${doc.progress}%` }} />
                  </div>
                )}
                <div className="document-actions">
                  <Link
                    href={`/app/documents/${doc.id}`}
                    className="text-button"
                  >
                    {t("打开文档")}
                    <ArrowUpRight size={15} />
                  </Link>
                  <div>
                    {doc.status === "failed" && (
                      <button
                        className="icon-button"
                        aria-label={t("重试：{0}", doc.title)}
                        onClick={() => retry(doc.id)}
                      >
                        <RotateCw size={15} />
                      </button>
                    )}
                    <button
                      className="icon-button"
                      aria-label={t("重命名：{0}", doc.title)}
                      onClick={() => {
                        setEdit(doc);
                        setTitle(doc.title);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={t("删除：{0}", doc.title)}
                      onClick={() => setDeleting(doc)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          <button className="add-document" onClick={() => setUpload(true)}>
            <span>
              <Plus size={26} />
            </span>
            <strong>{t("为新知识，留一点空间。")}</strong>
            <p>{t("添加一份新的 PDF 资料")}</p>
          </button>
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title={search ? t("没有找到相关资料。") : t("从空白开始，也很好。")}
            description={
              search
                ? t("换个名称或状态条件再试试。")
                : t("添加课程笔记、论文，或先体验我们原创的 8 页样例。")
            }
          >
            {!search && <DemoButton onCreated={() => mutate()} />}
          </EmptyState>
        </div>
      )}
      <div className="library-bottom-note">
        <FileText size={20} />
        <p>
          {t("建议使用文字版 PDF。扫描件请先完成文字识别，再上传。")}
          <br />
          <span>{t("每份文档不超过 20 MB、300 页。")}</span>
        </p>
        <DemoButton className="text-button" onCreated={() => mutate()}>
          {t("添加样例")}
        </DemoButton>
      </div>
      {upload && (
        <UploadDialog
          onClose={() => setUpload(false)}
          onUploaded={() => {
            setUpload(false);
            mutate();
          }}
        />
      )}
      {edit && (
        <Modal title={t("重命名文档")} onClose={() => setEdit(undefined)}>
          <label className="field">
            {t("文档名称")}
            <input
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>
          <button
            className="button primary full"
            disabled={busy || !title.trim()}
            onClick={save}
          >
            {busy ? <Spinner /> : t("保存名称")}
          </button>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={t("确定删除这份文档？")}
          onClose={() => setDeleting(undefined)}
        >
          <p>
            {t("删除")}
            <strong>{deleting.title}</strong>
            {t(
              "也会永久删除原始 PDF、提取的文本、向量、知识点、问答、计划、闪卡和测验记录。此操作无法撤销。",
            )}
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(undefined)}
            >
              {t("保留文档")}
            </button>
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? <Spinner /> : t("永久删除")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
