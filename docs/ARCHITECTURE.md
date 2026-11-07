# Grantly 3.0 architecture

## Product boundary

Grantly is a client-only scholarship planning workspace for Indian students. It opens directly to useful product functionality; the cinematic tour is an optional `/tour` route. It does not submit government applications, verify documents, guarantee awards or send profile data to a server.

## Layers

- `types.ts`: shared domain contracts, including explicit nulls and tri-state screening results.
- `public/data/scholarships.json`: reviewed static catalogue, independent of UI and persistence.
- `services/catalog.ts`: runtime validation and replaceable async repository. `CatalogProvider` owns loading, timeout, error/retry and cancellation. A future API can implement the same interface.
- `services/documents.ts`: browser IndexedDB blob storage, format/extension checks, 10 MB per-file and 50 MB aggregate limits. Listings expose metadata; blobs are read only for download.
- `state/`: immutable reducer, versioned localStorage persistence/migration, explicit demo preset, backup validation and app actions. Old demo tracking is not silently migrated into a real catalogue.
- `lib/`: pure date, matching, selection, export and deterministic assistant functions. Dates use Asia/Kolkata calendar-day semantics. CSV neutralizes spreadsheet formulas; ICS uses all-day events and a one-day preparation alarm.
- `pages/` and `components/`: route-level screens and reusable accessible controls. React Router provides real URLs and history; Discover filters live in query parameters. Scholarship details use stable slugs.
- `styles.css`: shared design tokens, light default, optional dark theme, responsive navigation and mobile application-stage switcher. Primary interactive controls have at least 44px targets.

## Persistence and privacy

Profile, checklist, application stages, notes, reminders and theme use localStorage schema v3. Uploaded files use a separate IndexedDB database. JSON backups contain structured workspace data, **not file blobs**. Files are unencrypted local browser storage, not cloud backup; users must keep originals. Clear-data removes both stores. Browser storage failures are surfaced instead of pretending a save succeeded.

## Failure behavior

Invalid catalogue responses fail closed with retry. Unknown URLs have a recovery screen. Lazy route failures have an error boundary. Missing profile values produce unknown screening results, not false eligibility. Unknown/conflicting deadlines are not rendered as countdowns. A stale-catalogue banner prompts re-checking official sources.

## Verification

Vitest covers pure logic, storage, catalogue validation, IndexedDB quotas, exports, dialogs and assistant behavior. Playwright runs production-preview workflows on desktop and mobile, including persistence, deep links, upload/download/delete, CSV export, overflow checks and axe WCAG A/AA checks. Lighthouse runs against a separate production preview with performance/accessibility/best-practice/SEO budgets. These are local measurements, not a claim about an external evaluator's score.
