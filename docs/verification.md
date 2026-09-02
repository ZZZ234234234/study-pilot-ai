# Verification record

Translation and local-conversion update checked on **2026-09-02** in the project workspace. This is an alpha snapshot, not a production certification. No real AI credentials, private papers or normal development data were used.

## Current checks

| Check                                     | Result                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Dependency installation                   | Updated lockfile for pdf-lib and fflate; locked installation checked with `npm ci`                                    |
| Frontend production build                 | Passed, including standalone assets and `/app/tools`                                                                  |
| TypeScript                                | Passed (`npm run typecheck`)                                                                                          |
| Frontend lint                             | Passed (`npm run lint`)                                                                                               |
| Formatting                                | Passed (`npm run format:check`)                                                                                       |
| Frontend logic/component/conversion tests | 68 passed: including eleven static rendering, five jsdom translation interaction and seven Node-canvas runtime checks |
| Backend lint                              | Passed (`python -m ruff check apps/api scripts`)                                                                      |
| Backend tests                             | 45 passed, including 24 translation schema and isolated endpoint checks                                               |
| PDF.js compatibility                      | All eight original sample pages rendered and text extracted in Node (`npm run test:pdf`)                              |
| API end-to-end tests                      | 18 passed against the production frontend, temporary API, worker and PGlite                                           |
| Local API workflow                        | Passed (`python scripts/smoke_test.py --start-services`)                                                              |
| Production dependency audit               | Zero reported on 2026-09-02 (`npm audit --omit=dev`); not a whole-application security assessment                     |
| Browser test collection                   | 16 desktop/mobile scenarios collected separately from the 18 API cases                                                |
| Browser execution                         | Not passed; previous local-browser/runtime connection blockers remain. No new browser execution claimed               |

**131 automated tests passed in total.** Node/jsdom checks are not real browser acceptance or evidence of translation accuracy. The Python run reports a Starlette TestClient/httpx deprecation warning, not a failing test; the existing HTTP client stack was not replaced merely to suppress it.

## Translation checks

- Exact source segmentation is lossless, bounded to 1600 characters per slice and 18000 characters per page. Stored original text is never taken from a model response or overwritten.
- Chinese/English targets, academic/clear styles, glossary limits and untrusted-source instructions are tested. These are protocol and prompt checks, not proof of model compliance.
- Missing, repeated, mismatched, blank or extra structured fields are rejected. Unsupported languages/styles, invalid pages and oversized terminology fail validation.
- Isolated endpoint tests use real SQLAlchemy queries over temporary SQLite tables, with a deterministic fake chat provider. They verify ownership, original-source preservation, missing pages, and refusal of Demo/missing-key requests. The fake provider rejects any embedding call.
- Parsed pages remain translatable after indexing failure. Active parsing cannot translate stale pages; other learning tools do not become falsely ready.
- Five jsdom component tests verify confirmation before requests, reuse of completed pages, new requests after terminology changes, stopping after the current page, preserving results after a later failure, export availability and Demo disabling. Model calls and the download helper are mocked.
- Real frontend/API checks exercise Chinese toolkit content, page ownership and refusal to simulate Demo translations.

## Conversion checks and visual inspection

- Logic tests cover file count/extension/byte limits, valid and invalid page ranges, image signature/dimension checks, aspect-preserving A4/image sizing, ZIP name collisions and safe archive paths.
- Runtime tests execute the actual conversion functions with native **Node canvas adapters** for browser Canvas/createImageBitmap and the PDF.js legacy Node renderer. Actual PNG, JPEG and WebP bytes are decoded and dimensions verified. Real sample PDF text is extracted for an exact selected page.
- Images become a genuine two-page PDF, are reopened with pdf-lib, then rendered and packaged as a two-image ZIP. Tests reject invalid PDF bytes, report OCR absence for image-only PDFs and respect cancellation before processing.
- A synthetic landscape/portrait fixture was saved outside the repository, inspected using `pdfinfo` and independently rendered with Poppler. Both PNG previews were visually reviewed: A4 orientation, intact aspect ratio, white margins and complete image content were confirmed. The sample PDF is 4442 bytes, has two pages, no encryption and no JavaScript.
- These previews validate generated document layout, not website layout. No website screenshot, real browser download, mobile memory profile or color-profile fidelity is claimed. Animation and metadata limitations are documented.

To reproduce optional conversion previews, set `CONVERSION_QA_DIR` to a dedicated temporary directory before `npm test`. The runtime test writes `images-roundtrip.pdf` and two PNG previews there. Otherwise fixtures remain in memory. Generated files are not committed.

## Retained safeguards

- Chinese remains the default interface language, with a Settings switch, preference persistence, blocked-storage fallback and cross-tab updates. UI language does not automatically translate user content.
- Eleven static React checks cover public pages, navigation, Settings, model guidance, source preservation, tools and translation setup. Literal UI translation keys and cached API errors are checked.
- Chinese IME-safe Enter, verbatim citations and fixed Chinese keyword aliases for the English Demo remain tested. Demo aliases are not machine translation.
- PDF.js remains locked at 6.3.289, beyond the fixed version in [Mozilla's advisory](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j). Worker, CMaps, fonts, ICC profiles and image decoders are served from the same dependency; HTTP tests compare the packaged bytes.
- Standalone asset copying, process cleanup, isolated test services and separate unit/API/UI collection are preserved.

## Local workflow exercised

The smoke test uses fresh temporary database/storage to check database health, eight-page sample processing, source-linked Demo answers, original PDF access, workspace isolation, study plans, flashcard scheduling, quiz grading and duplicate-submission protection. Ordinary uploads remain readable in Demo but refuse simulated AI. Only documents created by the test are removed, followed by 404 checks; no third-party model is contacted.

## Browser and real-provider limits

Earlier local Playwright execution stopped at browser launch with `Executable doesn't exist`. A subsequent cloud-browser attempt returned `ERR_CONNECTION_REFUSED` for the isolated Settings preview; no application page loaded. These environment failures are neither UI passes nor evidence of an application regression. This update does not claim those blockers have been fixed.

Prepared desktop/mobile tests now also cover a real image-to-PDF download without an upload request and the reader's refusal to simulate Demo translation. On a machine with supported browser dependencies, run `npm run build`, `npx playwright install chromium`, then `npm run test:e2e`. Mobile tests emulate an iPhone-sized viewport in Chromium, not Safari/iPhone hardware. Reports and optional screenshots/traces go to `apps/web/playwright-report/` and `apps/web/test-results/`; they are not committed.

Still pending:

- Real browser interaction, downloads, cancellation, layout and accessibility across desktop/mobile devices.
- Real chat/embedding providers and English/Chinese academic translation quality, including terminology, negation, numbers, formulas and two-column extraction order.
- Native PostgreSQL under concurrent workers and production quota enforcement.
- Fresh Windows/macOS installation, Docker packaging, public deployment, backup/restore and abuse prevention.
- OCR, durable translation history, office-format conversion and translated-PDF layout reconstruction are not implemented.

The banner remains a vector illustration, not a deployment screenshot. See [Roadmap](roadmap.md) and [Security](../SECURITY.md).
