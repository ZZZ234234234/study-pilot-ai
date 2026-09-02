"use client";
import { useLocale } from "@/components/locale-provider";
import Link from "next/link";
export default function NotFound() {
  const { t } = useLocale();
  return (
    <main id="main-content" className="standalone-page">
      <p className="eyebrow">{t("404 / 页面未找到")}</p>
      <h1>{t("这一页，暂时找不到了。")}</h1>
      <p>{t("链接可能已失效。回到学习空间，继续刚才的思路吧。")}</p>
      <Link className="button primary" href="/app">
        {t("返回学习空间")}
      </Link>
    </main>
  );
}
