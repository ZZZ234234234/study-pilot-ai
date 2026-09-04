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

test("public pages and metadata default to Simplified Chinese", async ({
  request,
}) => {
  const home = await request.get("/");
  const html = await home.text();
  expect(html).toContain('lang="zh-CN"');
  expect(html).toContain("把资料读懂");
  expect(html).toContain("体验内置样例");
  expect(html).toContain('content="zh_CN"');
  expect(html).not.toContain("structured knowledge.");
  const missing = await request.get("/missing-chinese-page");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("这一页，暂时找不到了。");
});

test("Chinese demo questions find the correct original pages without translating quotes", async ({
  request,
  baseURL,
}) => {
  const document = await createDemo(request, baseURL!);
  const headers = mutationHeaders(baseURL!);
  const endpoint = `/api/v1/documents/${document.id}`;
  for (const [question, page] of [
    ["卷积为什么有用？", 4],
    ["反向传播是怎样工作的？", 3],
    ["验证集和测试集有什么区别？", 6],
  ] as const) {
    const response = await request.post(`${endpoint}/chat`, {
      headers,
      data: { question },
    });
    expect(response.status()).toBe(200);
    const answer = await response.json();
    expect(answer.content).toContain("不是真实 AI");
    expect(
      answer.citations.some(
        (citation: { page_number: number }) => citation.page_number === page,
      ),
    ).toBe(true);
    for (const citation of answer.citations) {
      const source = await (
        await request.get(`${endpoint}/pages?page=${citation.page_number}`)
      ).json();
      expect(source[0].text.replace(/\s+/g, " ")).toContain(
        citation.quote.replace(/\s+/g, " "),
      );
    }
  }
  expect((await request.delete(endpoint, { headers })).status()).toBe(204);
});

for (const route of [
  "/",
  "/app",
  "/app/library",
  "/app/study-plan",
  "/app/settings",
  "/app/authenticity",
  "/privacy",
  "/open-source",
]) {
  test(`serves ${route} with security headers`, async ({ request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/html");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(await response.text()).toContain('lang="zh-CN"');
  });
}

test("authenticity page identifies the creator and verification methods", async ({
  request,
}) => {
  const response = await request.get("/app/authenticity");
  const html = await response.text();
  expect(response.status()).toBe(200);
  expect(html).toContain("爱吃孜然芥末");
  expect(html).toContain("SHA-256");
  expect(html).toContain("GitHub");
  expect(html).toContain("2014546082@qq.com");
});

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
    data: { question: "卷积为什么有用？" },
  });
  expect(answerResponse.status()).toBe(200);
  const answer = await answerResponse.json();
  expect(answer.citations[0].page_number).toBe(4);
  expect(answer.content).toContain("演示");
  expect(answer.citations[0].quote).toMatch(/[A-Za-z]/);
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
  const check = await request.post("/api/v1/settings/test", {
    headers: mutationHeaders(baseURL!),
  });
  expect(check.status()).toBe(200);
  expect((await check.json()).message).toBe(
    "演示模式运行正常，本次检查没有调用外部模型。",
  );
});
