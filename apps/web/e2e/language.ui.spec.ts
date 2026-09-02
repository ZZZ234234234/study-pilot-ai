import { test, expect } from "@playwright/test";

test("Chinese is default; settings switch English without losing inputs and persist after reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/app/settings");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("radio", { name: "简体中文", exact: true }),
  ).toBeChecked();
  await page.locator(".advanced-provider-settings > summary").click();
  const model = page.getByLabel("对话模型名称");
  await model.fill("unsaved-model-choice");
  await page.getByRole("radio", { name: "English", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Interface language" }),
  ).toBeVisible();
  await expect(page.getByLabel("Chat model")).toHaveValue(
    "unsaved-model-choice",
  );
  await expect(
    page.locator('.sidebar .nav-link[href="/app/library"]'),
  ).toHaveText("My library");
  await expect(page.locator(".configuration-code pre")).toContainText(
    "CHAT_MODEL=unsaved-model-choice",
  );
  expect(await page.locator(".configuration-code pre").innerText()).toContain(
    "\nCHAT_MODEL=",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("radio", { name: "English", exact: true }),
  ).toBeChecked();
  await page.screenshot({
    path: testInfo.outputPath("settings-english.png"),
    fullPage: true,
  });
  for (const route of [
    "/",
    "/privacy",
    "/open-source",
    "/app/library",
    "/app/study-plan",
  ]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).not.toContainText(/[\u3400-\u9fff]/);
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      .toBe(true);
  }
  await page.goto("/app/settings");
  await page.getByRole("radio", { name: "简体中文", exact: true }).check();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(
    page.getByRole("heading", { name: "界面语言", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  expect(errors).toEqual([]);
});

test("language choice works even if the model-settings API is unavailable", async ({
  page,
}) => {
  await page.route("**/api/v1/settings", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Unavailable", code: "api_unavailable" }),
    }),
  );
  await page.goto("/app/settings");
  await page.getByRole("radio", { name: "English", exact: true }).check();
  await page.locator(".advanced-provider-settings > summary").click();
  await expect(
    page.getByRole("heading", { name: "Interface language" }),
  ).toBeVisible();
  await expect(page.locator(".error-state")).toContainText(
    "Could not connect to the backend",
  );
});
