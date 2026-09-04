"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_LOCALE,
  getLocale,
  setLocale,
  subscribeLocale,
  translateText,
  type Locale,
} from "@/lib/i18n";

type LanguageContext = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, ...values: Array<string | number>) => string;
};
const Context = createContext<LanguageContext | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeLocale,
    getLocale,
    () => DEFAULT_LOCALE,
  );
  const pathname = usePathname();
  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string, ...values: Array<string | number>) =>
        translateText(key, locale, ...values),
    }),
    [locale],
  );
  useEffect(() => {
    document.documentElement.lang = locale;
    const section =
      pathname === "/privacy"
        ? "隐私与数据"
        : pathname === "/open-source"
          ? "开源说明"
          : pathname === "/app/authenticity"
            ? "真伪核验与维权"
            : pathname.includes("/documents/")
              ? "文档学习空间"
              : "";
    document.title = section
      ? `${translateText(section, locale)} · StudyPilot AI`
      : translateText("StudyPilot AI｜把资料读懂，把知识留下", locale);
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      translateText(
        "开源 AI 学习助手：阅读 PDF、梳理知识点、制定复习计划，用带原文引用的问答帮助你真正理解资料。",
        locale,
      ),
    );
    document
      .querySelector('meta[property="og:locale"]')
      ?.setAttribute("content", locale === "en" ? "en_US" : "zh_CN");
  }, [locale, pathname]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLocale(): LanguageContext {
  const context = useContext(Context);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

export function SkipLink() {
  const { t } = useLocale();
  return (
    <a href="#main-content" className="skip-link">
      {t("跳到主要内容")}
    </a>
  );
}
