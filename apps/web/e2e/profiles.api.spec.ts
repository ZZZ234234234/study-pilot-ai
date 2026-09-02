import { test, expect } from "@playwright/test";
import { createSession, mutationHeaders } from "./helpers";

test("private model connections survive requests, redact keys and isolate workspaces", async ({
  request,
  playwright,
  baseURL,
}) => {
  await createSession(request, baseURL!);
  const headers = mutationHeaders(baseURL!);
  const key = "non-billable-e2e-fixture-key";
  const body = {
    name: "测试阅读助手",
    provider: "deepseek",
    base_url: "https://api.deepseek.com/v1",
    model: "deepseek-v4-flash",
    api_key: key,
  };
  const created = await request.post("/api/v1/ai/profiles", {
    headers,
    data: body,
  });
  expect(created.status()).toBe(200);
  expect(await created.text()).not.toContain(key);
  const id = (await created.json()).id;
  const stranger = await playwright.request.newContext({ baseURL });
  try {
    const list = await request.get("/api/v1/ai/profiles");
    expect((await list.json()).default_id).toBe(id);
    expect(await list.text()).not.toContain(key);
    expect(
      (await (await request.get("/api/v1/settings")).json()).chat_available,
    ).toBe(true);
    await createSession(stranger, baseURL!);
    expect(
      (await (await stranger.get("/api/v1/ai/profiles")).json()).profiles,
    ).toEqual([]);
    expect(
      (
        await stranger.patch(`/api/v1/ai/profiles/${id}`, {
          headers,
          data: body,
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await stranger.post("/api/v1/ai/profiles/test", {
          headers,
          data: { ...body, profile_id: id },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await stranger.delete(`/api/v1/ai/profiles/${id}`, { headers })
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.patch(`/api/v1/ai/profiles/${id}`, {
          headers,
          data: { ...body, name: "新名称", api_key: "" },
        })
      ).status(),
    ).toBe(200);
    const edited = (await (await request.get("/api/v1/ai/profiles")).json())
      .profiles[0];
    expect(edited.name).toBe("新名称");
    expect(edited.revision).toBe(2);
    // Invalid input is rejected without ever calling a real provider.
    expect(
      (
        await request.post("/api/v1/ai/profiles/test", {
          headers,
          data: { ...body, base_url: "http://127.0.0.1:8000" },
        })
      ).status(),
    ).toBe(422);
    const invalid = await request.post("/api/v1/ai/profiles", {
      headers,
      data: { ...body, api_key: "secret\ninvalid" },
    });
    expect(invalid.status()).toBe(422);
    expect(await invalid.text()).not.toContain("secret");
    expect(
      (await request.post("/api/v1/ai/profiles", { data: body })).status(),
    ).toBe(403);
  } finally {
    await stranger.dispose();
    expect(
      (await request.delete(`/api/v1/ai/profiles/${id}`, { headers })).status(),
    ).toBe(204);
  }
  expect(
    (await (await request.get("/api/v1/ai/profiles")).json()).profiles,
  ).toEqual([]);
});

test("model settings route loads and never embeds keys into server-rendered HTML", async ({
  request,
}) => {
  const page = await request.get("/app/models");
  expect(page.status()).toBe(200);
  expect(await page.text()).toContain("适合你的模型");
  expect(await page.text()).not.toContain("non-billable-e2e-fixture-key");
});
