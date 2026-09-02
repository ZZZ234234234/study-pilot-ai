// @vitest-environment jsdom
// Reader controls with a stubbed PDF.js renderer, not bitmap or visual acceptance tests.
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { translateText } from "../lib/i18n";
const fixture = vi.hoisted(() => ({ render: vi.fn(), destroy: vi.fn() }));
vi.mock("./locale-provider", () => ({
  useLocale: () => ({
    t: (key: string, ...args: Array<string | number>) =>
      translateText(key, "zh-CN", ...args),
  }),
}));
vi.mock("swr", () => ({
  default: () => ({ data: [{ text: "Verbatim original source." }] }),
}));
vi.mock("../lib/api", async (original) => ({
  ...(await original<typeof import("../lib/api")>()),
  ensureSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("pdfjs-dist", () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    destroy: fixture.destroy,
    promise: Promise.resolve({
      getPage: async () => ({
        getViewport: ({ scale }: { scale: number }) => ({
          width: 600 * scale,
          height: 800 * scale,
        }),
        render: fixture.render,
      }),
    }),
  }),
}));
import { PdfReader } from "./pdf-reader";
const button = (name: string) => screen.getByRole("button", { name });
beforeEach(() => {
  fixture.render
    .mockReset()
    .mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() });
  fixture.destroy.mockReset();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    {} as CanvasRenderingContext2D,
  );
  HTMLElement.prototype.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("makes the actual page clickable and keyboard-accessible for fullscreen", async () => {
  const expand = vi.fn();
  render(
    <PdfReader
      id="doc"
      page={2}
      count={8}
      onPage={() => {}}
      onExpand={expand}
    />,
  );
  const page = await screen.findByRole("button", {
    name: "PDF 第 2 页，共 8 页；点击全屏阅读",
  });
  fireEvent.click(page);
  fireEvent.keyDown(page, { key: "Enter" });
  expect(expand).toHaveBeenCalledTimes(2);
});
it("supports 50–300% zoom and a one-click fit-to-width reset", async () => {
  render(<PdfReader id="doc" page={1} count={8} onPage={() => {}} />);
  await waitFor(() => expect(fixture.render).toHaveBeenCalled());
  for (let i = 0; i < 20; i++) fireEvent.click(button("放大"));
  expect(document.querySelector(".zoom-label")?.textContent).toBe("300%");
  expect((button("放大") as HTMLButtonElement).disabled).toBe(true);
  for (let i = 0; i < 25; i++) fireEvent.click(button("缩小"));
  expect(document.querySelector(".zoom-label")?.textContent).toBe("50%");
  expect((button("缩小") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button("适应宽度"));
  expect(document.querySelector(".zoom-label")?.textContent).toBe("100%");
});
it("uses the original page image in fullscreen and restores the prior text view", async () => {
  const props = { id: "doc", page: 1, count: 8, onPage: () => {} };
  const view = render(<PdfReader {...props} />);
  fireEvent.click(button("切换文字阅读视图"));
  expect(screen.getByText("Verbatim original source.")).toBeTruthy();
  view.rerender(<PdfReader {...props} fullscreen />);
  expect(
    await screen.findByRole("img", { name: "PDF 第 1 页，共 8 页" }),
  ).toBeTruthy();
  expect(screen.queryByText("Verbatim original source.")).toBeNull();
  view.rerender(<PdfReader {...props} />);
  expect(screen.getByText("Verbatim original source.")).toBeTruthy();
});
it("preserves navigation bounds and cleans up its PDF loading task", async () => {
  const changePage = vi.fn();
  const view = render(
    <PdfReader id="doc" page={1} count={8} onPage={changePage} />,
  );
  await waitFor(() => expect(fixture.render).toHaveBeenCalled());
  expect((button("上一页") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(button("下一页"));
  expect(changePage).toHaveBeenCalledWith(2);
  view.unmount();
  expect(fixture.destroy).toHaveBeenCalledTimes(1);
});
