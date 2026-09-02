import { PDFDocument, PageSizes } from "pdf-lib";
import { zipSync } from "fflate";
import { safeDownloadName } from "./download";

export const MAX_INPUT_BYTES = 50 * 1024 * 1024;
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 24_000_000;
export type ImageFormat = "png" | "jpeg" | "webp";
export type ConversionMode =
  "images-pdf" | "pdf-images" | "image-format" | "pdf-text";
export type ConversionOptions = {
  mode: ConversionMode;
  format: ImageFormat;
  paper: "a4" | "image";
  pages: string;
  scale: number;
};

export function validateFiles(
  files: Pick<File, "size" | "name">[],
  mode: ConversionMode,
) {
  if (!files.length) throw new Error("请先选择文件。");
  const imageMode = mode === "images-pdf" || mode === "image-format";
  if (files.length > (imageMode ? 20 : 1))
    throw new Error("图片每批最多 20 张；PDF 每次选择一份。");
  const pattern = imageMode ? /\.(png|jpe?g|webp)$/i : /\.pdf$/i;
  if (files.some((file) => !pattern.test(file.name)))
    throw new Error("文件格式不符合当前工具要求。");
  if (
    files.some((file) => file.size <= 0 || file.size > MAX_FILE_BYTES) ||
    files.reduce((sum, file) => sum + file.size, 0) > MAX_INPUT_BYTES
  )
    throw new Error("单个文件不能超过 20 MB，每批总大小不能超过 50 MB。");
}

export function parsePages(value: string, count: number, limit: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 300)
    throw new Error("转换工具最多处理 300 页 PDF。");
  const pages = new Set<number>();
  const text = value.trim();
  const tokens = text ? text.split(/[,，]/) : [`1-${count}`];
  for (const token of tokens) {
    const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("页码格式应为 1-3,5，且不能超出 PDF 范围。");
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end > count || end < start)
      throw new Error("页码格式应为 1-3,5，且不能超出 PDF 范围。");
    for (let page = start; page <= end; page++) pages.add(page);
  }
  if (pages.size > limit)
    throw new Error("PDF 转图片每批最多 20 页，请缩小页码范围。");
  return [...pages].sort((a, b) => a - b);
}

export function assertDimensions(width: number, height: number) {
  if (
    ![width, height].every((value) => Number.isFinite(value) && value > 0) ||
    width * height > MAX_IMAGE_PIXELS ||
    Math.max(width, height) > 16384
  )
    throw new Error("图片分辨率过大，请先缩小图片或降低输出清晰度。");
}

export function imageKind(bytes: Uint8Array): ImageFormat {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    bytes.length >= 24 &&
    bytes[0] === 137 &&
    bytes[1] === 80 &&
    bytes[2] === 78 &&
    bytes[3] === 71 &&
    bytes[4] === 13 &&
    bytes[5] === 10 &&
    bytes[6] === 26 &&
    bytes[7] === 10
  ) {
    assertDimensions(view.getUint32(16), view.getUint32(20));
    return "png";
  }
  if (bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    // Inspect the JPEG frame before asking the browser to allocate decoded pixels.
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 255) break;
      const marker = bytes[offset + 1];
      if (marker === 255) {
        offset++;
        continue;
      }
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + length + 2 > bytes.length) break;
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker) &&
        length >= 8
      ) {
        assertDimensions(
          view.getUint16(offset + 7),
          view.getUint16(offset + 5),
        );
        return "jpeg";
      }
      offset += length + 2;
    }
    throw new Error("图片内容损坏或不受支持，请重新导出 PNG、JPG 或 WebP。");
  }
  if (
    bytes.length >= 30 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    const type = String.fromCharCode(...bytes.slice(12, 16));
    if (type === "VP8X") {
      assertDimensions(
        1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16),
      );
    } else if (type === "VP8L" && bytes[20] === 47) {
      const dimensions = view.getUint32(21, true);
      assertDimensions(
        1 + (dimensions & 0x3fff),
        1 + ((dimensions >>> 14) & 0x3fff),
      );
    } else if (
      type === "VP8 " &&
      bytes[23] === 157 &&
      bytes[24] === 1 &&
      bytes[25] === 42
    ) {
      assertDimensions(
        view.getUint16(26, true) & 0x3fff,
        view.getUint16(28, true) & 0x3fff,
      );
    } else
      throw new Error("图片内容损坏或不受支持，请重新导出 PNG、JPG 或 WebP。");
    return "webp";
  }
  throw new Error("图片内容损坏或不受支持，请重新导出 PNG、JPG 或 WebP。");
}

export function imagePlacement(
  width: number,
  height: number,
  paper: "a4" | "image",
) {
  assertDimensions(width, height);
  const page =
    paper === "a4"
      ? width > height
        ? [PageSizes.A4[1], PageSizes.A4[0]]
        : [...PageSizes.A4]
      : [width * 0.75, height * 0.75];
  const margin = paper === "a4" ? 24 : 0;
  const scale = Math.min(
    (page[0] - margin * 2) / width,
    (page[1] - margin * 2) / height,
  );
  return {
    page,
    x: (page[0] - width * scale) / 2,
    y: (page[1] - height * scale) / 2,
    width: width * scale,
    height: height * scale,
  };
}

export async function imagePdf(
  images: { data: Uint8Array; kind: "png" | "jpeg" }[],
  paper: "a4" | "image",
) {
  const pdf = await PDFDocument.create();
  pdf.setCreator("StudyPilot AI · Local file tools");
  for (const image of images) {
    const embedded =
      image.kind === "png"
        ? await pdf.embedPng(image.data)
        : await pdf.embedJpg(image.data);
    const placement = imagePlacement(embedded.width, embedded.height, paper);
    const page = pdf.addPage(placement.page as [number, number]);
    page.drawImage(embedded, placement);
  }
  return pdf.save();
}

export function bundleFiles(files: { name: string; data: Uint8Array }[]) {
  if (
    !files.length ||
    files.reduce((sum, file) => sum + file.data.length, 0) > MAX_OUTPUT_BYTES
  )
    throw new Error("输出超过 100 MB，请减少文件或页数。");
  const entries: Record<string, Uint8Array> = {};
  files.forEach((file, index) => {
    entries[
      `${String(index + 1).padStart(3, "0")}-${safeDownloadName(file.name, 140)}`
    ] = file.data;
  });
  // PNG/JPEG/WebP are already compressed. ZIP store avoids CPU-heavy recompression.
  return zipSync(entries, { level: 0 });
}
