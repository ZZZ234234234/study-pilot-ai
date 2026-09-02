"use client";
import { useLocale } from "@/components/locale-provider";
import { useRef, useState } from "react";
import { UploadCloud, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Modal, Spinner } from "./ui";
import { errorMessage, uploadPdf } from "@/lib/api";
import type { Document } from "@/lib/types";
export function UploadDialog({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded: (doc: Document) => void;
}) {
  const { t } = useLocale();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  function choose(value?: File) {
    setError("");
    if (!value) return;
    if (!value.name.toLowerCase().endsWith(".pdf")) {
      setError(t("请选择 PDF 格式的文档。"));
      return;
    }
    if (value.size > 20 * 1024 * 1024) {
      setError(t("请选择小于 20 MB 的 PDF。"));
      return;
    }
    setFile(value);
  }
  async function submit() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const doc = await uploadPdf<Document>(file, setProgress);
      toast.success(t("PDF 已上传，正在准备你的学习空间。"));
      onUploaded(doc);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t("从一份资料开始。")}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="muted">{t("带上你的资料，一起把知识梳理清楚。")}</p>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        aria-label={t("选择 PDF 文件")}
        className="sr-only"
        onChange={(e) => choose(e.target.files?.[0])}
      />
      <button
        type="button"
        disabled={busy}
        className={`upload-zone ${drag ? "dragging" : ""}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          choose(e.dataTransfer.files[0]);
        }}
      >
        <span>
          <UploadCloud size={30} strokeWidth={1.4} />
        </span>
        <strong>{file ? t("更换 PDF 文件") : t("将 PDF 拖到这里")}</strong>
        <p>{t("或点击选择本地文件")}</p>
        <small>{t("仅支持 PDF · 不超过 20 MB · 建议使用文字版文档")}</small>
      </button>
      {file && (
        <div className="selected-file">
          <FileText size={23} />
          <div>
            <strong>{file.name}</strong>
            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          </div>
          {busy && <b>{progress}%</b>}
        </div>
      )}
      {busy && (
        <div className="upload-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p role="alert" className="form-error">
          {t(error)}
        </p>
      )}
      <p className="privacy-hint">
        <ShieldCheck size={15} />
        {t(
          "PDF 归属于当前浏览器的学习空间。启用真实 AI 后，相关文本会发送到你配置的模型服务。",
        )}
      </p>
      <button
        disabled={!file || busy}
        className="button primary full"
        onClick={submit}
      >
        {busy ? (
          <Spinner
            label={progress === 100 ? t("正在加入处理队列") : t("正在上传 PDF")}
          />
        ) : (
          <>
            {t("上传并开始整理")}
            <UploadCloud size={17} />
          </>
        )}
      </button>
    </Modal>
  );
}
