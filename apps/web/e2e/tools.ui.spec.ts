import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { createDemo, mutationHeaders } from "./helpers";

const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=",
  "base64",
);

test("local image conversion produces a PDF download without an upload request", async ({
  page,
}) => {
  await page.goto("/app/tools");
  const uploads: string[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /documents|convert|translate/.test(request.url())
    )
      uploads.push(request.url());
  });
  await page
    .getByLabel("选择待转换文件")
    .setInputFiles([
      { name: "figure.png", mimeType: "image/png", buffer: pixel },
    ]);
  await page.getByRole("button", { name: "开始转换", exact: true }).click();
  await expect(page.getByText("转换完成，可以下载了。")).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "下载文件", exact: true }).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect((await PDFDocument.load(Buffer.concat(chunks))).getPageCount()).toBe(
    1,
  );
  expect(uploads).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("translation is available in the reader but does not fake demo output", async ({
  page,
  baseURL,
}) => {
  const doc = await createDemo(page.request, baseURL!);
  try {
    await page.goto(`/app/documents/${doc.id}?tab=translation`);
    await expect(
      page.getByRole("heading", { name: "论文对照翻译" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "翻译需要真实聊天模型，演示模式不会生成假译文。无需嵌入模型或重新建立索引。",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "翻译选中页" }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "导出对照文本" }),
    ).toBeDisabled();
  } finally {
    await page.request.delete(`/api/v1/documents/${doc.id}`, {
      headers: mutationHeaders(baseURL!),
    });
  }
});
