// @vitest-environment jsdom
// Component state/DOM tests with a stubbed model API, not real browser or model-quality tests.
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { translateText } from "../lib/i18n";
import type { AIProfiles } from "../lib/types";

const fixture = vi.hoisted(() => ({
  api: vi.fn(),
  download: vi.fn(),
  provider: "openai",
}));
vi.mock("./locale-provider", () => ({
  useLocale: () => ({
    locale: "zh-CN",
    t: (key: string, ...values: Array<string | number>) =>
      translateText(key, "zh-CN", ...values),
  }),
}));
vi.mock("swr", () => ({
  default: () => ({
    data: {
      provider: fixture.provider,
      has_api_key: true,
      chat_model: "test-model",
    },
  }),
}));
vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  api: fixture.api,
}));
vi.mock("../lib/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/download")>()),
  downloadBlob: fixture.download,
}));
import { TranslationPanel } from "./translation-panel";

function result(page = 1) {
  return {
    document_id: "doc",
    page,
    target: "zh-CN",
    style: "academic",
    model: "test-model",
    segments: [
      {
        id: `p${page}-s1`,
        source: "Original x = 5 mg.",
        translation: "译文 x = 5 mg。",
      },
    ],
  };
}
function show() {
  return render(
    <TranslationPanel
      id="doc"
      title="Paper"
      page={1}
      count={3}
      onPage={() => {}}
    />,
  );
}
function consent() {
  fireEvent.click(screen.getByRole("checkbox"));
}
const start = () =>
  fireEvent.click(screen.getByRole("button", { name: "翻译选中页" }));
beforeEach(() => {
  fixture.api.mockReset();
  fixture.download.mockReset();
  fixture.provider = "openai";
});
afterEach(cleanup);

it("partitions translations by chosen model and does not send without renewed consent", async () => {
  fixture.provider = "demo";
  const connections: AIProfiles = {
    profiles: ["one", "two"].map((id) => ({
      id,
      name: id,
      provider: "deepseek",
      base_url: "https://api.deepseek.com/v1",
      model: id,
      has_api_key: true,
      revision: 1,
    })),
    default_id: "one",
    providers: [],
  };
  const view = (modelId: string) => (
    <TranslationPanel
      id="doc"
      title="Paper"
      page={1}
      count={3}
      onPage={() => {}}
      connections={connections}
      modelId={modelId}
    />
  );
  fixture.api.mockResolvedValue(result());
  const mounted = render(view("one"));
  consent();
  start();
  await screen.findByText("译文 x = 5 mg。");
  expect(JSON.parse(fixture.api.mock.calls[0][1].body).profile_id).toBe("one");
  mounted.rerender(view("two"));
  expect(screen.queryByText("译文 x = 5 mg。")).toBeNull();
  expect(
    (screen.getByRole("button", { name: "翻译选中页" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(fixture.api).toHaveBeenCalledTimes(1);
  consent();
  start();
  await screen.findByText("译文 x = 5 mg。");
  expect(JSON.parse(fixture.api.mock.calls[1][1].body).profile_id).toBe("two");
  mounted.rerender(view("one"));
  expect(screen.getByText("译文 x = 5 mg。")).toBeTruthy();
  expect(fixture.api).toHaveBeenCalledTimes(2);
});

it("does not send any source until the user confirms and starts translation", async () => {
  fixture.api.mockResolvedValue(result());
  show();
  expect(
    (screen.getByRole("button", { name: "翻译选中页" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(fixture.api).not.toHaveBeenCalled();
  consent();
  start();
  await screen.findByText("译文 x = 5 mg。");
  expect(fixture.api).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fixture.api.mock.calls[0][1].body)).toMatchObject({
    page: 1,
    target: "zh-CN",
  });
  fireEvent.click(screen.getByRole("button", { name: "导出对照文本" }));
  expect(fixture.download).toHaveBeenCalledTimes(1);
});

it("reuses completed pages but starts a new request after a terminology change", async () => {
  fixture.api.mockResolvedValue(result());
  show();
  consent();
  start();
  await screen.findByText("译文 x = 5 mg。");
  start();
  await waitFor(() => expect(fixture.api).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText("术语偏好（可选）"), {
    target: { value: "BP = 反向传播" },
  });
  start();
  await waitFor(() => expect(fixture.api).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fixture.api.mock.calls[1][1].body).glossary).toBe(
    "BP = 反向传播",
  );
});

it("stops future requests after the current page without discarding its result", async () => {
  let resolve: (value: ReturnType<typeof result>) => void = () => {};
  fixture.api.mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  show();
  consent();
  fireEvent.change(screen.getByLabelText("翻译范围"), {
    target: { value: "range" },
  });
  start();
  await waitFor(() => expect(fixture.api).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("button", { name: "停止后续页" }));
  await act(async () => resolve(result()));
  await screen.findByText("译文 x = 5 mg。");
  expect(fixture.api).toHaveBeenCalledTimes(1);
  expect(screen.getByText("已完成 1 / 3 页")).toBeTruthy();
});

it("keeps completed pages downloadable after a later page fails", async () => {
  fixture.api
    .mockResolvedValueOnce(result())
    .mockRejectedValueOnce(
      new Error("模型响应超时，请稍后重试，或选择较小的文档与响应更快的模型。"),
    );
  show();
  consent();
  fireEvent.change(screen.getByLabelText("翻译范围"), {
    target: { value: "range" },
  });
  start();
  await screen.findByRole("alert");
  expect(screen.getByText("译文 x = 5 mg。")).toBeTruthy();
  expect(
    (screen.getByRole("button", { name: "导出对照文本" }) as HTMLButtonElement)
      .disabled,
  ).toBe(false);
});

it("keeps demo translation disabled even after consent", () => {
  fixture.provider = "demo";
  show();
  consent();
  expect(
    (screen.getByRole("button", { name: "翻译选中页" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(fixture.api).not.toHaveBeenCalled();
});
