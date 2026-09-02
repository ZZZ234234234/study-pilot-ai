import { cp, mkdir, writeFile, appendFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = path.join(root, "desktop/bundle");
await mkdir(bundle, { recursive: true });
for (const [from, to] of [
  ["apps/web/.next/standalone", "web"],
  ["apps/api/migrations", "migrations"],
  ["docs/sample", "docs/sample"],
  ["scripts/dev-db.mjs", "db.mjs"],
  ["LICENSE", "LICENSE"],
])
  await cp(path.join(root, from), path.join(bundle, to), { recursive: true });
await appendFile(
  path.join(bundle, "db.mjs"),
  '\nprocess.parentPort?.on("message", ({ data }) => { if (data === "shutdown") void stop(); });\n',
);
// Separate minimal dependency tree: no workspace, development data or API keys.
await writeFile(
  path.join(bundle, "package.json"),
  JSON.stringify(
    {
      private: true,
      dependencies: {
        "@electric-sql/pglite": "0.5.8",
        "@electric-sql/pglite-pgvector": "0.0.9",
        "@electric-sql/pglite-socket": "0.2.11",
      },
    },
    null,
    2,
  ),
);
