"use client";
import { useLocale } from "@/components/locale-provider";
import { ErrorState } from "@/components/ui";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t } = useLocale();
  return (
    <ErrorState
      error={new Error(t("学习空间暂时无法加载，请确认后端服务已启动后重试。"))}
      retry={reset}
    />
  );
}
