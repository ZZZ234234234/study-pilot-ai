// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { translateText } from "../lib/i18n";
vi.mock("./locale-provider", () => ({
  useLocale: () => ({ t: (key: string) => translateText(key, "zh-CN") }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/app/documents/test",
}));
vi.mock("swr", () => ({ default: () => ({ data: { mode: "demo" } }) }));
import { AppShell } from "./app-shell";
const nav = () => document.getElementById("workspace-navigation")!;
beforeEach(() => {
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  Object.defineProperty(window, "innerWidth", {
    value: 1440,
    configurable: true,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("defaults to a collapsed navigation with an accessible reopen control", () => {
  render(
    <AppShell>
      <h1>Document</h1>
    </AppShell>,
  );
  expect(nav().hasAttribute("inert")).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "展开导航" }));
  expect(nav().hasAttribute("inert")).toBe(false);
  expect(
    screen.getByRole("link", { name: "API 接入" }).getAttribute("href"),
  ).toBe("/app/models");
  expect(screen.getByText("嘉兴大学 · 通信专业")).toBeTruthy();
  expect(screen.getByText("爱吃孜然芥末 制作完成")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "真伪核验与维权说明" })
      .getAttribute("href"),
  ).toBe("/app/authenticity");
  expect(
    screen
      .getByRole("link", { name: /2014546082@qq.com/ })
      .getAttribute("href"),
  ).toBe("mailto:2014546082@qq.com");
  expect(
    screen
      .getByRole("button", { name: "收起导航", expanded: true })
      .classList.contains("navigation-toggle"),
  ).toBe(true);
  expect(localStorage.getItem("studypilot:navigation")).toBe("open");
  fireEvent.click(screen.getAllByRole("button", { name: "收起导航" })[0]);
  expect(nav().hasAttribute("inert")).toBe(true);
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "展开导航" }),
  );
});
it("restores the saved desktop preference on remount", () => {
  localStorage.setItem("studypilot:navigation", "open");
  const first = render(<AppShell>Content</AppShell>);
  expect(nav().hasAttribute("inert")).toBe(false);
  first.unmount();
  render(<AppShell>Content</AppShell>);
  expect(nav().hasAttribute("inert")).toBe(false);
});
it("does not force an open desktop navigation onto a phone", () => {
  localStorage.setItem("studypilot:navigation", "open");
  Object.defineProperty(window, "innerWidth", {
    value: 390,
    configurable: true,
  });
  render(<AppShell>Content</AppShell>);
  expect(nav().hasAttribute("inert")).toBe(true);
  const trigger = screen.getByRole("button", { name: "打开菜单" });
  trigger.focus();
  fireEvent.click(trigger);
  expect(nav().hasAttribute("inert")).toBe(false);
  expect(document.body.style.overflow).toBe("hidden");
  fireEvent.keyDown(nav(), { key: "Escape" });
  expect(nav().hasAttribute("inert")).toBe(true);
  expect(document.body.style.overflow).toBe("");
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  const backdrop = document.querySelector<HTMLButtonElement>(".nav-scrim")!;
  expect(backdrop.hasAttribute("inert")).toBe(false);
  expect(backdrop.tabIndex).toBe(-1);
  fireEvent.click(backdrop);
  expect(nav().hasAttribute("inert")).toBe(true);
});
it("follows cross-tab changes and resets safely when preferences are cleared", () => {
  render(<AppShell>Content</AppShell>);
  act(() => {
    localStorage.setItem("studypilot:navigation", "open");
    window.dispatchEvent(
      new StorageEvent("storage", { key: "studypilot:navigation" }),
    );
  });
  expect(nav().hasAttribute("inert")).toBe(false);
  act(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
  expect(nav().hasAttribute("inert")).toBe(true);
});
it("still opens and closes for this visit when local storage is blocked", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  render(<AppShell>Content</AppShell>);
  fireEvent.click(screen.getByRole("button", { name: "展开导航" }));
  expect(nav().hasAttribute("inert")).toBe(false);
  fireEvent.click(screen.getAllByRole("button", { name: "收起导航" })[0]);
  expect(nav().hasAttribute("inert")).toBe(true);
});
