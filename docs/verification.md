# Verification record

Checked on 2026-09-01 in the project workspace. Results describe this alpha snapshot, not a production certification.

| Check | Result |
| --- | --- |
| Next.js production build | Passed; all frontend routes compiled |
| TypeScript | Passed (`npm run typecheck`) |
| Frontend lint | Passed without warnings (`npm run lint`) |
| Frontend unit tests | 5 passed (`npm test`) |
| Backend unit tests | 17 passed (`python -m pytest apps/api/tests`) |
| Local API workflow | Passed with a temporary PGlite database, API and worker |

## Local workflow exercised

`python scripts/smoke_test.py --start-services` starts fresh temporary services and checks:

1. Database health and pgvector availability.
2. Processing the original sample into eight pages and grounded knowledge points.
3. Original PDF access and refusal of another workspace's read/delete requests.
4. Demo Q&A with a nonempty citation whose excerpt actually exists on the referenced page.
5. Study-plan creation, task completion and dashboard updates.
6. Flashcard creation, review scheduling and rejection of a duplicate same-day review.
7. Five-question quiz generation, hidden answers before submission, grading and duplicate-submission rejection.
8. A regular PDF upload remains readable but cannot use simulated AI in demo mode.
9. Renaming and deletion of only the test's own documents, followed by 404 checks.

No third-party AI service was contacted. Temporary test documents and test storage were removed after this check.

## Not yet verified

- Browser end-to-end tests, visual screenshots, PDF canvas rendering and accessibility on real devices.
- Chat and embedding output from real OpenAI-compatible or Ollama providers.
- Native PostgreSQL under concurrent worker load.
- Docker packaging, public deployment, production backup/restore and abuse prevention.
- A fresh installation on Windows or macOS.

The banner is an original vector diagram, not a fabricated screenshot of a running deployment. See [Roadmap](roadmap.md) and [Security](../SECURITY.md) for remaining work.
