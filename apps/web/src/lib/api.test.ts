import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, cn, errorMessage, todayISO } from "./api";
import { errorMessages } from "./locale";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("API helpers", () => {
  it("joins only active classes", () => {
    expect(cn("button", false, undefined, "primary", null)).toBe(
      "button primary",
    );
  });
  it("retains safe error messages", () => {
    expect(errorMessage(new ApiError("请重试。", "offline", 503))).toBe(
      "请重试。",
    );
    expect(errorMessage(null)).toBe("请稍后重试。");
  });
  it("returns a local calendar date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 1, 12, 0, 0));
    expect(todayISO()).toBe("2026-09-01");
  });
  it("creates a session before requesting private data", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response('{"count":0}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await api("/dashboard")).toEqual({ count: 0 });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/session");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/dashboard");
    expect(fetchMock.mock.calls[1][1].headers["X-StudyPilot"]).toBe("1");
  });
  it("surfaces structured server errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response('{"detail":"Not found","code":"not_found"}', {
          status: 404,
        }),
      ),
    );
    await expect(api("/documents/missing")).rejects.toMatchObject({
      message: errorMessages.not_found,
      code: "not_found",
      status: 404,
    });
  });
});
