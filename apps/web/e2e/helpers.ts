import { expect, type APIRequestContext, type Page } from "@playwright/test";

export function mutationHeaders(baseURL: string) {
  return { "X-StudyPilot": "1", Origin: new URL(baseURL).origin };
}

export async function createSession(
  request: APIRequestContext,
  baseURL: string,
) {
  const response = await request.post("/api/v1/session", {
    headers: mutationHeaders(baseURL),
  });
  expect(response.status()).toBe(200);
  return response;
}

export async function waitForDocument(request: APIRequestContext, id: string) {
  await expect
    .poll(
      async () => {
        const response = await request.get(`/api/v1/documents/${id}`);
        expect(response.status()).toBe(200);
        return (await response.json()).status;
      },
      { timeout: 30_000, intervals: [200, 500, 1000] },
    )
    .toBe("ready");
  return (await request.get(`/api/v1/documents/${id}`)).json();
}

export async function createDemo(request: APIRequestContext, baseURL: string) {
  await createSession(request, baseURL);
  const response = await request.post("/api/v1/documents/demo", {
    headers: mutationHeaders(baseURL),
  });
  expect(response.status()).toBe(202);
  const document = await response.json();
  return waitForDocument(request, document.id);
}

export async function showPanel(page: Page, panel: "PDF" | "学习助手") {
  const button = page.getByRole("button", { name: panel, exact: true });
  if (await button.isVisible()) await button.click();
}

export async function expectCanvas(page: Page) {
  await expect(page.locator(".pdf-reader canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.locator(".pdf-reader canvas").evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        if (canvas.width < 200 || canvas.height < 200) return false;
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let visibleInk = 0;
        for (let i = 0; i < pixels.length; i += 16) {
          if (
            pixels[i + 3] > 200 &&
            pixels[i] < 200 &&
            pixels[i + 1] < 200 &&
            pixels[i + 2] < 200
          )
            visibleInk++;
        }
        return visibleInk > 100;
      }),
    )
    .toBe(true);
  await expect(page.locator(".pdf-rendering")).toHaveCount(0);
}
