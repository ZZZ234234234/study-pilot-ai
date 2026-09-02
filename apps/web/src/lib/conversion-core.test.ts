import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";
import {
  assertDimensions,
  bundleFiles,
  imageKind,
  imagePdf,
  imagePlacement,
  parsePages,
  validateFiles,
} from "./conversion-core";
import { safeDownloadName } from "./download";

const pixel = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j3ioAAAAASUVORK5CYII=",
    "base64",
  ),
);

describe("local conversion safeguards and editable options", () => {
  it("validates file counts, extensions, nonempty content and byte limits", () => {
    expect(() =>
      validateFiles([{ name: "A.PNG", size: 200 }], "images-pdf"),
    ).not.toThrow();
    for (const files of [
      [],
      [{ name: "a.svg", size: 100 }],
      [{ name: "a.png", size: 0 }],
      [{ name: "a.png", size: 21 * 1024 ** 2 }],
      Array.from({ length: 21 }, () => ({ name: "a.png", size: 100 })),
      Array.from({ length: 3 }, () => ({
        name: "a.png",
        size: 20 * 1024 ** 2,
      })),
    ])
      expect(() => validateFiles(files, "images-pdf")).toThrow();
    expect(() =>
      validateFiles(
        [
          { name: "a.pdf", size: 100 },
          { name: "b.pdf", size: 100 },
        ],
        "pdf-images",
      ),
    ).toThrow();
  });
  it("parses ranges, removes duplicate pages and orders output", () => {
    expect(parsePages("5, 1-3，2", 8, 20)).toEqual([1, 2, 3, 5]);
    expect(parsePages("", 3, 20)).toEqual([1, 2, 3]);
  });
  it.each(["0", "9", "3-1", "1-99999999", "abc", "1.5", "1,", "1;2"])(
    "rejects invalid page expression %s",
    (value) => {
      expect(() => parsePages(value, 8, 20)).toThrow();
    },
  );
  it("enforces image export and document page limits", () => {
    expect(() => parsePages("", 21, 20)).toThrow();
    expect(() => parsePages("1", 301, 20)).toThrow();
  });
  it("fits portrait and landscape images without stretching or cropping", () => {
    for (const [width, height] of [
      [1200, 800],
      [400, 1800],
    ]) {
      const p = imagePlacement(width, height, "a4");
      expect(p.width / p.height).toBeCloseTo(width / height);
      expect(p.x).toBeGreaterThanOrEqual(23.99);
      expect(p.y).toBeGreaterThanOrEqual(23.99);
    }
    expect(imagePlacement(800, 600, "image").page).toEqual([600, 450]);
  });
  it("checks image magic and rejects excessive pixel allocations before decoding", () => {
    expect(imageKind(pixel)).toBe("png");
    expect(() => imageKind(new TextEncoder().encode("not a png"))).toThrow();
    const oversized = new Uint8Array(pixel);
    new DataView(oversized.buffer).setUint32(16, 99999);
    expect(() => imageKind(oversized)).toThrow();
    expect(() => assertDimensions(6000, 5000)).toThrow();
  });
  it("writes a genuine two-page PDF that can be re-opened", async () => {
    const bytes = await imagePdf(
      [
        { data: pixel, kind: "png" },
        { data: pixel, kind: "png" },
      ],
      "a4",
    );
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const reopened = await PDFDocument.load(bytes);
    expect(reopened.getPageCount()).toBe(2);
    expect(reopened.getPage(0).getWidth()).toBeCloseTo(595.28);
  });
  it("bundles same-name images without overwriting or archive path traversal", () => {
    const zipped = bundleFiles([
      { name: "../../a.png", data: pixel },
      { name: "../../a.png", data: pixel },
    ]);
    const unzipped = unzipSync(zipped);
    expect(Object.keys(unzipped)).toHaveLength(2);
    expect(Object.keys(unzipped).every((name) => !name.includes("/"))).toBe(
      true,
    );
    expect(Object.values(unzipped)[0]).toEqual(pixel);
    expect(safeDownloadName("a/b:c?.pdf")).toBe("a_b_c_.pdf");
  });
});
