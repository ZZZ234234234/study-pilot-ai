import { createRequire } from "node:module";
import { copyFile, mkdir } from "node:fs/promises";
const require = createRequire(import.meta.url);
await mkdir(new URL("../public", import.meta.url), { recursive: true });
await copyFile(require.resolve("pdfjs-dist/build/pdf.worker.min.mjs"), new URL("../public/pdf.worker.min.mjs", import.meta.url));
