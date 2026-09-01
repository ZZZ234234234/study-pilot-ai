import { createRequire } from "node:module";
import { copyFile, cp, mkdir } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const pdfRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
await mkdir(new URL("../public", import.meta.url), { recursive: true });
await copyFile(
  require.resolve("pdfjs-dist/build/pdf.worker.min.mjs"),
  new URL("../public/pdf.worker.min.mjs", import.meta.url),
);
for (const folder of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  await cp(
    path.join(pdfRoot, folder),
    new URL(`../public/pdfjs/${folder}`, import.meta.url),
    { recursive: true },
  );
}
