import { test, expect } from "@playwright/test";
import {
  createDemo,
  expectCanvas,
  mutationHeaders,
  showPanel,
} from "./helpers";

test("reading-first controls, fullscreen, floating resize and preserved question draft", async ({
  page,
  baseURL,
}, testInfo) => {
  const doc = await createDemo(page.request, baseURL!);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`/app/documents/${doc.id}`);
    await expectCanvas(page);
    await showPanel(page, "学习助手");
    const question = page.getByLabel("输入关于这份文档的问题");
    await question.fill("尚未发送的问题");
    await page.getByRole("button", { name: "隐藏助手", exact: true }).click();
    await page
      .getByRole("button", { name: "打开学习助手", exact: true })
      .click();
    await expect(question).toHaveValue("尚未发送的问题");
    const floatButton = page.getByRole("button", {
      name: "设为悬浮窗",
      exact: true,
    });
    if (await floatButton.isVisible()) await floatButton.click();
    const window = page.locator(".assistant-floating");
    const before = (await window.boundingBox())!;
    const grip = page.getByRole("button", {
      name: "移动助手窗口",
      exact: true,
    });
    await grip.focus();
    await page.keyboard.press("ArrowUp");
    const after = (await window.boundingBox())!;
    expect(after.y).toBeLessThanOrEqual(before.y);
    if (testInfo.project.name !== "mobile") {
      const bounds = (await grip.boundingBox())!;
      await page.mouse.move(bounds.x + 20, bounds.y + 20);
      await page.mouse.down();
      await page.mouse.move(bounds.x - 100, bounds.y - 60, { steps: 8 });
      await page.mouse.up();
      expect((await window.boundingBox())!.x).toBeLessThan(before.x);
    }
    const resize = page.getByRole("button", { name: "调整助手窗口大小" });
    await resize.focus();
    const heightBefore = (await window.boundingBox())!.height;
    await page.keyboard.press("ArrowUp");
    expect((await window.boundingBox())!.height).toBeLessThan(heightBefore);
    await page
      .getByRole("button", { name: "隐藏学习助手", exact: true })
      .click();
    await page.locator(".pdf-page-surface canvas").click();
    const fullscreen = page.getByRole("dialog", {
      name: "全屏阅读",
      exact: true,
    });
    await expect(fullscreen).toBeVisible();
    await expectCanvas(page);
    await page
      .getByRole("button", { name: "打开学习助手", exact: true })
      .click();
    await expect(question).toHaveValue("尚未发送的问题");
    await page.screenshot({
      path: testInfo.outputPath("fullscreen-floating-reader.png"),
      fullPage: false,
    });
    await page.keyboard.press("Escape");
    await expect(fullscreen).toHaveCount(0);
    await expect(question).toHaveValue("尚未发送的问题");
    expect(errors).toEqual([]);
  } finally {
    await page.request.delete(`/api/v1/documents/${doc.id}`, {
      headers: mutationHeaders(baseURL!),
    });
  }
});

test("collapsed navigation can be opened and closed without trapping keyboard focus", async ({
  page,
}, testInfo) => {
  await page.goto("/app/library");
  const nav = page.locator(".sidebar");
  await expect(nav).not.toBeVisible();
  const trigger = page.locator(".navigation-toggle");
  await trigger.click();
  await expect(nav).toBeVisible();
  const close = nav.getByRole("button", {
    name: testInfo.project.name === "mobile" ? "关闭菜单" : "收起导航",
    exact: true,
  });
  await close.click();
  await expect(nav).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.reload();
  await expect(nav).not.toBeVisible();
});
