import { describe, expect, it } from "vitest";
import { ApiError, dateLabel, errorMessage } from "./api";
import {
  chineseErrorMessage,
  difficultyLabel,
  documentStatus,
  errorMessages,
  importanceLabel,
  reviewGrade,
  taskKind,
} from "./locale";
import { shouldSendQuestion } from "./keyboard";

describe("Simplified Chinese interface", () => {
  it("labels machine statuses without changing the API values", () => {
    expect(documentStatus.ready).toBe("已就绪");
    expect(reviewGrade.good).toBe("记住了");
    for (const labels of [
      documentStatus,
      reviewGrade,
      taskKind,
      importanceLabel,
      difficultyLabel,
      errorMessages,
    ]) {
      for (const value of Object.values(labels))
        expect(value).toMatch(/[\u3400-\u9fff]/);
    }
  });
  it("localizes the provider-required error from an older English server", () => {
    const error = new ApiError(
      "Configure an AI Provider to continue. Your PDF is parsed and searchable; AI features are not simulated for uploaded files.",
      "provider_required",
      409,
    );
    expect(errorMessage(error)).toBe(errorMessages.provider_required);
    expect(errorMessage(error)).toContain("模型设置");
    expect(errorMessage(error)).not.toContain("Configure");
    expect(error.status).toBe(409);
    expect(error.code).toBe("provider_required");
  });
  it("uses a Chinese fallback instead of exposing a raw dependency failure", () => {
    expect(
      chineseErrorMessage("Internal library failure at private-host:1234"),
    ).toBe("操作暂时未完成，请稍后重试。");
    expect(chineseErrorMessage("请重新选择文档。")).toBe("请重新选择文档。");
  });
  it("shows Chinese calendar dates", () => {
    expect(dateLabel("2026-09-02")).toBe("9月2日");
  });
});

describe("Chinese input method", () => {
  const enter = {
    key: "Enter",
    shiftKey: false,
    isComposing: false,
    keyCode: 13,
  };
  it("does not submit while a candidate is being confirmed", () => {
    expect(shouldSendQuestion({ ...enter, isComposing: true })).toBe(false);
    expect(shouldSendQuestion({ ...enter, keyCode: 229 })).toBe(false);
  });
  it("reserves Shift+Enter for a new line", () => {
    expect(shouldSendQuestion({ ...enter, shiftKey: true })).toBe(false);
  });
  it("submits a normal Enter after composition ends", () => {
    expect(shouldSendQuestion(enter)).toBe(true);
    expect(shouldSendQuestion({ ...enter, key: "a" })).toBe(false);
  });
});
