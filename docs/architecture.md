# Architecture

The browser talks only to the Next.js `/api/v1/*` proxy. The proxy forwards requests to a fixed server-side `API_INTERNAL_URL`; it does not take arbitrary upstream URLs from the user.

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
