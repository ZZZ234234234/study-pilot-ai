import type { DocumentInitParameters } from "pdfjs-dist/types/src/display/api";

export const PDF_WORKER_SRC = "/pdf.worker.min.mjs";

export function pdfDocumentOptions(id: string): DocumentInitParameters {
  // Read-only canvas viewer: no PDFViewer, scripting manager or executable forms.
  // All supporting assets come from the same locked PDF.js package as the worker.
  return {
    url: `/api/v1/documents/${encodeURIComponent(id)}/file`,
    withCredentials: true,
    enableXfa: false,
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    wasmUrl: "/pdfjs/wasm/",
    iccUrl: "/pdfjs/iccs/",
  };
}
