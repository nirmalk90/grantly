# Grantly · New Era — A Cinematic Scholarship Voyage

A cinematic, scroll-driven WebGL experience that opens into a private scholarship
planning workspace. Grantly combines explainable matching, a deterministic
on-device assistant, an application pipeline, deadline tracking, and a document
readiness checklist.

> **Demo data notice:** Scholarship entries, award figures, and deadlines are
> illustrative samples. Deadlines are generated relative to today in
> `Asia/Kolkata`. Always verify eligibility, amounts, and dates on the official
> scheme portal before applying.

---

## Quick Start

Requires Node.js **22.22.2+** (see `.nvmrc`).

```bash
npm ci
npm run dev          # Vite dev server on 0.0.0.0:5173
npm run lint         # ESLint: zero errors/warnings
npm run typecheck    # TypeScript strict mode
npm test             # Vitest unit/component tests
npm run test:coverage
npm run build        # Production bundle into dist/
npm run preview      # Serve the production build on 0.0.0.0:4173
```

### Try the workspace quickly

1. **Cinematic landing:** Scroll through Ignition → Drift → Orbit → Galaxy → Launch,
   or choose **Enter workspace**. Use **Pause motion** to stop the animation.
2. **Demo preset:** Load the sample student profile and pipeline from the sidebar
   or profile editor.
3. **Discover:** Search, filter with pills, sort, and open a scholarship details
   dialog. Outbound portal links open in a new tab.
4. **Assistant:** Ask about eligibility, deadlines, missing documents, or a
   statement of purpose. Responses are computed locally and synchronously.
5. **Applications:** Move cards through Saved → In progress → Submitted → Awarded.
   Document checkboxes stay in sync with the Vault.
6. **Privacy:** Use **Clear saved data** in the profile editor or command palette
   on shared devices.

---

## Tech Stack

- **React 18 + TypeScript strict mode**
- **Vite 8** build pipeline with lazy workspace/page chunks and split CSS
- **Hand-rolled WebGL particle engine** (`src/cinema/engine.ts`) with adaptive
  frame budget, pause control, reduced-motion support, and context-loss fallback
- **Vitest + Testing Library + axe-core** for unit, component, and accessibility checks
- **ESLint 9** flat config with TypeScript, React Hooks, JSX a11y, and React Refresh rules
- No runtime dependencies beyond React

---

## Features

| Area | Highlights |
| --- | --- |
| **Cinematic intro** | Five scroll-driven acts, chapter navigation, skip/replay, pause motion, WebGL fallback |
| **Dashboard** | Eligible matches, open deadlines, relevant document readiness, pipeline metrics |
| **Discover** | Explainable weighted matching, search, filter pills, sorting, empty-state recovery |
| **Assistant** | Deterministic local intent engine for deadlines, documents, eligibility, and SOP drafts |
| **Applications** | Four-stage Kanban with per-card document checklists and official portal links |
| **Deadlines** | Timezone-aware calendar-day countdowns, urgency tags, empty state, one-click tracking |
| **Vault** | Document readiness checklist synced across cards and dialogs; no uploads or verification |
| **Command palette** | Ctrl/⌘ + K, keyboard navigation, single tab stop, focus containment |
| **Theming** | Dark/light themes with improved contrast and persisted preference |
| **Persistence** | Versioned, runtime-validated localStorage with recovery and unavailable-storage notices |
| **Privacy controls** | Clear saved profile/tracker/checklist; local-only processing disclosure |
| **Print** | Print-friendly pipeline, checklist, and chat styles |

---

## Architecture Notes

- `src/lib/selectors.ts` centralizes derived eligibility, deadline, tracking, and readiness calculations.
- `src/lib/dates.ts` interprets deadline calendar days in `Asia/Kolkata` and formats dates deterministically.
- `src/state/reducer.ts` is a pure reducer; `src/state/storage.ts` validates persisted data before hydration.
- `src/state/AppState.tsx` splits state, actions, and toast contexts to reduce unnecessary re-renders.
- `src/Workspace.tsx` manages one overlay at a time and makes the background inert while a dialog is open.
- `src/components/useDialog.ts` provides shared focus containment, Escape dismissal, scroll locking, and focus restoration.
- The assistant is **not** a generative AI service. It is a deterministic, on-device intent engine.

---

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm audit --audit-level=moderate
npm run build
```

CI runs these gates on Node.js 22 for pushes and pull requests to `main`/`master`.

### Test coverage focus

- Date/timezone boundaries and deadline labels
- Matching weights, eligibility boundaries, and deterministic ranking
- Sanitization and persisted-state validation/recovery
- Reducer transitions and privacy clearing
- Assistant intent routing and targeted SOP drafts
- Dialog focus restoration, palette keyboard behavior, and clipboard failure handling
- Workspace accessibility checks with axe-core

Core Web Vitals should be measured against the production build on throttled
mobile hardware. Target p75 budgets: **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1**.

---

## Accessibility

- Semantic landmarks, skip link, labelled navigation, and focus-visible outlines
- One dialog/palette overlay at a time; background is inert while open
- Focus containment and restoration, Escape/backdrop dismissal
- Command palette uses a combobox/listbox pattern with one tab stop and active-option scrolling
- Live regions for assistant log, toasts, filters, and empty states
- Reduced-motion support, pause control, and non-WebGL fallback
- Improved light-theme contrast and explicit accessible names for icon-only/mobile controls

---

## Security & Privacy

- Content-Security-Policy meta restricts scripts, styles, images, fonts, connections, objects, base URI, and forms.
- React-escaped rendering only; no `dangerouslySetInnerHTML`.
- Free-text control-character stripping and length clamps.
- Persisted state is schema-validated; invalid data is dropped or reset to safe defaults.
- Outbound links use `noopener noreferrer`.
- Profile, tracker, checklist, and theme stay in browser localStorage. This storage is
  **not encrypted** and is not suitable for shared-device privacy without clearing data.
- The assistant makes no network calls. Grantly does not upload or verify documents.

---

## License

MIT License — see [LICENSE](LICENSE).
