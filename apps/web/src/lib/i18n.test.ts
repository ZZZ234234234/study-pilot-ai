import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { english } from "./translations";
import { translateText } from "./i18n";
import { ApiError, dateLabel, errorMessage } from "./api";
import {
  documentStatus,
  taskKind,
  difficultyLabel,
  importanceLabel,
  reviewGrade,
  errorMessages,
} from "./locale";

afterEach(() => vi.unstubAllGlobals());

function storageWindow(initial?: string, blocked = false) {
  const values = new Map(initial ? [["studypilot:locale", initial]] : []);
  const events = new Map<string, (event: { key: string | null }) => void>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => {
        if (blocked) throw new Error("Storage blocked");
        return values.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (blocked) throw new Error("Storage blocked");
        values.set(key, value);
      },
    },
    addEventListener: (
      name: string,
      cb: (event: { key: string | null }) => void,
    ) => events.set(name, cb),
    removeEventListener: (name: string) => events.delete(name),
  });
  return { values, events };
}

describe("language preference", () => {
  it("defaults to Chinese without using the browser's language", async () => {
    vi.resetModules();
    storageWindow();
    vi.stubGlobal("navigator", { language: "en-US" });
    expect((await import("./i18n")).getLocale()).toBe("zh-CN");
  });
  it("restores English after a fresh module load", async () => {
    vi.resetModules();
    storageWindow("en");
    expect((await import("./i18n")).getLocale()).toBe("en");
  });
  it("ignores unsupported saved values", async () => {
    vi.resetModules();
    storageWindow("invalid-language");
    expect((await import("./i18n")).getLocale()).toBe("zh-CN");
  });
  it("saves both selections and notifies mounted consumers", async () => {
    vi.resetModules();
    const { values } = storageWindow();
    const locale = await import("./i18n");
    const update = vi.fn();
    const unsubscribe = locale.subscribeLocale(update);
    locale.setLocale("en");
    expect(locale.getLocale()).toBe("en");
    expect(values.get(locale.LOCALE_STORAGE_KEY)).toBe("en");
    locale.setLocale("zh-CN");
    expect(values.get(locale.LOCALE_STORAGE_KEY)).toBe("zh-CN");
    expect(update).toHaveBeenCalledTimes(2);
    unsubscribe();
    locale.setLocale("en");
    expect(update).toHaveBeenCalledTimes(2);
  });
  it("still switches for this visit when browser storage is blocked", async () => {
    vi.resetModules();
    storageWindow(undefined, true);
    const locale = await import("./i18n");
    expect(locale.getLocale()).toBe("zh-CN");
    expect(() => locale.setLocale("en")).not.toThrow();
    expect(locale.getLocale()).toBe("en");
  });
  it("follows another tab and returns to Chinese when storage is cleared", async () => {
    vi.resetModules();
    const { values, events } = storageWindow();
    const locale = await import("./i18n");
    const unsubscribe = locale.subscribeLocale(vi.fn());
    expect(locale.getLocale()).toBe("zh-CN");
    values.set(locale.LOCALE_STORAGE_KEY, "en");
    events.get("storage")!({ key: locale.LOCALE_STORAGE_KEY });
    expect(locale.getLocale()).toBe("en");
    values.clear();
    events.get("storage")!({ key: null });
    expect(locale.getLocale()).toBe("zh-CN");
    unsubscribe();
    expect(events.size).toBe(0);
  });
});

describe("bilingual interface copy", () => {
  it("translates every literal used by a UI translation call", () => {
    const walk = (directory: string): string[] =>
      readdirSync(directory, { withFileTypes: true }).flatMap((item) =>
        item.isDirectory()
          ? walk(path.join(directory, item.name))
          : [path.join(directory, item.name)],
      );
    const missing: string[] = [];
    for (const file of walk(path.resolve("src")).filter(
      (file) => file.endsWith(".tsx") && !file.includes(".test."),
    )) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const visit = (node: ts.Node) => {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(source) === "t" &&
          ts.isStringLiteral(node.arguments[0]) &&
          !Object.hasOwn(english, node.arguments[0].text)
        )
          missing.push(`${file}: ${node.arguments[0].text}`);
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(missing).toEqual([]);
  });
  it("translates status, difficulty, grade and error dictionaries without changing codes", () => {
    for (const labels of [
      documentStatus,
      taskKind,
      difficultyLabel,
      importanceLabel,
      reviewGrade,
      errorMessages,
    ]) {
      for (const value of Object.values(labels)) {
        expect(Object.hasOwn(english, value), value).toBe(true);
        expect(translateText(value, "en"), value).not.toMatch(
          /[\u3400-\u9fff]/,
        );
      }
    }
    expect(translateText("good", "en")).toBe("good");
  });
  it("formats interpolated counts and keeps supplied source text intact", () => {
    expect(translateText("PDF 第 {0} 页，共 {1} 页", "en", 2, 8)).toBe(
      "PDF page 2 of 8",
    );
    expect(translateText("{0} 分钟", "en", 0)).toBe("0 min");
    expect(translateText("查看原文：{0}", "en", "中文原文 $& {1}")).toBe(
      "View source: 中文原文 $& {1}",
    );
  });
  it("formats dates in the selected language", () => {
    expect(dateLabel("2026-09-02", "zh-CN")).toBe("9月2日");
    expect(dateLabel("2026-09-02", "en")).toBe("Sep 2");
  });
  it("can change the language of the same cached structured error", () => {
    const failure = new ApiError(
      "Configure an AI Provider",
      "provider_required",
      409,
    );
    expect(errorMessage(failure, "zh-CN")).toContain("模型设置");
    expect(errorMessage(failure, "en")).toContain("Settings");
    expect(failure.code).toBe("provider_required");
    expect(failure.status).toBe(409);
  });
  it("preserves unknown text and translates known cached feedback back to Chinese", () => {
    expect(translateText("My original source 引用", "en")).toBe(
      "My original source 引用",
    );
    expect(
      translateText(
        translateText("演示模式运行正常，本次检查没有调用外部模型。", "en"),
        "zh-CN",
      ),
    ).toBe("演示模式运行正常，本次检查没有调用外部模型。");
  });
});
