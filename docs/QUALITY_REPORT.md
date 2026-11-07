# Grantly 3.0 quality report

Measured locally on **7 November 2026** against the production build (`npm run build` + `npm run preview`). These results describe this repository and test environment; they are **not** a prediction or guarantee of the external evaluator's score.

## Gates

| Check | Result |
| --- | --- |
| ESLint (`--max-warnings 0`) | Pass |
| TypeScript strict typecheck | Pass |
| Catalogue validation | 15 source-linked records; unique IDs/slugs; no generated deadlines |
| Vitest unit/component suite | **56 passed**, 15 files |
| Core coverage | **83.03% statements · 77.73% branches · 77.53% functions · 89.42% lines** |
| Coverage thresholds | Pass: statements ≥80, branches ≥75, functions ≥75, lines ≥85 |
| Dependency audit (`--audit-level=moderate`) | **0 vulnerabilities** |
| Production build | Pass |
| Playwright desktop + mobile | **17 passed**, 1 intentionally skipped desktop-only case |
| Axe WCAG A/AA browser checks | Pass on main routes, dark theme, profile dialog and details dialog |
| Horizontal overflow checks | Pass on tested desktop/mobile routes |
| `git diff --check` | Pass |

Browser coverage includes profile setup, URL filters and reload persistence, tracking, deep links/back navigation, stacked-dialog prevention, local upload/download/delete, mobile stage switching, CSV export, backup round trip, clear-data confirmation, catalogue failure/retry, unknown-route recovery and reduced-motion tour behavior.

## Lighthouse

Production-preview mobile audit, simulated throttling, Lighthouse 13.6 / Chromium 153. The reproducible script is `npm run test:lighthouse`; CI runs it against port 4174.

| Category | Score | Budget |
| --- | ---: | ---: |
| Performance | **100** | ≥90 |
| Accessibility | **100** | ≥95 |
| Best Practices | **100** | ≥95 |
| SEO | **100** | ≥95 |

| Metric | Measured | Budget |
| --- | ---: | ---: |
| Largest Contentful Paint | **1.51 s** | ≤2.5 s |
| Cumulative Layout Shift | **0** | ≤0.1 |
| Total Blocking Time | **55 ms** | ≤200 ms |

The first audit exposed a footer layout shift and borderline blocking time. Eager-loading the product overview while keeping other pages/tour lazy, plus reserving fallback height, brought CLS to zero and improved the lab performance result. This is a lab measurement, not field p75 INP data.

Evidence: `docs/audits/summary.json`, `docs/audits/lighthouse.report.json`, `docs/audits/lighthouse.report.html`.

## Bundle and screenshots

All emitted JS: 289,382 bytes raw / **97,281 bytes gzip**. All emitted CSS: 45,043 bytes raw / **10,719 bytes gzip**. The optional tour/engine remains split from the initial product route.

- `docs/screenshots/workspace-desktop.png`
- `docs/screenshots/workspace-mobile.png`

## Remaining product boundaries

- The catalogue is a reviewed static snapshot, not a live government API. Official sources can change or conflict; unknown dates remain unknown and a stale-data banner appears after 30 days.
- Eligibility is provisional screening. Institution approval, percentile, admission year, application mode and document authenticity still require official verification.
- Document files are local, unencrypted browser storage with explicit quotas; JSON backups do not include file blobs.
- The assistant is deterministic and local, not a generative AI service. Grantly does not submit applications or send notifications while closed.
- The external scoring rubric/environment is outside this repository, so an exact **100%** external score cannot be guaranteed.
