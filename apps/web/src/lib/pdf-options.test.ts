import { describe, expect, it } from "vitest";
import { pdfDocumentOptions, PDF_WORKER_SRC } from "./pdf-options";

describe("read-only PDF loading", () => {
  it("requests the authenticated same-origin file endpoint", () => {
    expect(pdfDocumentOptions("sample-id")).toMatchObject({
      url: "/api/v1/documents/sample-id/file",
      withCredentials: true,
      enableXfa: false,
    });
  });

  it("cannot turn a document identifier into a different endpoint", () => {
    expect(pdfDocumentOptions("test/?other=1").url).toBe(
      "/api/v1/documents/test%2F%3Fother%3D1/file",
    );
  });

  it("self-hosts the worker, fonts, CMaps and image decoders", () => {
    const options = pdfDocumentOptions("sample-id");
    expect(PDF_WORKER_SRC).toBe("/pdf.worker.min.mjs");
    for (const url of [
      options.cMapUrl,
      options.standardFontDataUrl,
      options.wasmUrl,
      options.iccUrl,
    ]) {
      expect(url).toMatch(/^\/pdfjs\/[^/]+\/$/);
    }
  });
});
