"use client";

import { useLocale } from "./locale-provider";

export function LanguageSettings() {
  const { locale, setLocale, t } = useLocale();
  return (
    <section
      className="panel language-settings"
      aria-labelledby="language-heading"
    >
      <div>
        <p className="eyebrow">{t("按你的习惯使用")}</p>
        <h2 id="language-heading">{t("界面语言")}</h2>
        <p>
          {t(
            "默认使用简体中文。选择会自动保存在当前浏览器，不会更改文档原文或已有学习记录。",
          )}
        </p>
      </div>
      <fieldset className="language-options">
        <legend className="sr-only">{t("选择界面语言")}</legend>
        {(
          [
            ["zh-CN", "简体中文"],
            ["en", "English"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={locale === value ? "selected" : ""}>
            <input
              type="radio"
              name="interface-language"
              value={value}
              checked={locale === value}
              onChange={() => setLocale(value)}
            />
            <span lang={value}>{label}</span>
          </label>
        ))}
      </fieldset>
      <p className="sr-only" role="status">
        {locale === "en"
          ? "Interface language: English. Your choice is saved when browser storage is available."
          : "当前界面语言：简体中文。浏览器允许存储时会自动记住选择。"}
      </p>
    </section>
  );
}
