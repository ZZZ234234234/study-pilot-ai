import { test, expect } from "@playwright/test";
import { createDemo, expectCanvas, showPanel } from "./helpers";

test("sample onboarding, PDF rendering, paging and accessible text", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Try the original sample" }).click();
  await expect(page).toHaveURL(/\/app\/documents\/[a-z0-9-]+/);
  await expect(page.locator(".document-meta")).toContainText(
    "16 knowledge points",
    { timeout: 30_000 },
  );
  await showPanel(page, "PDF");
  await expectCanvas(page);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByLabel("PDF page", { exact: true })).toHaveValue("2");
  await expectCanvas(page);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator(".zoom-label")).toHaveText("110%");
  await expectCanvas(page);
  await page.screenshot({
    path: testInfo.outputPath("pdf-reader.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Toggle accessible text view" })
    .click();
  await expect(page.locator(".pdf-text-view p")).not.toHaveText(
    "Loading text…",
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
  await showPanel(page, "Learning assistant");
  await page.getByRole("button", { name: "Knowledge", exact: true }).click();
  await expect(page.locator(".knowledge-point")).toHaveCount(16);
  await page.getByLabel("Search knowledge points").fill("convolution");
  await expect(page.locator(".knowledge-point").first()).toBeVisible();
  await page.locator(".source-link").first().click();
  await expect(page.getByLabel("PDF page", { exact: true })).toHaveValue("4");
  await expectCanvas(page);
  await showPanel(page, "Learning assistant");
  await page.getByRole("button", { name: "Ask AI", exact: true }).click();
  await page
    .getByLabel("Ask about this document")
    .fill("Why is convolution useful?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.locator(".citation").first()).toContainText("Page 4");
  await page.getByRole("button", { name: "Flashcards", exact: true }).click();
  await page
    .getByRole("button", { name: "Create flashcards", exact: true })
    .click();
  await expect(page.locator(".card-progress")).toContainText("16 due today");
  await page
    .getByRole("button", { name: "Flip card to reveal answer" })
    .click();
  await page.getByRole("button", { name: /good.*I remembered/ }).click();
  await expect(page.locator(".card-progress")).toContainText("15 due today");
  await page.getByRole("button", { name: "Quiz", exact: true }).click();
  await page.getByRole("button", { name: "Create quiz", exact: true }).click();
  await expect(page.locator(".quiz-question")).toHaveCount(5);
  for (const question of await page.locator(".quiz-question").all()) {
    const input = question.locator("textarea");
    if (await input.count())
      await input.fill(
        "Convolution learns local patterns with shared weights.",
      );
    else await question.getByRole("radio").first().check();
  }
  await page.getByRole("button", { name: "Check my understanding" }).click();
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
    const open = page.getByRole("button", { name: "Open menu" });
    if (await open.isVisible()) {
      await open.click();
      await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "My library" })
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
