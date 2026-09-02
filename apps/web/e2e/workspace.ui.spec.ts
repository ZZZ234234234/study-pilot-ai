import { test, expect } from "@playwright/test";
import { createDemo, expectCanvas, showPanel } from "./helpers";

test("sample onboarding, PDF rendering, paging and accessible text", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "体验内置样例" }).click();
  await expect(page).toHaveURL(/\/app\/documents\/[a-z0-9-]+/);
  await expect(page.locator(".document-meta")).toContainText("16 个知识点", {
    timeout: 30_000,
  });
  await showPanel(page, "PDF");
  await expectCanvas(page);
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(page.getByLabel("PDF 页码", { exact: true })).toHaveValue("2");
  await expectCanvas(page);
  await page.getByRole("button", { name: "放大", exact: true }).click();
  await expect(page.locator(".zoom-label")).toHaveText("110%");
  await expectCanvas(page);
  await page.screenshot({
    path: testInfo.outputPath("pdf-reader.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "切换文字阅读视图" }).click();
  await expect(page.locator(".pdf-text-view p")).not.toHaveText(
    "正在加载原文…",
  );
  await expect(page.locator(".pdf-text-view p")).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test("knowledge, source-linked Q&A, flashcards and quiz", async ({
  page,
  baseURL,
}, testInfo) => {
  const document = await createDemo(page.request, baseURL!);
  await page.goto(`/app/documents/${document.id}`);
  await showPanel(page, "学习助手");
  await page.getByRole("button", { name: "知识地图", exact: true }).click();
  await expect(page.locator(".knowledge-point")).toHaveCount(16);
  await page.getByLabel("搜索知识点").fill("convolution");
  await expect(page.locator(".knowledge-point").first()).toBeVisible();
  await page.locator(".source-link").first().click();
  await expect(page.getByLabel("PDF 页码", { exact: true })).toHaveValue("4");
  await expectCanvas(page);
  await showPanel(page, "学习助手");
  await page.getByRole("button", { name: "文档问答", exact: true }).click();
  await page.getByLabel("输入关于这份文档的问题").fill("卷积为什么有用？");
  await page.getByRole("button", { name: "发送问题" }).click();
  await expect(page.locator(".citation").first()).toContainText("第 4 页");
  await page.getByRole("button", { name: "知识闪卡", exact: true }).click();
  await page.getByRole("button", { name: "生成知识闪卡", exact: true }).click();
  await expect(page.locator(".card-progress")).toContainText("16 张今日待复习");
  await page.getByRole("button", { name: "翻开卡片查看答案" }).click();
  await page.getByRole("button", { name: /记住了.*基本记住了/ }).click();
  await expect(page.locator(".card-progress")).toContainText("15 张今日待复习");
  await page.getByRole("button", { name: "理解测验", exact: true }).click();
  await page.getByRole("button", { name: "生成测验", exact: true }).click();
  await expect(page.locator(".quiz-question")).toHaveCount(5);
  for (const question of await page.locator(".quiz-question").all()) {
    const input = question.locator("textarea");
    if (await input.count())
      await input.fill(
        "Convolution learns local patterns with shared weights.",
      );
    else await question.getByRole("radio").first().check();
  }
  await page.getByRole("button", { name: "提交并查看反馈" }).click();
  await expect(page.locator(".quiz-results article")).toHaveCount(5);
  await page.screenshot({
    path: testInfo.outputPath("quiz-results.png"),
    fullPage: true,
  });
});

test("responsive routes fit the viewport and the mobile navigation closes", async ({
  page,
}, testInfo) => {
  const sizes =
    testInfo.project.name === "mobile"
      ? [
          { width: 390, height: 844 },
          { width: 360, height: 800 },
        ]
      : [
          { width: 1920, height: 1080 },
          { width: 1440, height: 900 },
          { width: 1366, height: 768 },
          { width: 768, height: 1024 },
        ];
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const route of [
      "/",
      "/app",
      "/app/library",
      "/app/study-plan",
      "/app/settings",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
          ),
        )
        .toBe(true);
    }
    const open = page.getByRole("button", { name: "打开菜单" });
    if (await open.isVisible()) {
      await open.click();
      await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
      await page
        .getByRole("navigation", { name: "主要导航" })
        .getByRole("link", { name: "我的资料" })
        .click();
      await expect(page).toHaveURL(/\/app\/library/);
      await expect(page.locator(".sidebar")).not.toHaveClass(/is-open/);
    }
    await page.screenshot({
      path: testInfo.outputPath(`layout-${size.width}.png`),
      fullPage: true,
    });
  }
});
