// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { translateText } from "../lib/i18n";
import type { AIProfiles } from "../lib/types";
const fixture = vi.hoisted(() => ({
  data: {} as Record<string, unknown>,
  request: vi.fn(),
  mutate: vi.fn(),
}));
vi.mock("./locale-provider", () => ({
  useLocale: () => ({
    t: (key: string, ...values: (string | number)[]) =>
      translateText(key, "zh-CN", ...values),
  }),
}));
vi.mock("swr", () => ({
  default: (key: string) => ({
    data: fixture.data[key],
    mutate: fixture.mutate,
  }),
  useSWRConfig: () => ({ mutate: fixture.mutate }),
}));
vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  post: (...args: unknown[]) => fixture.request(...args),
  patch: (...args: unknown[]) => fixture.request(...args),
}));
import { ModelManager } from "./model-manager";
import { ChatPanel } from "./chat-panel";
const connections: AIProfiles = {
  profiles: [
    {
      id: "one",
      name: "论文助手",
      provider: "deepseek",
      base_url: "https://api.deepseek.com/v1",
      model: "deepseek-v4-flash",
      has_api_key: true,
      revision: 1,
    },
    {
      id: "two",
      name: "智谱阅读",
      provider: "zhipu",
      base_url: "https://open.bigmodel.cn/api/paas/v4",
      model: "glm-5.3",
      has_api_key: true,
      revision: 1,
    },
  ],
  default_id: "one",
  providers: [
    {
      id: "deepseek",
      name: "DeepSeek",
      group: "china",
      monogram: "D",
      base_url: "https://api.deepseek.com/v1",
      endpoints: [{ label: "中国大陆", url: "https://api.deepseek.com/v1" }],
      models: ["deepseek-v4-flash"],
      model_source: "reference",
      model_list: true,
      key_required: true,
      docs_url: "https://api-docs.deepseek.com/",
      key_url: "https://platform.deepseek.com/api_keys",
      checked_on: "2026-09-02",
    },
    {
      id: "zhipu",
      name: "智谱 AI",
      group: "china",
      monogram: "GLM",
      base_url: "https://open.bigmodel.cn/api/paas/v4",
      endpoints: [
        {
          label: "中国大陆",
          url: "https://open.bigmodel.cn/api/paas/v4",
        },
      ],
      models: ["glm-5.3"],
      model_source: "reference",
      model_list: false,
      key_required: true,
      docs_url: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction",
      key_url: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
      checked_on: "2026-09-02",
    },
    {
      id: "openai",
      name: "OpenAI",
      group: "international",
      monogram: "OAI",
      base_url: "https://api.openai.com/v1",
      endpoints: [{ label: "全球", url: "https://api.openai.com/v1" }],
      models: ["gpt-5.6"],
      model_source: "reference",
      model_list: true,
      key_required: true,
      docs_url: "https://developers.openai.com/api/docs/models",
      key_url: "https://platform.openai.com/api-keys",
      checked_on: "2026-09-04",
    },
    {
      id: "ollama",
      name: "Ollama",
      group: "local",
      monogram: "OL",
      base_url: "http://127.0.0.1:11434/v1",
      endpoints: [
        { label: "本机", url: "http://127.0.0.1:11434/v1" },
        {
          label: "本机 localhost",
          url: "http://localhost:11434/v1",
        },
      ],
      models: ["qwen3:8b"],
      model_source: "reference",
      model_list: true,
      key_required: false,
      docs_url: "https://docs.ollama.com/api/openai-compatibility",
      key_url: "",
      checked_on: "2026-09-04",
    },
  ],
};
beforeEach(() => {
  fixture.data = {
    "/ai/profiles": connections,
    "/documents/doc/chat": [
      {
        id: "old",
        role: "assistant",
        content: "原有回答",
        mode: "live",
        model_label: "旧备注 · old-model",
        citations: [],
      },
    ],
  };
  fixture.request.mockReset().mockResolvedValue({});
  fixture.mutate.mockReset().mockResolvedValue(undefined);
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

it("edits without exposing an existing key and sends blank to preserve it", async () => {
  render(<ModelManager />);
  fireEvent.click(screen.getByRole("button", { name: "编辑 论文助手" }));
  expect((screen.getByLabelText("API Key") as HTMLInputElement).value).toBe("");
  fireEvent.change(screen.getByLabelText("连接备注名"), {
    target: { value: "新备注" },
  });
  fireEvent.submit(
    screen.getByRole("button", { name: "保存连接" }).closest("form")!,
  );
  await waitFor(() =>
    expect(fixture.request).toHaveBeenCalledWith(
      "/ai/profiles/one",
      expect.objectContaining({ name: "新备注", api_key: "" }),
    ),
  );
  await waitFor(() => expect(screen.queryByLabelText("API Key")).toBeNull());
  expect(localStorage.length).toBe(0);
});

it("requires explicit test consent and tests the unsaved selected exact model", async () => {
  render(<ModelManager />);
  fireEvent.click(screen.getByRole("button", { name: "编辑 论文助手" }));
  const testButton = screen.getByRole("button", { name: "检测连接与能力" });
  expect((testButton as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("准确模型 ID"), {
    target: { value: "deepseek-v4-pro" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fixture.request.mockResolvedValueOnce({
    ok: true,
    model: "deepseek-v4-pro",
    capabilities: {
      connection: true,
      structured_output: true,
      context_memory: true,
      in_context_learning: false,
    },
  });
  fireEvent.click(testButton);
  await waitFor(() =>
    expect(fixture.request).toHaveBeenCalledWith(
      "/ai/profiles/test",
      expect.objectContaining({ profile_id: "one", model: "deepseek-v4-pro" }),
    ),
  );
  expect(await screen.findByRole("status")).toHaveProperty(
    "textContent",
    expect.stringContaining("deepseek-v4-pro"),
  );
  const report = screen.getByLabelText("模型能力检测结果").textContent;
  expect(report).toContain("请求内上下文记忆通过");
  expect(report).toContain("临时示例学习（上下文内）未通过");
  expect(report).not.toContain("跨会话长期记忆");
});

it("clears a draft key and model when changing providers and never guesses a model", () => {
  render(<ModelManager />);
  fireEvent.click(screen.getByRole("button", { name: "添加模型" }));
  fireEvent.change(screen.getByLabelText("API Key"), {
    target: { value: "not-a-real-key" },
  });
  fireEvent.change(screen.getByLabelText("服务商"), {
    target: { value: "zhipu" },
  });
  expect((screen.getByLabelText("API Key") as HTMLInputElement).value).toBe("");
  expect((screen.getByLabelText("准确模型 ID") as HTMLInputElement).value).toBe(
    "",
  );
  fireEvent.click(screen.getByRole("button", { name: "glm-5.3" }));
  expect((screen.getByLabelText("准确模型 ID") as HTMLInputElement).value).toBe(
    "glm-5.3",
  );
  expect(fixture.request).not.toHaveBeenCalled();
});

it("groups mainstream providers and lets a local runtime save without a fake key", async () => {
  render(<ModelManager />);
  fireEvent.click(screen.getByRole("button", { name: "添加模型" }));
  const provider = screen.getByLabelText("服务商") as HTMLSelectElement;
  expect(screen.getByRole("option", { name: "OpenAI" })).toBeTruthy();
  expect(screen.getByRole("option", { name: "Ollama" })).toBeTruthy();
  fireEvent.change(provider, { target: { value: "ollama" } });
  const key = screen.getByLabelText("API Key") as HTMLInputElement;
  expect(key.required).toBe(false);
  expect(key.placeholder).toBe("本地服务通常无需 API Key");
  fireEvent.change(screen.getByLabelText("连接备注名"), {
    target: { value: "本机千问" },
  });
  fireEvent.click(screen.getByRole("button", { name: "qwen3:8b" }));
  fireEvent.submit(
    screen.getByRole("button", { name: "保存连接" }).closest("form")!,
  );
  await waitFor(() =>
    expect(fixture.request).toHaveBeenCalledWith(
      "/ai/profiles",
      expect.objectContaining({
        provider: "ollama",
        base_url: "http://127.0.0.1:11434/v1",
        model: "qwen3:8b",
        api_key: "",
      }),
    ),
  );
});

it("gates remote Q&A on consent and sends only the selected profile ID", async () => {
  render(
    <ChatPanel
      id="doc"
      onPage={() => {}}
      isDemo={false}
      connections={connections}
      modelId="two"
    />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "什么是卷积？" },
  });
  const send = screen.getByRole("button", { name: "发送问题" });
  expect((send as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(send);
  await waitFor(() =>
    expect(fixture.request).toHaveBeenCalledWith("/documents/doc/chat", {
      question: "什么是卷积？",
      profile_id: "two",
      profile_revision: 1,
    }),
  );
  expect(screen.getByText("旧备注 · old-model")).toBeTruthy();
  expect(screen.getByText("原有回答")).toBeTruthy();
});

it("keeps the draft and history but resets consent on model change or profile revision", () => {
  const renderChat = (modelId: string, data = connections) => (
    <ChatPanel
      id="doc"
      onPage={() => {}}
      isDemo={false}
      connections={data}
      modelId={modelId}
    />
  );
  const view = render(renderChat("one"));
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "保留这个问题" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  view.rerender(renderChat("two"));
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
  expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
    "保留这个问题",
  );
  fireEvent.click(screen.getByRole("checkbox"));
  view.rerender(
    renderChat("two", {
      ...connections,
      profiles: connections.profiles.map((p) => ({ ...p, revision: 2 })),
    }),
  );
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(
    false,
  );
  expect(screen.getByText("原有回答")).toBeTruthy();
});

it("a deleted selected connection blocks sending instead of silently changing provider", () => {
  render(
    <ChatPanel
      id="doc"
      onPage={() => {}}
      isDemo={false}
      connections={connections}
      modelId="deleted"
    />,
  );
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "问题问题" },
  });
  expect(
    (screen.getByRole("button", { name: "发送问题" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(screen.getByText("模型已移除，请重新选择")).toBeTruthy();
  expect(fixture.request).not.toHaveBeenCalled();
});
