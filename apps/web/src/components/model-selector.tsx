"use client";
import Link from "next/link";
import { Cable } from "lucide-react";
import type { AIProfiles } from "@/lib/types";
import { useLocale } from "./locale-provider";

export function ModelSelector({
  data,
  value,
  onChange,
  disabled,
  failed = false,
}: {
  data?: AIProfiles;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  failed?: boolean;
}) {
  const { t } = useLocale();
  return (
    <div className="model-selector">
      <label>
        <Cable size={14} />
        <span className="sr-only">{t("本次使用的模型")}</span>
        <select
          aria-label={t("本次使用的模型")}
          value={value}
          disabled={disabled || !data}
          onChange={(e) => onChange(e.target.value)}
        >
          {!data ? (
            <option value={value}>
              {failed ? t("模型列表读取失败") : t("正在读取模型配置…")}
            </option>
          ) : (
            <>
              <option value="server">{t("原有服务 / 演示")}</option>
              {!data.profiles.some((p) => p.id === value) &&
                value !== "server" && (
                  <option value={value}>{t("模型已移除，请重新选择")}</option>
                )}
              {data.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.model}
                </option>
              ))}
            </>
          )}
        </select>
      </label>
      <Link href="/app/models" title={t("管理 API 接入")}>
        {t("管理")}
      </Link>
    </div>
  );
}
