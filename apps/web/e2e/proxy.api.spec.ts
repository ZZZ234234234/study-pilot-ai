import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  createDemo,
  createSession,
  mutationHeaders,
  waitForDocument,
} from "./helpers";

const root = path.resolve(__dirname, "../../..");

for (const route of [
  "/",
  "/app",
  "/app/library",
  "/app/study-plan",
  "/app/settings",
  "/privacy",
  "/open-source",
]) {
  test(`serves ${route} with security headers`, async ({ request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });
}

test("unknown page has a real 404 response", async ({ request }) => {
  expect((await request.get("/e2e-page-that-does-not-exist")).status()).toBe(
    404,
  );
});

test("standalone homepage serves its compiled CSS and JavaScript", async ({
  request,
}) => {
  const response = await request.get("/");
  const html = await response.text();
  const urls = [
    ...new Set(
      [
        ...html.matchAll(
          /(?:src|href)="(\/_next\/static\/[^"?]+\.(?:css|js))"/g,
        ),
      ].map((match) => match[1]),
    ),
  ];
  expect(urls.some((url) => url.endsWith(".css"))).toBe(true);
  expect(urls.some((url) => url.endsWith(".js"))).toBe(true);
  for (const url of urls) {
    const asset = await request.get(url);
    expect(asset.status()).toBe(200);
    expect(asset.headers()["content-type"]).not.toContain("text/html");
    expect((await asset.body()).length).toBeGreaterThan(0);
  }
});

test("production server serves the exact locked PDF worker and supporting assets", async ({
  request,
}) => {
  for (const [url, source] of [
    ["/pdf.worker.min.mjs", "build/pdf.worker.min.mjs"],
    ["/pdfjs/cmaps/Adobe-GB1-UCS2.bcmap", "cmaps/Adobe-GB1-UCS2.bcmap"],
    [
      "/pdfjs/standard_fonts/LiberationSans-Regular.ttf",
      "standard_fonts/LiberationSans-Regular.ttf",
    ],
    ["/pdfjs/wasm/openjpeg.wasm", "wasm/openjpeg.wasm"],
  ]) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(await response.body()).toEqual(
      readFileSync(path.join(root, "node_modules/pdfjs-dist", source)),
    );
  }
});

test("mutation guard and workspace cookie survive the frontend proxy", async ({
  request,
  baseURL,
}) => {
  expect((await request.post("/api/v1/session")).status()).toBe(403);
  const response = await createSession(request, baseURL!);
  expect(response.headers()["set-cookie"]).toMatch(/httponly/i);
  expect(response.headers()["set-cookie"]).toMatch(/samesite=lax/i);
  expect(
    (
      await request.post("/api/v1/session", {
        headers: { "X-StudyPilot": "1", Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
});

test("sample, citations, byte ranges and workspace isolation work through the proxy", async ({
  request,
  playwright,
  baseURL,
}) => {
  const document = await createDemo(request, baseURL!);
  const url = `/api/v1/documents/${document.id}`;
  const headers = mutationHeaders(baseURL!);
  expect(document.page_count).toBe(8);
  expect(document.knowledge_count).toBe(16);
  const pdf = await request.get(`${url}/file`, {
    headers: { Range: "bytes=0-15" },
  });
  expect(pdf.status()).toBe(206);
  expect(pdf.headers()["cache-control"]).toBe("no-store");
  expect(pdf.headers()["content-range"]).toMatch(/^bytes 0-15\/\d+$/);
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const answerResponse = await request.post(`${url}/chat`, {
    headers,
    data: { question: "Why is convolution useful?" },
  });
  expect(answerResponse.status()).toBe(200);
  const answer = await answerResponse.json();
  expect(answer.citations[0].page_number).toBe(4);
  const stranger = await playwright.request.newContext({ baseURL });
  try {
    await createSession(stranger, baseURL!);
    for (const route of [url, `${url}/file`])
      expect((await stranger.get(route)).status()).toBe(404);
    expect((await stranger.delete(url, { headers })).status()).toBe(404);
  } finally {
    await stranger.dispose();
  }
  const renamed = await request.patch(url, {
    headers,
    data: { title: "E2E learning sample" },
  });
  expect(renamed.status()).toBe(200);
  expect((await renamed.json()).title).toBe("E2E learning sample");
  expect((await request.delete(url, { headers })).status()).toBe(204);
  expect((await request.get(`${url}/file`)).status()).toBe(404);
});

test("multipart upload is readable; demo mode refuses simulated AI for user PDFs", async ({
  request,
  baseURL,
}) => {
  await createSession(request, baseURL!);
  const headers = mutationHeaders(baseURL!);
  const response = await request.post("/api/v1/documents", {
    headers,
    multipart: {
      file: {
        name: "e2e-upload.pdf",
        mimeType: "application/pdf",
        buffer: readFileSync(
          path.join(root, "docs/sample/introduction-to-neural-networks.pdf"),
        ),
      },
    },
  });
  expect(response.status()).toBe(202);
  const uploaded = await response.json();
  const document = await waitForDocument(request, uploaded.id);
  expect(document.ai_status).toBe("not_configured");
  expect(document.knowledge_count).toBe(0);
  expect(
    (
      await request.post(`/api/v1/documents/${uploaded.id}/chat`, {
        headers,
        data: { question: "Explain the first page" },
      })
    ).status(),
  ).toBe(409);
  const invalid = await request.post("/api/v1/documents", {
    headers,
    multipart: {
      file: {
        name: "invalid.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("Not a PDF"),
      },
    },
  });
  expect(invalid.status()).toBe(415);
  expect(
    (
      await request.delete(`/api/v1/documents/${uploaded.id}`, { headers })
    ).status(),
  ).toBe(204);
});

test("settings expose demo status but not server credentials", async ({
  request,
  baseURL,
}) => {
  await createSession(request, baseURL!);
  const response = await request.get("/api/v1/settings");
  expect(response.status()).toBe(200);
  const settings = await response.json();
  expect(settings.provider).toBe("demo");
  for (const key of ["api_key", "session_secret", "database_url"])
    expect(settings).not.toHaveProperty(key);
});
