# Roadmap

## Included in the alpha implementation

- Responsive frontend routes and light/dark themes.
- Default Simplified Chinese interface with a persistent Chinese/English choice in Settings, localized API feedback and dates, Chinese input-method-safe question submission, and actionable model-setup guidance.
- PDF upload, page extraction, chunking, asynchronous processing and search.
- Demo, OpenAI-compatible and Ollama-compatible provider adapters.
- Source-linked knowledge points and document-scoped Q&A.
- Explicit Chinese/English page translation with academic/clear styles, glossary preferences, verbatim source comparison, ten-page sequential batches, stop-after-current-page and bilingual TXT export. Real-provider quality validation is still pending.
- Reading-first PDF workspace: collapsible navigation, browser-viewport fullscreen, 50–300% zoom, docked/floating/hidden assistant, bounded drag/resize, keyboard controls and retained in-document drafts. Real-browser interaction and accessibility acceptance are still pending.
- Browser-local images-to-PDF, PDF-to-images, PNG/JPG/WebP conversion and PDF-to-TXT with ordering, page ranges, output quality, ZIP packaging and resource limits.
- Study plans, flashcards, spaced reviews and quizzes.
- Anonymous browser workspace ownership and document deletion.
- Original eight-page learning sample and local PGlite quick-start.
- Fixed Chinese keyword aliases for questions about the original English demo; evidence and stored user content remain in their original language.
- Isolated Playwright API tests with a temporary demo stack; separate desktop/mobile browser suites are prepared but not yet browser-verified.
- Self-hosted PDF.js worker, fonts and decoding assets, plus a Node canvas compatibility check.

## Before a production release

- Run and complete the prepared browser end-to-end suites on a working Chromium installation, then review accessibility and real-device/mobile visuals.
- Exercise real chat/embedding providers with explicitly supplied credentials.
- Evaluate real English/Chinese academic translation: terminology consistency, negation, numbers, formulas and two-column extraction order; verify browser conversion downloads, cancellation and mobile memory limits.
- Validate native PostgreSQL transactions and concurrent workers.
- Freeze immutable Alembic migrations; test upgrades and rollback on native PostgreSQL.
- Add and verify Docker Compose, CI integration tests and deployment documentation.
- Add real application screenshots and a deployment smoke-test record.
- Harden anonymous-upload abuse protection, resource limits and data retention.
- Review prompt-injection defenses, citation quality and model-output validation.

## Later, if useful

- Recoverable accounts and cross-device learning state.
- OCR with explicit cost and privacy controls.
- Durable translation history, document-wide terminology consistency and translated-PDF layout reconstruction, only after validating the current reading workflow.
- Office-document conversions where format fidelity, licensing and operating costs can be handled transparently.
- Multi-document retrieval and exportable learning notes.

Items here are plans, not claims of completed work or delivery dates.
