import { test, expect } from "@playwright/test";
import { createDemo, createSession, mutationHeaders } from "./helpers";

test("toolkit route serves Chinese copy and local-conversion boundaries", async ({
  request,
}) => {
  const response = await request.get("/app/tools");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("图片转 PDF");
  expect(html).toContain("转换文件留在浏览器中");
  expect(html).toContain("Word、PPT");
});

test("translation API protects ownership, page bounds and refuses fake demo translations", async ({
  request,
  playwright,
  baseURL,
}) => {
  const doc = await createDemo(request, baseURL!);
  const headers = mutationHeaders(baseURL!);
  const stranger = await playwright.request.newContext({ baseURL });
  try {
    const response = await request.post(
      `/api/v1/documents/${doc.id}/translate`,
      { headers, data: { page: 1, target: "zh-CN", style: "academic" } },
    );
    expect(response.status()).toBe(409);
    expect((await response.json()).code).toBe("translation_provider_required");
    expect(
      (
        await request.post(`/api/v1/documents/${doc.id}/translate`, {
          headers,
          data: { page: 1, target: "fr" },
        })
      ).status(),
    ).toBe(422);
    expect(
      (
        await request.post(`/api/v1/documents/${doc.id}/translate`, {
          headers,
          data: { page: 99 },
        })
      ).status(),
    ).toBe(404);
    await createSession(stranger, baseURL!);
    expect(
      (
        await stranger.post(`/api/v1/documents/${doc.id}/translate`, {
          headers,
          data: { page: 1 },
        })
      ).status(),
    ).toBe(404);
    const source = await request.get(
      `/api/v1/documents/${doc.id}/pages?page=1`,
    );
    expect((await source.json())[0].text).toContain("Neural");
  } finally {
    await stranger.dispose();
    await request.delete(`/api/v1/documents/${doc.id}`, { headers });
  }
});
