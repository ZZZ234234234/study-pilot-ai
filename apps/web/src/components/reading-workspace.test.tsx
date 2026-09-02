// @vitest-environment jsdom
// Simulated DOM/pointer state tests; real browser drag/fullscreen acceptance is separate.
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import { translateText } from "../lib/i18n";
const fixture = vi.hoisted(() => ({ locale: "zh-CN" as "zh-CN" | "en" }));
vi.mock("./locale-provider", () => ({
  useLocale: () => ({
    locale: fixture.locale,
    t: (key: string, ...args: Array<string | number>) =>
      translateText(key, fixture.locale, ...args),
  }),
}));
vi.mock("./pdf-reader", () => ({
  PdfReader: ({ onExpand, page }: { onExpand: () => void; page: number }) => (
    <div className="pdf-reader">
      <button className="pdf-canvas-area" onClick={onExpand}>
        Source page {page}
      </button>
    </div>
  ),
}));
import { ReadingWorkspace } from "./reading-workspace";

class Pointer extends MouseEvent {
  pointerId: number;
  isPrimary: boolean;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.isPrimary = init.isPrimary ?? true;
  }
}
function Content() {
  const [draft, setDraft] = useState("");
  return (
    <div className="assistant-panel">
      <textarea
        aria-label="Draft"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <p>Saved translation</p>
    </div>
  );
}
function show(sourceRequest = 0) {
  return (
    <ReadingWorkspace
      id="doc"
      page={2}
      count={8}
      onPage={() => {}}
      sourceRequest={sourceRequest}
    >
      <Content />
    </ReadingWorkspace>
  );
}
const button = (name: string) => screen.getByRole("button", { name });
const panel = () => document.getElementById("document-assistant")!;

beforeEach(() => {
  fixture.locale = "zh-CN";
  localStorage.clear();
  Object.defineProperty(window, "innerWidth", {
    value: 1440,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: 900,
    configurable: true,
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("PointerEvent", Pointer);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.hasPointerCapture = () => true;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("starts with a wider document and hides/restores the same mounted draft", () => {
  render(show());
  expect(
    document.querySelector(".split-workspace")?.getAttribute("style"),
  ).toContain("70%");
  const input = screen.getByLabelText("Draft");
  fireEvent.change(input, { target: { value: "My unsent question" } });
  fireEvent.click(button("隐藏助手"));
  expect(panel().hidden).toBe(true);
  expect(document.querySelector(".reader-expanded")).toBeTruthy();
  fireEvent.click(button("打开学习助手"));
  expect(screen.getByLabelText("Draft")).toBe(input);
  expect((input as HTMLTextAreaElement).value).toBe("My unsent question");
});
it("floats, minimizes, restores and docks without remounting content", () => {
  render(show());
  const input = screen.getByLabelText("Draft");
  fireEvent.click(button("设为悬浮窗"));
  expect(panel().classList.contains("assistant-floating")).toBe(true);
  fireEvent.click(button("隐藏学习助手"));
  fireEvent.click(button("打开学习助手"));
  expect(panel().classList.contains("assistant-floating")).toBe(true);
  fireEvent.click(button("停靠右侧"));
  expect(panel().classList.contains("assistant-floating")).toBe(false);
  expect(screen.getByLabelText("Draft")).toBe(input);
});
it("drags only by the title bar and resizes from the corner", () => {
  render(show());
  fireEvent.click(button("设为悬浮窗"));
  const grip = button("移动助手窗口");
  fireEvent.pointerDown(grip, {
    pointerId: 1,
    clientX: 1000,
    clientY: 330,
    button: 0,
  });
  fireEvent.pointerMove(grip, { pointerId: 1, clientX: 700, clientY: 130 });
  fireEvent.pointerUp(grip, { pointerId: 1 });
  expect(panel().style.left).toBe("696px");
  expect(panel().style.top).toBe("116px");
  const handle = button("调整助手窗口大小");
  fireEvent.pointerDown(handle, { clientX: 1100, clientY: 600 });
  fireEvent.pointerMove(handle, { clientX: 1200, clientY: 650 });
  fireEvent.pointerUp(handle);
  expect(panel().style.width).toBe("520px");
  expect(panel().style.height).toBe("610px");
});
it("supports keyboard moves, resize and reset", () => {
  render(show());
  fireEvent.click(button("设为悬浮窗"));
  fireEvent.keyDown(button("移动助手窗口"), { key: "ArrowLeft" });
  expect(panel().style.left).toBe("980px");
  fireEvent.keyDown(button("调整助手窗口大小"), {
    key: "ArrowUp",
    shiftKey: true,
  });
  expect(panel().style.height).toBe("496px");
  fireEvent.click(button("重置窗口位置"));
  expect(panel().style.left).toBe("996px");
  expect(panel().style.height).toBe("560px");
});
it("cancels a drag and ignores another pointer", () => {
  render(show());
  fireEvent.click(button("设为悬浮窗"));
  const grip = button("移动助手窗口");
  fireEvent.pointerDown(grip, { pointerId: 1, clientX: 900, clientY: 300 });
  fireEvent.pointerMove(grip, { pointerId: 2, clientX: 10, clientY: 10 });
  expect(panel().style.left).toBe("996px");
  fireEvent.pointerCancel(grip, { pointerId: 1 });
  fireEvent.pointerMove(grip, { pointerId: 1, clientX: 10, clientY: 10 });
  expect(panel().style.left).toBe("996px");
});
it("provides a horizontally draggable, keyboard-accessible divider", () => {
  render(show());
  const divider = screen.getByRole("separator");
  fireEvent.keyDown(divider, { key: "ArrowLeft" });
  expect(divider.getAttribute("aria-valuenow")).toBe("68");
  fireEvent.pointerDown(divider, { clientX: 800, clientY: 400 });
  fireEvent.pointerMove(divider, { clientX: 680, clientY: 400 });
  fireEvent.pointerUp(divider);
  expect(divider.getAttribute("aria-valuenow")).toBe("58");
});
it("enters fullscreen from the page, isolates background and exits with Escape", () => {
  render(
    <>
      <button>Outside</button>
      {show()}
    </>,
  );
  const source = button("Source page 2");
  source.focus();
  const input = screen.getByLabelText("Draft");
  fireEvent.click(source);
  const dialog = screen.getByRole("dialog", { name: "全屏阅读" });
  expect(document.querySelector(".reader-expanded")).toBeTruthy();
  expect(panel().classList.contains("assistant-floating")).toBe(true);
  expect(button("Outside").hasAttribute("inert")).toBe(true);
  expect(document.body.style.overflow).toBe("hidden");
  expect(document.activeElement).toBe(button("退出全屏"));
  expect(screen.getByLabelText("Draft")).toBe(input);
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(button("Outside").hasAttribute("inert")).toBe(false);
  expect(document.body.style.overflow).toBe("");
  expect(document.activeElement).toBe(source);
});
it("keeps keyboard focus within the fullscreen reading controls", () => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    {},
  ] as unknown as DOMRectList);
  render(show());
  fireEvent.click(button("全屏阅读"));
  const first = button("退出全屏");
  const last = button("调整助手窗口大小");
  first.focus();
  fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
  expect(document.activeElement).toBe(last);
  fireEvent.keyDown(last, { key: "Tab" });
  expect(document.activeElement).toBe(first);
});
it("returns focus and scroll locking when a fullscreen document unmounts", () => {
  const { unmount } = render(show());
  fireEvent.click(button("全屏阅读"));
  unmount();
  expect(document.body.style.overflow).toBe("");
  expect(document.querySelector("[inert]")).toBeNull();
});
it("clamps the floating window after viewport resize", () => {
  render(show());
  fireEvent.click(button("设为悬浮窗"));
  act(() => {
    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 500,
      configurable: true,
    });
    window.dispatchEvent(new Event("resize"));
  });
  expect(
    parseFloat(panel().style.left) + parseFloat(panel().style.width),
  ).toBeLessThanOrEqual(992);
  expect(
    parseFloat(panel().style.top) + parseFloat(panel().style.height),
  ).toBeLessThanOrEqual(492);
});
it("prioritizes the PDF on mobile and reveals cited sources without losing drafts", () => {
  Object.defineProperty(window, "innerWidth", {
    value: 390,
    configurable: true,
  });
  const view = render(show());
  expect(panel().hidden).toBe(true);
  fireEvent.click(button("打开学习助手"));
  const input = screen.getByLabelText("Draft");
  fireEvent.change(input, { target: { value: "Question" } });
  expect(panel().hidden).toBe(false);
  view.rerender(show(1));
  expect(panel().hidden).toBe(true);
  fireEvent.click(button("打开学习助手"));
  expect(screen.getByLabelText("Draft")).toBe(input);
  expect((input as HTMLTextAreaElement).value).toBe("Question");
});
it("restores only supported saved layout preferences", () => {
  localStorage.setItem("studypilot:assistant-layout", "floating");
  const view = render(show());
  expect(panel().classList.contains("assistant-floating")).toBe(true);
  view.unmount();
  localStorage.setItem("studypilot:assistant-layout", "invalid");
  render(show());
  expect(panel().classList.contains("assistant-floating")).toBe(false);
});
it("renders new controls in English without changing source content", () => {
  fixture.locale = "en";
  const view = render(show());
  expect(button("Fullscreen reader")).toBeTruthy();
  expect(view.container.textContent).not.toMatch(/[\u3400-\u9fff]/);
  expect(view.container.textContent).toContain("Saved translation");
});
