"use client";
import { useLocale } from "@/components/locale-provider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { post, errorMessage } from "@/lib/api";
import type { Document } from "@/lib/types";
import { Spinner } from "./ui";
export function DemoButton({
  className = "button secondary",
  children,
  onCreated,
}: {
  className?: string;
  children?: React.ReactNode;
  onCreated?: () => void;
}) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function load() {
    setBusy(true);
    try {
      const doc = await post<Document>("/documents/demo");
      toast.success(t("已将原创样例添加到你的学习空间。"));
      if (onCreated) onCreated();
      else router.push(`/app/documents/${doc.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={load} disabled={busy} className={className}>
      {busy ? (
        <Spinner label={t("正在打开样例")} />
      ) : (
        <>
          {children ?? t("体验样例 PDF")}
          <ArrowUpRight size={17} />
        </>
      )}
    </button>
  );
}
