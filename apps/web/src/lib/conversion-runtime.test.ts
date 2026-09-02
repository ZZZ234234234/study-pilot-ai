// Executes real encoders and PDF rendering through Node canvas adapters, NOT a browser test.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";
import { convertFiles } from "./conversion";
import { imageKind, type ConversionOptions } from "./conversion-core";

const require = createRequire(import.meta.url);
vi.mock("pdfjs-dist", async () => {
  const real = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return {
    GlobalWorkerOptions: { workerSrc: "" },
    getDocument: (options: object) =>
      real.getDocument({
        ...options,
        standardFontDataUrl: path.join(
          path.dirname(require.resolve("pdfjs-dist/package.json")),
          "standard_fonts/",
        ),
      }),
  };
});

beforeAll(() => {
  vi.stubGlobal("createImageBitmap", async (blob: Blob) => {
    const image = await loadImage(Buffer.from(await blob.arrayBuffer()));
    return Object.assign(image, { close: () => {} });
  });
  vi.stubGlobal("document", {
    createElement: () => {
      const canvas = createCanvas(1, 1);
      return Object.assign(canvas, {
        toBlob: (callback: (blob: Blob) => void, mime: string) => {
          const format =
            mime === "image/jpeg"
              ? "jpeg"
              : mime === "image/webp"
                ? "webp"
                : "png";
          const encoded =
            format === "png"
              ? canvas.encodeSync("png")
              : canvas.encodeSync(format);
          callback(new Blob([new Uint8Array(encoded)], { type: mime }));
        },
      });
    },
  });
});
afterAll(() => vi.unstubAllGlobals());

function fixture(name = "figure.png", landscape = true) {
  const canvas = createCanvas(landscape ? 600 : 300, landscape ? 300 : 600);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#eff4e9";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#284b36";
  ctx.fillRect(30, 30, canvas.width - 60, 90);
  ctx.fillStyle = "#b54738";
  ctx.fillRect(30, 140, canvas.width / 3, 100);
  return new File([new Uint8Array(canvas.encodeSync("png"))], name, {
    type: "image/png",
  });
}
const base: ConversionOptions = {
  mode: "images-pdf",
  paper: "a4",
  format: "png",
  pages: "1",
  scale: 1,
};
const signal = () => new AbortController().signal;

describe("actual conversion bytes with Node canvas adapters", () => {
  it("converts images to a reopenable PDF, renders both pages and exports a ZIP", async () => {
    const result = await convertFiles(
      [fixture(), fixture("portrait.png", false)],
      base,
      signal(),
      () => {},
    );
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    const reopened = await PDFDocument.load(bytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getPage(0).getWidth()).toBeGreaterThan(
      reopened.getPage(0).getHeight(),
    );
    expect(reopened.getPage(1).getWidth()).toBeLessThan(
      reopened.getPage(1).getHeight(),
    );
    const exported = await convertFiles(
      [new File([bytes], "figures.pdf", { type: "application/pdf" })],
      { ...base, mode: "pdf-images", pages: "1-2" },
      signal(),
      () => {},
    );
    const entries = unzipSync(
      new Uint8Array(await exported.blob.arrayBuffer()),
    );
    expect(Object.keys(entries)).toHaveLength(2);
    for (const data of Object.values(entries)) {
      expect(imageKind(data)).toBe("png");
      const image = await loadImage(Buffer.from(data));
      expect(image.width * image.height).toBeGreaterThan(400_000);
    }
    // Optional reproducible visual QA, kept outside version-controlled source.
    if (process.env.CONVERSION_QA_DIR) {
      const directory = path.resolve(process.env.CONVERSION_QA_DIR);
      mkdirSync(directory, { recursive: true });
      writeFileSync(path.join(directory, "images-roundtrip.pdf"), bytes);
      Object.values(entries).forEach((data, i) =>
        writeFileSync(path.join(directory, `roundtrip-${i + 1}.png`), data),
      );
    }
  });
  it.each(["png", "jpeg", "webp"] as const)(
    "writes actual %s image bytes with unchanged dimensions",
    async (format) => {
      const result = await convertFiles(
        [fixture()],
        { ...base, mode: "image-format", format },
        signal(),
        () => {},
      );
      const bytes = new Uint8Array(await result.blob.arrayBuffer());
      expect(imageKind(bytes)).toBe(format);
      const image = await loadImage(Buffer.from(bytes));
      expect([image.width, image.height]).toEqual([600, 300]);
    },
  );
  it("extracts real PDF text and exact selected page markers", async () => {
    const file = new File(
      [
        readFileSync(
          path.resolve("../../docs/sample/introduction-to-neural-networks.pdf"),
        ),
      ],
      "sample.pdf",
      { type: "application/pdf" },
    );
    const result = await convertFiles(
      [file],
      { ...base, mode: "pdf-text", pages: "4" },
      signal(),
      () => {},
    );
    const text = await result.blob.text();
    expect(text).toContain("Page / 页 4");
    expect(text).toMatch(/convolution/i);
    expect(text).not.toContain("Page / 页 3");
  });
  it("does not claim OCR for a scanned image PDF", async () => {
    const imagePdf = await convertFiles([fixture()], base, signal(), () => {});
    const file = new File([await imagePdf.blob.arrayBuffer()], "scan.pdf", {
      type: "application/pdf",
    });
    await expect(
      convertFiles([file], { ...base, mode: "pdf-text" }, signal(), () => {}),
    ).rejects.toThrow("OCR");
  });
  it("rejects disguised PDFs and respects cancellation before processing", async () => {
    const bad = new File(["not a PDF"], "fake.pdf");
    await expect(
      convertFiles([bad], { ...base, mode: "pdf-images" }, signal(), () => {}),
    ).rejects.toThrow("有效的 PDF");
    const controller = new AbortController();
    controller.abort();
    await expect(
      convertFiles([fixture()], base, controller.signal, () => {}),
    ).rejects.toHaveProperty("name", "AbortError");
  });
});
