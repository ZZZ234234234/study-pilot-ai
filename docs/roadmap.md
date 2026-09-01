# Roadmap

## Included in the alpha implementation

- Responsive frontend routes and light/dark themes.
- PDF upload, page extraction, chunking, asynchronous processing and search.
- Demo, OpenAI-compatible and Ollama-compatible provider adapters.
- Source-linked knowledge points and document-scoped Q&A.
- Study plans, flashcards, spaced reviews and quizzes.
- Anonymous browser workspace ownership and document deletion.
- Original eight-page learning sample and local PGlite quick-start.
- Isolated Playwright API tests with a temporary demo stack; separate desktop/mobile browser suites are prepared but not yet browser-verified.
- Self-hosted PDF.js worker, fonts and decoding assets, plus a Node canvas compatibility check.

## Before a production release

- Run and complete the prepared browser end-to-end suites on a working Chromium installation, then review accessibility and real-device/mobile visuals.
- Exercise real chat/embedding providers with explicitly supplied credentials.
- Validate native PostgreSQL transactions and concurrent workers.
- Freeze immutable Alembic migrations; test upgrades and rollback on native PostgreSQL.
- Add and verify Docker Compose, CI integration tests and deployment documentation.
- Add real application screenshots and a deployment smoke-test record.
- Harden anonymous-upload abuse protection, resource limits and data retention.
- Review prompt-injection defenses, citation quality and model-output validation.

## Later, if useful

- Chinese interface localization.
- Recoverable accounts and cross-device learning state.
- OCR with explicit cost and privacy controls.
- Multi-document retrieval and exportable learning notes.

Items here are plans, not claims of completed work or delivery dates.
