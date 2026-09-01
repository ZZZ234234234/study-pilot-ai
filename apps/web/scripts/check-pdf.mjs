// Node canvas compatibility check, NOT a browser rendering / visual acceptance test.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { getDocument, version } from "pdfjs-dist/legacy/build/pdf.mjs";

const require = createRequire(import.meta.url);
const packageRoot = new URL(
  "./",
  pathToFileURL(require.resolve("pdfjs-dist/package.json")),
);
const sample = new URL(
  "../../../docs/sample/introduction-to-neural-networks.pdf",
  import.meta.url,
);
const task = getDocument({
  data: new Uint8Array(await readFile(sample)),
  standardFontDataUrl: fileURLToPath(new URL("standard_fonts/", packageRoot)),
  enableXfa: false,
});
try {
  const pdf = await task.promise;
  assert.equal(pdf.numPages, 8);
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 1 });
    const target = pdf.canvasFactory.create(viewport.width, viewport.height);
    try {
      await page.render({
        canvas: target.canvas,
        canvasContext: target.context,
        viewport,
      }).promise;
      const pixels = target.context.getImageData(
        0,
        0,
        target.canvas.width,
        target.canvas.height,
      ).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        if (
          pixels[i + 3] > 200 &&
          pixels[i] < 200 &&
          pixels[i + 1] < 200 &&
          pixels[i + 2] < 200
        )
          ink++;
      }
      assert.ok(
        ink > 100,
        `Page ${number} must render visible text or graphics`,
      );
      assert.ok(
        (await page.getTextContent()).items.length > 0,
        `Page ${number} must contain text`,
      );
    } finally {
      pdf.canvasFactory.destroy(target);
    }
  }
  console.info(
    `PDF.js ${version}: all 8 sample pages rendered and text extracted in Node. Browser rendering is a separate check.`,
  );
} finally {
  await task.destroy();
}
