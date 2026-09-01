// Next's standalone server needs public assets and compiled CSS/JS beside it.
import { cp } from "node:fs/promises";
const app = new URL("../", import.meta.url);
const standalone = new URL(".next/standalone/apps/web/", app);
await cp(new URL("public/", app), new URL("public/", standalone), {
  recursive: true,
});
await cp(new URL(".next/static/", app), new URL(".next/static/", standalone), {
  recursive: true,
});
