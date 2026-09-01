# Verification record

Checked on 2026-09-01 in the project workspace. Results describe this alpha snapshot, not a production certification.

| Check                          | Result                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Locked dependency installation | Passed (`npm ci`)                                                                                    |
| Next.js production build       | Passed, including standalone static asset packaging                                                  |
| TypeScript                     | Passed (`npm run typecheck`)                                                                         |
| Frontend lint                  | Passed without lint warnings (`npm run lint`)                                                        |
| Formatting                     | Passed (`npm run format:check`); styles split without changing original rules or cascade order       |
| Frontend unit tests            | 8 passed (`npm test`); Vitest collects only unit tests                                               |
| Backend lint                   | Passed (`python -m ruff check apps/api scripts`)                                                     |
| Backend unit tests             | 17 passed (`python -m pytest apps/api/tests`)                                                        |
| PDF.js Node canvas             | All 8 original sample pages rendered with visible pixels and extractable text (`npm run test:pdf`)   |
| API end-to-end tests           | 14 passed against the production frontend, temporary API, worker and PGlite (`npm run test:e2e:api`) |
| Local API workflow             | Passed (`python scripts/smoke_test.py --start-services`)                                             |
| Production dependency audit    | 0 reported vulnerabilities (`npm audit --omit=dev`)                                                  |
| Browser test collection        | 6 desktop/mobile scenarios collected separately from the 14 API cases                                |
| Browser test execution         | Blocked before page load: Playwright Chromium executable is not installed; not a pass                |

## Fixes included in this snapshot

- Upgraded the lockfile's PDF.js from 5.7.284 to 6.3.289, beyond the fixed version in [Mozilla's advisory](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j). The earlier dependency advisory did not demonstrate that this canvas-only application was exploitable. The npm audit result is not a whole-application security assessment.
- Self-hosted matching worker, CMaps, standard fonts, ICC profiles and image decoders. The HTTP tests compare worker/font/decoder bytes with the installed package and check the homepage's compiled CSS/JavaScript.
- Added distinct Vitest and Playwright collection, API/desktop/mobile projects, correct CLI argument forwarding, and fresh temporary demo services. Tests never use real AI credentials or normal development data.
- Added standalone resource copying to the build and a compatible production start command. Startup failures now propagate instead of being reported as successful shutdowns; supervisors clean up their child services.
- Added explicit Prettier configuration, ignored generated assets and split the compressed stylesheet into nine readable, ordered files.

The Node canvas check exercises the upgraded rendering engine, **not** DOM rendering, actual browsers, all uploaded PDF variants or visual design acceptance. The browser attempt used `npm run test:e2e -- --project=desktop --grep 'sample onboarding' --max-failures=1`; it stopped at browser launch with `Executable doesn't exist`. No browser screenshot or successful UI interaction is claimed. Browser acquisition had also failed during the preceding audit, so the missing browser was not treated as an application regression.

To run the prepared UI suites on a machine with supported browser dependencies: install project dependencies, run `npm run build`, `npx playwright install chromium`, then `npm run test:e2e`. The mobile project is Chromium device emulation, not a Safari/iPhone hardware test. Local HTML reports and optional screenshots/traces are generated under `apps/web/playwright-report/` and `apps/web/test-results/`; these generated files are intentionally not committed.

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
