// Backend dependency trees are independent of Electron's dependency collector.
// Copy the complete prepared bundle; do not let nested node_modules be pruned.
const { cp, access } = require("node:fs/promises");
const path = require("node:path");
const { createRequire } = require("node:module");
module.exports = async function afterPack(context) {
  const target = path.join(context.appOutDir, "resources", "bundle");
  await cp(path.join(__dirname, "bundle"), target, {
    recursive: true,
    dereference: true,
  });
  for (const file of [
    "node_modules/@electric-sql/pglite/package.json",
    "node_modules/@electric-sql/pglite-pgvector/package.json",
    "node_modules/@electric-sql/pglite-socket/package.json",
    "runtime/node.exe",
    "backend/studypilot-backend.exe",
    "web/apps/web/server.js",
    "docs/sample/introduction-to-neural-networks.pdf",
  ])
    await access(path.join(target, file));
  const next = createRequire(
    path.join(target, "web/apps/web/server.js"),
  ).resolve("next");
  if (!next.startsWith(target + path.sep))
    throw new Error("Next dependency escaped packaged bundle");
};
