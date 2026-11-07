# Grantly 3.0 — Scholarship Discovery & Application Planner

Grantly is a private, product-first workspace for Indian students: discover source-linked scholarships, understand provisional eligibility, track applications, prepare documents and export your plan. The cinematic WebGL tour is still available, but it is optional at `/tour` rather than a gate before the product.

> **Important:** Grantly is not an official scholarship portal. It does not submit applications, verify documents or guarantee awards. The catalogue is a dated, curated snapshot, not a live feed. Always confirm current rules, amounts and dates on the official portal. The local assistant is deterministic software, not a generative AI adviser.

## What changed in 3.0

- **Workspace first:** `/` opens the usable product immediately; real routes, browser history, shareable Discover filters and scholarship deep links.
- **Honest data:** 15 source-linked records with review dates and explicit unknown/conflicting deadlines. No generated demo deadlines. See [data provenance](docs/DATA_SOURCES.md).
- **Explainable screening:** matched, mismatch and unknown criteria; missing answers never silently pass. Percentage marks are not treated as percentiles.
- **Application workflow:** four-stage pipeline, notes, personal preparation dates, CSV export and ICS calendar export with a one-day alarm.
- **Local document vault:** real PDF/JPEG/PNG upload, download and deletion through IndexedDB; 10 MB per file and 50 MB total. Files are unencrypted and remain in this browser.
- **Privacy controls:** explicit demo confirmation, validated JSON backup import/export, clear-data confirmation and removal of both localStorage and IndexedDB data.
- **Mobile and accessibility:** labelled navigation, 44px primary targets, mobile stage switcher, focus-contained dialogs, light default, optional dark theme and reduced-motion support.
- **Quality gates:** unit/component tests, desktop/mobile Playwright workflows, axe checks and reproducible Lighthouse budgets in CI.

## Quick start

Requires Node.js **22.22.2+** and npm.

```bash
npm ci
npm run dev          # http://localhost:5173
```

Production preview:

```bash
npm run build
npm run preview      # http://localhost:4173
```

The server binds to `0.0.0.0` for container previews. Browser-facing requests use relative URLs; there is no backend or localhost API dependency.

## Use the workspace

1. **Set up a profile** for provisional screening. Name and interests are optional; do not enter Aadhaar, bank numbers, passwords or OTPs.
2. **Find scholarships** at `/discover`. Search, filter, sort and open details. Filter state is stored in the URL, so links can be shared or reloaded.
3. **Save and track** opportunities. Move them through Saved → In progress → Submitted → Awarded using the stage selector. Add notes and a personal preparation date.
4. **Prepare documents** in `/vault`. Mark checklist items ready and optionally keep a local file copy. Upload files only to the official portal when applying.
5. **Export your plan** as CSV or import the ICS file into your calendar. In-app reminders do not send push notifications while Grantly is closed.
6. **Back up or clear data** from Profile & privacy. JSON backups contain planner data, not document blobs. Clearing data affects this browser only.
7. **Explore the optional tour** at `/tour`, or open the practical guide from the workspace.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Overview, onboarding and workspace metrics |
| `/discover` | Search/filter/sort; `q`, `fit`, `level`, `funding`, `sort` query parameters |
| `/scholarships/:slug` | Shareable scholarship details |
| `/applications` | Application pipeline, notes, reminders and exports |
| `/deadlines` | Published dates, unknown-date list and calendar export |
| `/vault` | Document checklist and local file storage |
| `/assistant` | Deterministic on-device planning assistant |
| `/tour` | Optional cinematic introduction |

## Quality commands

```bash
npm run lint
npm run typecheck
npm run validate:data
npm run test:coverage
npm audit --audit-level=moderate
npm run build

# Browser tests against the production preview
npx playwright install --with-deps chromium
npm run test:e2e

# Lighthouse: start a production preview first, then audit it
npm run preview -- --port 4174
AUDIT_URL=http://127.0.0.1:4174/ npm run test:lighthouse
```

For an existing Chromium binary, set `CHROME_PATH` and any required library path. CI installs Playwright Chromium normally. Lighthouse writes JSON/HTML evidence under `docs/audits/`; the script fails if category scores or core metric budgets regress.

Budgets: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥95; LCP ≤2.5 s, CLS ≤0.1, TBT ≤200 ms. These are lab targets for the production build, not field p75 measurements or a promise about an external evaluator. See [the latest quality report](docs/QUALITY_REPORT.md).

## Architecture

The project uses **React 18**, TypeScript strict mode, React Router 7 and Vite 8. The UI is separated from domain logic, persistence and catalogue/document services.

- `src/services/`: validated async catalogue repository and IndexedDB document vault.
- `src/state/`: immutable reducer, versioned storage/migration, explicit demo preset and contexts.
- `src/lib/`: pure matching, dates, selectors, exports and assistant logic.
- `src/pages/`, `src/components/`: route screens and accessible reusable controls.
- `src/cinema/`: lazy optional WebGL tour with pause, reduced-motion and fallback behavior.
- `public/data/scholarships.json`: reviewed catalogue snapshot.

Read [architecture details](docs/ARCHITECTURE.md) and [source/maintenance notes](docs/DATA_SOURCES.md).

## Deployment

Build command: `npm run build`. Output directory: `dist`. `vercel.json` supplies SPA rewrites while preserving static data/assets, catalogue revalidation and basic security headers. Any static host must rewrite unknown application paths to `index.html` and serve `/data/scholarships.json` as a real JSON asset.

CI runs lint, typecheck, data validation, coverage, dependency audit, production build, desktop/mobile browser tests and Lighthouse. GitHub Actions and Vercel are the intended deployment path; no server credentials are required in the client.

## Privacy and limitations

- Profile/planner data: localStorage schema v3. Document blobs: separate IndexedDB database. Neither is encrypted or synced.
- JSON backups exclude files. Keep original documents elsewhere, especially on shared devices.
- Catalogue data can become stale. A warning appears after 30 days; refresh retries the static asset and does not claim live government updates.
- Matching does not verify institution approval, admission year, percentile, concurrent awards, application mode or document authenticity.
- The assistant answers from local state and catalogue data. It does not call an AI API.

## License

MIT — see [LICENSE](LICENSE).
