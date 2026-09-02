import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  createSession,
  expectCanvas,
  mutationHeaders,
  waitForDocument,
} from "./helpers";

test("an uploaded PDF gives Chinese setup guidance without a failed AI request", async ({
  page,
  baseURL,
}, testInfo) => {
  await createSession(page.request, baseURL!);
  const upload = await page.request.post("/api/v1/documents", {
    headers: mutationHeaders(baseURL!),
    multipart: {
      file: {
        name: "配置引导测试.pdf",
        mimeType: "application/pdf",
        buffer: readFileSync(
          path.resolve(
            __dirname,
            "../../../docs/sample/introduction-to-neural-networks.pdf",
          ),
        ),
      },
    },
  });
  expect(upload.status()).toBe(202);
  const document = await waitForDocument(
    page.request,
    (await upload.json()).id,
  );
  const aiRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/(chat|quiz|flashcards)$/.test(request.url())
    )
      aiRequests.push(request.url());
  });
  await page.goto(`/app/documents/${document.id}`);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("heading", { name: "原文已就绪，AI 功能还差一步。" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "前往模型设置" }),
  ).toHaveAttribute("href", "/app/settings");
  for (const name of ["知识地图", "知识闪卡", "理解测验", "文档问答"]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".provider-notice")).toBeVisible();
  }
  expect(aiRequests).toEqual([]);
  await expect(
    page.getByText("Configure an AI Provider", { exact: false }),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("chinese-model-setup.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "先阅读 PDF" }).click();
  await expectCanvas(page);
});
