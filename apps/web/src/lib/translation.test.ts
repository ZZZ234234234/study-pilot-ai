import { expect, it } from "vitest";
import {
  translationKey,
  translationPages,
  translationText,
  type TranslationOptions,
  type PageTranslation,
} from "./translation";

const options: TranslationOptions = {
  target: "zh-CN",
  style: "academic",
  glossary: "CNN = 卷积神经网络",
};
it("bounds translation batches without silently discarding pages", () => {
  expect(translationPages(3, 5, 12)).toEqual([3, 4, 5]);
  for (const [start, end] of [
    [0, 1],
    [2, 1],
    [1, 11],
    [2.5, 4],
    [10, 13],
  ])
    expect(() => translationPages(start, end, 12)).toThrow();
});
it("separates cache entries by page, target, style and glossary", () => {
  const keys = new Set([
    translationKey(1, options),
    translationKey(2, options),
    translationKey(1, { ...options, target: "en" }),
    translationKey(1, { ...options, style: "clear" }),
    translationKey(1, { ...options, glossary: "" }),
  ]);
  expect(keys.size).toBe(5);
  expect(
    translationKey(1, { ...options, glossary: options.glossary + " " }),
  ).toBe(translationKey(1, options));
});
it("exports exact source, separate translation and page/model provenance", () => {
  const result: PageTranslation = {
    ...options,
    page: 2,
    document_id: "doc",
    model: "test-model",
    segments: [
      {
        id: "p2-s1",
        source: "[12] x < 0.5\nOriginal",
        translation: "[12] x < 0.5\n译文",
      },
    ],
  };
  const text = translationText("My paper", [result]);
  expect(text).toContain(result.segments[0].source);
  expect(text).toContain(result.segments[0].translation);
  expect(text).toContain("Page / 页 2");
  expect(text).toContain("test-model");
  expect(text).toContain("Verify against the source");
});
