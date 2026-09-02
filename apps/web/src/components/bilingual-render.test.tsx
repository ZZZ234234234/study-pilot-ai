import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { translateText } from "../lib/i18n";

const fixture = vi.hoisted(() => ({
  locale: "en" as "en" | "zh-CN",
  data: {} as Record<string, unknown>,
}));
vi.mock("./locale-provider", () => ({
  useLocale: () => ({
    locale: fixture.locale,
    setLocale: vi.fn(),
    t: (key: string, ...values: Array<string | number>) =>
      translateText(key, fixture.locale, ...values),
  }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/settings",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("swr", () => ({
  default: (key: string) => ({
    data: fixture.data[key],
    error: undefined,
    mutate: vi.fn(),
  }),
}));

import Landing from "../app/page";
import SettingsPage from "../app/app/settings/page";
import PrivacyPage from "../app/privacy/page";
import OpenSourcePage from "../app/open-source/page";
import NotFound from "../app/not-found";
import { DocumentWorkspace } from "./document-workspace";
import { ChatPanel } from "./chat-panel";
import { LanguageSettings } from "./language-settings";
import { KnowledgePanel } from "./knowledge-panel";
import { AppShell } from "./app-shell";
import { Spinner, ErrorState } from "./ui";
import { ApiError } from "../lib/api";
import ToolsPage from "../app/app/tools/page";
import { TranslationPanel } from "./translation-panel";

beforeEach(() => {
  fixture.locale = "en";
  fixture.data = {
    "/settings": {
      provider: "demo",
      base_url: "https://api.example.test/v1",
      chat_model: "test-model",
      embedding_model: "test-embedding",
      mode: "demo",
    },
  };
});

const visibleCopy = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

describe("server-rendered interface copy (not browser interaction)", () => {
  it("renders the new tools and translation setup in English without a live provider", () => {
    for (const component of [
      <ToolsPage key="tools" />,
      <TranslationPanel
        key="translation"
        id="doc"
        title="Paper"
        page={1}
        count={8}
        onPage={() => {}}
      />,
    ]) {
      expect(visibleCopy(renderToStaticMarkup(component))).not.toMatch(
        /[\u3400-\u9fff]/,
      );
    }
    const html = renderToStaticMarkup(
      <TranslationPanel
        id="doc"
        title="Paper"
        page={1}
        count={8}
        onPage={() => {}}
      />,
    );
    expect(html).toContain("Demo mode never simulates translations");
    expect(html).toContain("disabled");
  });
  it("renders Chinese tool labels by default without translating file contents", () => {
    fixture.locale = "zh-CN";
    const html = renderToStaticMarkup(<ToolsPage />);
    expect(html).toContain("图片转 PDF");
    expect(html).toContain("开始转换");
    expect(html).toContain("不需要 AI 密钥");
  });
  it("renders the original English landing and illustrative preview", () => {
    const html = renderToStaticMarkup(<Landing />);
    expect(html).toContain("structured knowledge.");
    expect(visibleCopy(html)).not.toMatch(/[\u3400-\u9fff]/);
  });
  it("renders both language choices in Settings and keeps environment code on separate lines", () => {
    const html = renderToStaticMarkup(<SettingsPage />);
    expect(html).toContain("Interface language");
    expect(html).toContain("English");
    expect(html).toContain("简体中文");
    expect(html).toContain(
      "\nCHAT_MODEL=test-model\nEMBEDDING_MODEL=test-embedding\n# ",
    );
    expect(visibleCopy(html).replace("简体中文", "")).not.toMatch(
      /[\u3400-\u9fff]/,
    );
  });
  it("renders Chinese by explicit default and checks only the selected radio", () => {
    fixture.locale = "zh-CN";
    const html = renderToStaticMarkup(<LanguageSettings />);
    expect(html).toContain("界面语言");
    expect(html).toMatch(/checked=""[^>]*value="zh-CN"/);
    expect((html.match(/checked=""/g) ?? []).length).toBe(1);
  });
  it("renders legal, open-source and not-found copy in English", () => {
    for (const component of [
      <PrivacyPage key="privacy" />,
      <OpenSourcePage key="source" />,
      <NotFound key="404" />,
    ]) {
      expect(visibleCopy(renderToStaticMarkup(component))).not.toMatch(
        /[\u3400-\u9fff]/,
      );
    }
  });
  it("renders the navigation and default spinner in English", () => {
    const html = renderToStaticMarkup(
      <AppShell>
        <Spinner />
      </AppShell>,
    );
    expect(html).toContain("Main navigation");
    expect(html).toContain("My library");
    expect(html).toContain("Loading");
    expect(visibleCopy(html)).not.toMatch(/[\u3400-\u9fff]/);
  });
  it("renders English configuration guidance without replacing a Chinese document title", () => {
    fixture.data["/documents/document"] = {
      id: "document",
      title: "我的原始资料",
      page_count: 8,
      knowledge_count: 0,
      status: "ready",
      ai_status: "not_configured",
    };
    const html = renderToStaticMarkup(<DocumentWorkspace id="document" />);
    expect(html).toContain("我的原始资料");
    expect(html).toContain("API connections");
    expect(html).toContain(
      "Add a model connection or select an available model",
    );
    expect(html).toContain("Fullscreen reader");
    expect(html).toContain("8 pages");
    expect(visibleCopy(html).replace("我的原始资料", "")).not.toMatch(
      /[\u3400-\u9fff]/,
    );
  });
  it("keeps stored conversation text and source quotes unchanged", () => {
    fixture.data["/documents/document/chat"] = [
      {
        id: "message",
        role: "assistant",
        content: "这段历史回答不应被改写。",
        mode: "demo",
        citations: [
          {
            id: "citation",
            page_number: 4,
            quote: "The original source remains exactly the same.",
          },
        ],
      },
    ];
    const html = renderToStaticMarkup(
      <ChatPanel id="document" onPage={() => {}} isDemo />,
    );
    expect(html).toContain("这段历史回答不应被改写。");
    expect(html).toContain("The original source remains exactly the same.");
    expect(html).toContain("Page 4");
    expect(html).not.toContain("Page 4pages");
    expect(html).toContain('aria-label="Send question"');
  });
  it("translates importance and difficulty labels without changing knowledge content", () => {
    fixture.data["/documents/document/knowledge"] = [
      {
        id: "point",
        chapter: "Original chapter",
        title: "Original title",
        keywords: [],
        explanation: "Original explanation.",
        source_excerpt: "Original quote.",
        page_number: 3,
        importance: "high",
        difficulty: "low",
      },
    ];
    const html = renderToStaticMarkup(
      <KnowledgePanel id="document" onPage={() => {}} />,
    );
    expect(html).toContain("Core concept");
    expect(html).toContain("Foundational");
    expect(html).toContain("Original explanation.");
    expect(visibleCopy(html)).not.toMatch(/[\u3400-\u9fff]/);
  });
  it("renders the same structured error in the active language", () => {
    const failure = new ApiError("Configure AI", "provider_required", 409);
    expect(
      visibleCopy(renderToStaticMarkup(<ErrorState error={failure} />)),
    ).not.toMatch(/[\u3400-\u9fff]/);
  });
});
