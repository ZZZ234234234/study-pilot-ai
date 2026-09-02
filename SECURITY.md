# Security and data boundaries

## Status

This is an alpha development preview, not a security-audited multi-tenant service. Do not treat a successful build or the included checks as production certification.

## Existing safeguards

- Signed, HttpOnly browser workspace cookies and document ownership checks.
- Same-origin frontend proxy; mutations require a protection header and reject unexpected browser origins.
- PDF extension, content type, signature, byte-size and page-count checks.
- UUID-based storage filenames; uploads and private environment files are excluded from Git.
- Model keys remain on the server. Provider responses are not included in generic error logs.
- Source references are resolved against chunks belonging to the selected document.
- Translation checks document ownership before reading or sending a page to a model. It validates segment IDs and keeps the authoritative source separate from generated translations. These checks do not certify translation accuracy or eliminate prompt injection.
- The conversion toolkit processes file bytes in browser memory, not through an upload service. It checks file limits and image dimensions, bounds rendering batches and sanitizes ZIP member names.
- Deleting a document removes its associated learning records and stored PDF.
- The read-only PDF canvas uses a patched PDF.js dependency with locally served matching worker/resources; it does not initialize a PDF scripting manager or XFA forms.

The lockfile was upgraded from PDF.js 5.7.284 to 6.3.289 after [Mozilla's GHSA-hq66-cqwq-w95j advisory](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j). The affected dependency was present; exploitability of this application's canvas-only path was not demonstrated. A clean `npm audit --omit=dev` is a dependency snapshot, not a complete security review. Keep checking for new advisories.

## Limitations and operational responsibilities

- Anonymous cookies are not recoverable user accounts. Losing a cookie loses access to that workspace; it does not erase server-side data.
- The included limiter is process-local and is not a distributed anti-abuse system. Enforce body-size limits, global quotas and rate limits at the reverse proxy before public exposure, including chunked requests.
- PGlite's local socket is for development only. Production requires a secured PostgreSQL service and properly managed migrations.
- Configure HTTPS, secret rotation, persistent storage, backups, retention and access controls yourself. Backups may retain deleted records until their own expiry.
- Remote model services receive document chunks and questions. Local inference is only local when the selected provider and endpoint are local.
- Translation additionally sends selected page text and user-supplied terminology after confirmation. Requests already sent may continue and incur usage charges after a stop or navigation; stopping only prevents later pages. In-memory translations disappear when leaving/reloading the document, but exported files and the model provider's own retention are outside that lifecycle.
- Browser conversion is not a malware scanner or decompression sandbox. Pixel/byte limits do not cover every hostile PDF or decoder bug. Use trusted files and current dependencies. Exported PDFs/images do not preserve all source metadata, color profiles or animation.
- PDFs can consume significant resources. Worker isolation, memory/time limits, malware scanning and OCR are not implemented.
- Grounded citations improve traceability but do not prove an AI answer is correct. Uploaded text may contain prompt injection.

## Reporting

Do not post exploitable details, private documents or secrets in a public issue. If GitHub's private vulnerability reporting button is available, use it. Otherwise open a non-sensitive issue requesting a private contact method without disclosing the vulnerability itself. No response-time commitment is made for this volunteer project.
