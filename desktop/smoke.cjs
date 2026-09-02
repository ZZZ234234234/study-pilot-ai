// Explicit CI mode: test installed API, database and PDF worker, without AI calls.
const fs = require("node:fs/promises");
const path = require("node:path");
module.exports = async function smoke(origin, directory) {
  const headers = { "X-StudyPilot": "1", Origin: origin };
  const saved = path.join(directory, "smoke-session.json");
  let previous;
  try {
    previous = JSON.parse(await fs.readFile(saved, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (previous) headers.Cookie = previous.cookie;
  const response = await fetch(`${origin}/api/v1/session`, {
    method: "POST",
    headers,
  });
  if (!response.ok) throw new Error(`Session failed: ${response.status}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Session cookie missing");
  headers.Cookie = cookie;
  async function json(route, method = "GET") {
    const result = await fetch(`${origin}/api/v1/${route}`, {
      method,
      headers,
    });
    if (!result.ok) throw new Error(`${route}: ${result.status}`);
    return result.json();
  }
  await json("health");
  await json("settings");
  await json("ai/profiles");
  const document = previous
    ? await json(`documents/${previous.id}`)
    : await json("documents/demo", "POST");
  for (let attempt = 0; attempt < 120; attempt++) {
    const result = await json(`documents/${document.id}`);
    if (result.status === "failed") throw new Error("PDF processing failed");
    if (result.status === "ready") {
      if (result.page_count !== 8)
        throw new Error("Expected eight sample pages");
      const pdf = await fetch(
        `${origin}/api/v1/documents/${document.id}/file`,
        { headers },
      );
      const bytes = new Uint8Array(await pdf.arrayBuffer());
      if (!pdf.ok || Buffer.from(bytes.slice(0, 5)).toString() !== "%PDF-")
        throw new Error("PDF download failed");
      await fs.writeFile(saved, JSON.stringify({ cookie, id: document.id }));
      await fs.writeFile(
        path.join(
          directory,
          previous ? "restart-ok.txt" : "first-start-ok.txt",
        ),
        "Installed services and PDF persistence passed.\n",
      );
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("PDF processing timed out");
};
