import { PDF_WORKER_SRC, pdfDocumentOptions } from "./pdf-options";
import { safeDownloadName } from "./download";
import {
  assertDimensions,
  bundleFiles,
  imageKind,
  imagePdf,
  MAX_OUTPUT_BYTES,
  parsePages,
  validateFiles,
  type ConversionOptions,
  type ImageFormat,
} from "./conversion-core";

export type ConversionResult = { blob: Blob; name: string; count: number };
type Progress = (done: number, total: number) => void;
const mime = (format: ImageFormat) => `image/${format}`;
const extension = (format: ImageFormat) => (format === "jpeg" ? "jpg" : format);
const checkAbort = (signal: AbortSignal) => {
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
};
const yieldFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function canvasBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== mime(format))
          reject(new Error("浏览器不支持这个输出格式，请改选 PNG 或 JPG。"));
        else resolve(blob);
      },
      mime(format),
      0.92,
    ),
  );
}

async function normalizeImage(file: File, format: ImageFormat) {
  const data = new Uint8Array(await file.arrayBuffer());
  const detected = imageKind(data);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(
      new Blob([data], { type: mime(detected) }),
    );
  } catch {
    throw new Error("图片内容损坏或不受支持，请重新导出 PNG、JPG 或 WebP。");
  }
  const canvas = document.createElement("canvas");
  try {
    assertDimensions(bitmap.width, bitmap.height);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建绘图画布，请换用支持 Canvas 的浏览器。");
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(bitmap, 0, 0);
    const blob = await canvasBlob(canvas, format);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    bitmap.close();
    canvas.width = 0;
    canvas.height = 0;
  }
}

export async function convertFiles(
  files: File[],
  options: ConversionOptions,
  signal: AbortSignal,
  progress: Progress,
): Promise<ConversionResult> {
  validateFiles(files, options.mode);
  checkAbort(signal);
  const outputs: { name: string; data: Uint8Array }[] = [];
  let outputBytes = 0;
  function addOutput(name: string, data: Uint8Array) {
    outputBytes += data.length;
    if (outputBytes > MAX_OUTPUT_BYTES)
      throw new Error("输出超过 100 MB，请减少文件或页数。");
    outputs.push({ name, data });
  }
  if (options.mode === "images-pdf" || options.mode === "image-format") {
    const images: { data: Uint8Array; kind: "png" | "jpeg" }[] = [];
    for (let i = 0; i < files.length; i++) {
      checkAbort(signal);
      const format = options.mode === "images-pdf" ? "png" : options.format;
      const data = await normalizeImage(files[i], format);
      addOutput(
        `${safeDownloadName(files[i].name.replace(/\.[^.]+$/, ""))}.${extension(format)}`,
        data,
      );
      if (options.mode === "images-pdf") images.push({ data, kind: "png" });
      progress(i + 1, files.length);
      await yieldFrame();
    }
    checkAbort(signal);
    if (options.mode === "images-pdf") {
      const data = await imagePdf(images, options.paper);
      checkAbort(signal);
      if (data.length > MAX_OUTPUT_BYTES)
        throw new Error("输出超过 100 MB，请减少文件或页数。");
      return {
        blob: new Blob([new Uint8Array(data)], { type: "application/pdf" }),
        name: "studypilot-images.pdf",
        count: images.length,
      };
    }
  } else {
    const data = new Uint8Array(await files[0].arrayBuffer());
    if (new TextDecoder().decode(data.slice(0, 5)) !== "%PDF-")
      throw new Error("文件内容不是有效的 PDF。");
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
    const task = pdfjs.getDocument({
      ...pdfDocumentOptions("local"),
      url: undefined,
      withCredentials: false,
      data,
    });
    const cancel = () => {
      void task.destroy();
    };
    signal.addEventListener("abort", cancel, { once: true });
    try {
      const pdf = await task.promise;
      checkAbort(signal);
      const pages = parsePages(
        options.pages,
        pdf.numPages,
        options.mode === "pdf-images" ? 20 : 300,
      );
      const text: string[] = [];
      let readable = false;
      for (let i = 0; i < pages.length; i++) {
        checkAbort(signal);
        const page = await pdf.getPage(pages[i]);
        try {
          if (options.mode === "pdf-text") {
            const content = await page.getTextContent();
            const value = content.items
              .map((item) =>
                "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
              )
              .join("");
            if (value.trim()) readable = true;
            text.push(`--- Page / 页 ${pages[i]} ---\n${value}\n`);
            outputBytes += value.length * 4;
            if (outputBytes > MAX_OUTPUT_BYTES)
              throw new Error("输出超过 100 MB，请减少文件或页数。");
          } else {
            if (![1, 2, 3].includes(options.scale))
              throw new Error("请选择有效的输出清晰度。");
            const viewport = page.getViewport({ scale: options.scale });
            assertDimensions(viewport.width, viewport.height);
            const canvas = document.createElement("canvas");
            try {
              canvas.width = Math.ceil(viewport.width);
              canvas.height = Math.ceil(viewport.height);
              const context = canvas.getContext("2d");
              if (!context)
                throw new Error(
                  "无法创建绘图画布，请换用支持 Canvas 的浏览器。",
                );
              await page.render({
                canvas,
                canvasContext: context,
                viewport,
                background: "rgb(255,255,255)",
              }).promise;
              const blob = await canvasBlob(canvas, options.format);
              addOutput(
                `page-${String(pages[i]).padStart(3, "0")}.${extension(options.format)}`,
                new Uint8Array(await blob.arrayBuffer()),
              );
            } finally {
              canvas.width = 0;
              canvas.height = 0;
            }
          }
        } finally {
          page.cleanup();
        }
        progress(i + 1, pages.length);
        await yieldFrame();
      }
      if (options.mode === "pdf-text") {
        if (!readable)
          throw new Error(
            "没有提取到文字，扫描件需要 OCR；本工具不包含文字识别。",
          );
        checkAbort(signal);
        return {
          blob: new Blob(["\uFEFF", text.join("\n")], {
            type: "text/plain;charset=utf-8",
          }),
          name: `${safeDownloadName(files[0].name.replace(/\.pdf$/i, ""))}.txt`,
          count: pages.length,
        };
      }
    } catch (error) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      if (error instanceof Error && error.name === "PasswordException")
        throw new Error("PDF 有密码保护，请先解锁后再转换。");
      throw error;
    } finally {
      signal.removeEventListener("abort", cancel);
      await task.destroy();
    }
  }
  checkAbort(signal);
  if (outputs.length === 1)
    return {
      blob: new Blob([new Uint8Array(outputs[0].data)], {
        type: mime(options.format),
      }),
      name: outputs[0].name,
      count: 1,
    };
  return {
    blob: new Blob([new Uint8Array(bundleFiles(outputs))], {
      type: "application/zip",
    }),
    name: "studypilot-images.zip",
    count: outputs.length,
  };
}
