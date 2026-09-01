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
- Deleting a document removes its associated learning records and stored PDF.

## Limitations and operational responsibilities

- Anonymous cookies are not recoverable user accounts. Losing a cookie loses access to that workspace; it does not erase server-side data.
- The included limiter is process-local and is not a distributed anti-abuse system. Enforce body-size limits, global quotas and rate limits at the reverse proxy before public exposure, including chunked requests.
- PGlite's local socket is for development only. Production requires a secured PostgreSQL service and properly managed migrations.
- Configure HTTPS, secret rotation, persistent storage, backups, retention and access controls yourself. Backups may retain deleted records until their own expiry.
- Remote model services receive document chunks and questions. Local inference is only local when the selected provider and endpoint are local.
- PDFs can consume significant resources. Worker isolation, memory/time limits, malware scanning and OCR are not implemented.
- Grounded citations improve traceability but do not prove an AI answer is correct. Uploaded text may contain prompt injection.

## Reporting

Do not post exploitable details, private documents or secrets in a public issue. If GitHub's private vulnerability reporting button is available, use it. Otherwise open a non-sensitive issue requesting a private contact method without disclosing the vulnerability itself. No response-time commitment is made for this volunteer project.
