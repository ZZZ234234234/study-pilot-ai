// Development-only PostgreSQL WASM with real pgvector operators. Never expose this server.
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import path from "node:path";
const db = await PGlite.create({
  dataDir: path.join(process.env.DATA_DIR || "data", "pglite"),
  extensions: { vector },
});
const server = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: 54329,
  maxConnections: 30,
});
await server.start();
console.info(
  "Development PGlite + pgvector ready on 127.0.0.1:54329 (not for production).",
);
async function stop() {
  await server.stop();
  await db.close();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
