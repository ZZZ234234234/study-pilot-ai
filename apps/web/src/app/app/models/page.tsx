"use client";
import { ModelManager } from "@/components/model-manager";
import { PageHeading } from "@/components/ui";
import { useLocale } from "@/components/locale-provider";
export default function ModelsPage() {
  const { t } = useLocale();
  return (
    <>
      <PageHeading
        eyebrow="YOUR AI, YOUR CHOICE"
        title={t("适合你的模型，随时切换。")}
        description={t("连接 DeepSeek 与智谱，让问答和翻译按你的习惯工作。")}
      />
      <ModelManager />
    </>
  );
}
