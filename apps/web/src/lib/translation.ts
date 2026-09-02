export type TranslationOptions = {
  target: "zh-CN" | "en";
  style: "academic" | "clear";
  glossary: string;
};
export type PageTranslation = TranslationOptions & {
  document_id: string;
  page: number;
  model: string;
  segments: { id: string; source: string; translation: string }[];
};

export function translationKey(page: number, options: TranslationOptions) {
  return JSON.stringify([
    page,
    options.target,
    options.style,
    options.glossary.trim(),
  ]);
}

export function translationPages(start: number, end: number, count: number) {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 1 ||
    end > count ||
    end < start
  )
    throw new Error("请选择文档范围内的有效页码。");
  if (end - start >= 10)
    throw new Error("每批最多翻译 10 页，请分批处理长论文。");
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function translationText(title: string, results: PageTranslation[]) {
  return [
    title,
    "StudyPilot AI · AI translation / AI 译文 · 请对照原文核实 / Verify against the source",
    ...results.flatMap((result) => [
      `\n--- Page / 页 ${result.page} · ${result.target} · ${result.style} · ${result.model} ---`,
      ...result.segments.flatMap((segment) => [
        "\n[Original / 原文]",
        segment.source,
        "\n[Translation / 译文]",
        segment.translation,
      ]),
    ]),
  ].join("\n");
}
