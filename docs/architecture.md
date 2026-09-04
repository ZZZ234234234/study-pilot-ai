# Architecture

Server-backed features use the Next.js `/api/v1/*` proxy. The proxy forwards requests to a fixed server-side `API_INTERNAL_URL`; it does not take arbitrary upstream URLs from the user. File conversion is a separate browser-local path: input bytes are not submitted to this proxy or a third-party converter.

```mermaid
flowchart TD
  A[Browser: PDF and learning workspace] --> B[Next.js same-origin proxy]
  B --> C[FastAPI: ownership and validation]
  C --> D[PostgreSQL and pgvector]
  C --> E[Private PDF storage]
  F[Background worker] --> D
  F --> E
  F --> G[Demo or configured model provider]
  C --> G
```

## Interface language

The initial server-rendered interface is Simplified Chinese (`zh-CN`). Settings offers Chinese and English without changing routes or mounting a new application tree. `LocaleProvider` subscribes to a small external store using React's `useSyncExternalStore`; the preference is saved under `studypilot:locale` in browser localStorage. Unknown values fall back to Chinese. Storage failures retain a per-visit choice, and storage events synchronize open tabs.

Chinese interface copy is the lookup key in `apps/web/src/lib/translations.ts`; English copy and parameterized labels live in the same dictionary. React text rendering escapes inserted values. Stable API enums, model identifiers, PDF text, document titles, citations and stored learning content are never used as translation keys. Common structured errors are localized at presentation time, so one cached API error can be displayed in either language. Dates use the active locale; the document's language attribute and browser title follow the preference after hydration.

The setting does not request document translation or change the provider configuration. It does not remount form components, mutate learning data or reissue AI-generation requests. Preference/store unit tests and static React rendering checks are distinct from the prepared browser interaction tests.

## Reading layout

`ReadingWorkspace` keeps the PDF and assistant in one stable React tree. Browser-viewport fullscreen is a fixed, labelled dialog-like reading surface, not a second PDF viewer or the native browser Fullscreen API. A shared focus-layer hook makes surrounding elements inert, traps keyboard focus, locks background scrolling, and restores prior focus/inert/scroll state on exit or unmount. The same hook serves the mobile navigation drawer.

The navigation defaults to collapsed. A fixed, translucent left-edge trigger remains reachable when the page scrolls. It opens the original navigation, including API connections and Settings. The normal reading page uses a compact header and flexes the workspace into remaining viewport height, with a minimum height for short screens. Validated `studypilot:navigation` and `studypilot:assistant-layout` localStorage preferences use `useSyncExternalStore`, support blocked-storage visit-only fallbacks and cross-tab changes, and contain no document or AI content. Geometry remains in component memory. Mobile reading initially hides the assistant; source citations reveal the PDF without discarding the mounted assistant state.

The default desktop divider favors the PDF (about 70%, constrained to usable pane widths). Pointer capture drives horizontal division, floating-window movement and anchored corner resizing; keyboard arrows support each operation. Window geometry is clamped to the visual viewport, including resize/rotation and on-screen-keyboard changes. Fullscreen always gives the entire reading surface to the PDF, with an optional floating assistant rather than a reserved docked column.

PDF clicks or the fullscreen control expand the source image without re-uploading the document. PDF.js zoom is 50–300% relative to fit-to-width; raster allocation is limited to 16 million pixels and an 8192-pixel edge by reducing output pixel density without shrinking CSS zoom. A non-centering overflow surface leaves both page edges scrollable. Source text and stored answers are not translated, rewritten or reordered by layout controls.

The chat and translation panels remain mounted across tab and layout switches, preserving unsent questions, in-flight requests and temporary translation results. Hiding the assistant does not cancel a model request. Refresh/navigation still discards unsaved client-only content. Geometry itself is client-side; the separate API-profile feature below adds persistence and a migration.

## Private model connections

`/app/models` manages `/ai/profiles`. A profile has an owner, nickname, provider, allowlisted canonical endpoint, exact model ID, private key and revision. `User.ai_profile_id` is the workspace default. Writes lock the owning user row, limit connections to thirty and check ownership. Public serializers explicitly enumerate safe fields; do not use `row_dict` for `AIProfile`. Keys are currently unencrypted in the backend database; protect the local `data/` directory, database and backups. User-entered keys travel through the same-origin proxy to the backend once, not to browser storage or public code. Ollama and LM Studio may store an empty key; cloud providers require one.

`0002` adds profiles, the default preference and immutable `ChatMessage.model_label/retrieval` snapshots. It checks existing columns because the original `0001` migration uses current ORM metadata for fresh installs. Old records are preserved. Deleting or renaming a connection does not relabel historical answers. This is still an anonymous-cookie workspace, not account-based credential recovery.

The server-owned provider catalog contains nineteen OpenAI-compatible direct providers, gateways and local runtimes. Cloud providers accept only exact curated official HTTPS endpoints; local runtimes accept only exact loopback addresses. Regional services expose a finite endpoint selector, not an editable arbitrary URL. The adapter does not follow redirects, read environment proxies or automatically retry billable calls. API errors exclude upstream bodies and credentials. Where a provider documents a compatible `/models` endpoint, users may query it with their own credentials; otherwise the UI uses dated references or manual exact-ID entry without claiming account access. Provider metadata also controls API-key requirements, token-limit parameter names and whether `response_format` is sent. A user-triggered connection test checks the draft's exact model and JSON output with a 160-output-token cap and no PDF text. Saving and testing are separate actions.

Q&A and translation accept an owned `profile_id`; `server` explicitly chooses the old `.env` provider, and omission uses the workspace default when present. Selecting a new profile never changes embeddings. Profile Q&A retrieves with AI-derived bilingual query terms plus local BM25-style lexical scoring, not vector search. Short documents within the retrieval limit go directly to answering. Longer documents typically need a term-generation call and an answer call; irrelevant retrieval may miss evidence. Only retrieved document-owned chunk IDs can become stored citations. A deleted explicit selection fails rather than falling back to another provider. Original knowledge extraction/quiz workers retain server configuration; profiles do not make these features falsely ready.

The chat panel keeps history/drafts while switching. Confirmation is scoped to the selected profile revision. UI requests send this revision; if another page has edited the connection, the server rejects a stale request before sending text to a provider. Translation results are partitioned by profile/revision and options; selecting a new provider does not reuse the previous provider's cached output. No real provider secrets are required by automated tests.

## Translation

The reader's Translation tab posts one page at a time to `/documents/{id}/translate`. The API verifies workspace and profile ownership, checks page readiness, retrieves authoritative page text and sends it with terminology preferences to the selected JSON-compatible chat provider. It never uses embeddings. If parsing completed but indexing subsequently failed, the original reader and translation remain accessible without treating partially generated learning material as ready.

Each page is split into exact source slices of at most 1600 characters, bounded by an 18000-character page limit. Segment IDs must be returned once each in their original order; missing, repeated, extra or blank structured results are rejected. Source text is always copied from the stored page, never accepted from a provider response. These checks establish structure and provenance, not semantic translation accuracy. The translation task requests its explicitly chosen output language independently of interface locale.

The client sends at most ten pages sequentially per batch after explicit confirmation. Stopping prevents future page requests but does not recall an in-flight model request or its cost. Completed pages are cached only in component memory under profile/revision/page/target/style/glossary keys and can be exported as bilingual TXT. Switching study tabs retains the mounted translation component; leaving the document or refreshing discards its cache. Translations themselves are not persisted in the database. A process-local two-slot semaphore bounds concurrent translation calls; it is not a distributed quota system.

## Local conversion

`/app/tools` lazily loads pdf-lib and fflate for file creation/ZIP packaging and reuses the self-hosted PDF.js assets for PDF rendering/text extraction. Canvas handles image encoding and applies white backgrounds for JPEG. Images are fitted to A4 or their own aspect ratio, not stretched. ZIP members use bounded, sanitized, numbered names to prevent collisions and path traversal.

Files are extension/size checked; supported image signatures and dimensions are checked before decoding. Batches are limited to 20 images or one PDF (300 pages maximum), 20 MB per file, 50 MB total input, 100 MB output and 24 million decoded pixels per image/page. PDF image exports are limited to 20 selected pages and rendered sequentially, releasing canvases/pages afterward. Abort requests interrupt between steps and destroy active PDF tasks. These limits reduce resource use but do not make malicious file decoding a hardened sandbox.

No conversion upload endpoint exists. Browser-local conversion does not imply that AI translation is local: that depends on the configured model endpoint. Metadata, color profiles and animation are not preserved; OCR, office-document layout conversion and translated-PDF layout reconstruction are outside the implemented scope.

## Document lifecycle

Uploads create a queued document. The worker claims jobs, extracts page text with pypdf, creates page-bounded overlapping chunks, generates embeddings, and stores grounded knowledge points. Progress is committed during processing. Failures remain visible and can be retried. Ordinary uploads in demo mode retain reading/search capabilities without simulated AI knowledge.

Documents move through `queued → parsing → indexing → ready`, with `failed` as a retryable terminal state. A stale processing timeout protects against abandoned jobs, but this is not a production-grade distributed job queue.

## Retrieval and citations

An embedding signature records the provider, endpoint and embedding model. A mismatch requires reindexing. Retrieval filters by document ID before cosine-distance ranking. Answer source IDs are checked against retrieved chunks; citation page numbers come from stored document chunks rather than trusting model-provided page numbers.

The demo embedding is a deterministic hashing feature vector, not a semantic language model. Its answers are explicitly labelled source excerpts.

## Learning state

Knowledge points feed study plans, flashcards and quizzes. Plans reserve daily capacity and schedule later reviews. Flashcards store ease, interval, review count and next due date. Quiz answers stay server-side until submission; short answers use transparent keyword matching, not expert grading.

## Development vs production

PGlite provides PostgreSQL-compatible local persistence with a pgvector extension. Its socket multiplexes connections and is not a substitute for validating native PostgreSQL concurrency. The initial migration currently builds from SQLAlchemy metadata; freeze immutable migration definitions before a stable production release.

The repository deliberately has no payment system, OAuth sign-in, organization management, OCR or multi-document chat in this preview.
