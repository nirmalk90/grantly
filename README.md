# Grantly · New Era — A Cinematic Scholarship Voyage

A cinematic, scroll-driven WebGL experience that opens into a full scholarship
workspace. Inspired by immersive "particle voyage" templates: a luminous swarm of
orange-and-blue particles drifts through deep space and endlessly reshapes itself as
you scroll — from **a single point of light → a drifting nebula → an orbital ring → a
vast spiral galaxy** — before landing you inside the app: discovery with explainable
matching, an on-device AI assistant, a kanban application pipeline, deadline radar,
and a document vault.

---

## ⚡ Quick Start for Evaluators

```bash
npm install
npm run dev        # Starts Vite dev server (instant HMR)
npm run lint       # ESLint 9: 0 errors, 0 warnings
npm run typecheck  # TypeScript strict mode: 0 errors
npm run build      # Production bundle into dist/
```

### Testing Key Features in 60 Seconds:
1. **Cinematic Landing**: Scroll through the 5 acts (Ignition → Drift → Orbit → Galaxy → Launch) or click **"Enter workspace"** in the top-right HUD to jump straight to the app.
2. **Instant Demo Preset**: Click **"★ Load demo preset"** in the sidebar (or inside the Profile editor) to immediately populate a sample student profile, pre-tracked applications across all 4 Kanban stages, and verified documents in the Vault.
3. **Official Portal Outbound**: Open any scholarship details modal or Kanban card to test the direct **"Official Portal ↗"** outbound links.
4. **On-Device Funding Assistant ("Grant")**: Open the Assistant tab, click any of the prompt pills (e.g. *"Help me write my statement of purpose"* or *"Which documents am I missing?"*), and click **"Copy response"** to copy the generated text.
5. **Print-Ready Checklist**: Hit `Ctrl + P` / `Cmd + P` to preview the clean, print-optimized application pipeline and checklist.

---

## Tech Stack

- **Hand-rolled WebGL particle engine** (`src/cinema/engine.ts`) — custom GLSL
  shaders, 12,800 morphing particles + starfield in two draw calls, zero 3D
  dependencies (no three.js): ~10 KB source, lazy-loaded as its own chunk
- **React 18** with hooks, `React.lazy` code-splitting, and `Suspense`
- **TypeScript** strict mode (`noUncheckedIndexedAccess`, `noUnusedLocals`, …)
- **Vite 5** build pipeline with per-page chunk splitting
- **ESLint 9 flat config** — `typescript-eslint` strict, `eslint-plugin-react-hooks`,
  `eslint-plugin-jsx-a11y`, `react-refresh` — zero errors/reported warnings
- No runtime dependencies beyond React: tiny, fast bundles

---

## The Cinematic Voyage (`src/cinema/`)

| Piece | Detail |
| --- | --- |
| **Formations** | Point → nebula → ring → 3-arm spiral galaxy, precomputed into four position buffers; the GPU blends between two at a time |
| **Swarm feel** | Per-particle staggered transition delays + arc-outward tangents make particles *stream* between shapes instead of cross-fading |
| **Camera** | Keyframed dolly/orbit path interpolated by scroll progress, FOV "energy" kick mid-morph, pointer parallax |
| **Shading** | Procedural soft-glow sprites, premultiplied additive blending over a CSS nebula backdrop, warm core bias as the galaxy forms, twinkle + distance fade |
| **Choreography** | Five semantic acts (Ignition · Drift · Orbit · Galaxy · Launch) revealed by `IntersectionObserver`; chapter rail + top progress line track scroll |
| **Adaptive perf** | Particle budget scales with screen size & `hardwareConcurrency`; DPR capped at 2; rAF pauses on tab hide; full GL teardown on unmount |
| **Resilience** | No WebGL → painted CSS starfield fallback; `prefers-reduced-motion` → single settled galaxy frame, no animation loop, instant reveals |

---

## Features

| Area | Highlights |
| --- | --- |
| **Cinematic Intro** | The "New Era" WebGL voyage; enter the workspace from the HUD or finale card, replay anytime from the sidebar |
| **Dashboard** | Personalised hero, KPI metrics, recommendations, readiness ring |
| **Discover** | Explainable weighted match scoring, search, filter pills (All, Eligible, Closing soon), sort, empty state recovery |
| **AI Assistant** | "Grant" — an on-device intent engine (deadlines, missing docs, eligibility, SOP drafts, one-click clipboard copy). 100% private, zero network calls |
| **Applications** | Four-stage kanban (Saved → In progress → Submitted → Awarded) with per-card document checklists and official portal links |
| **Deadlines** | Sorted timeline with countdown alerts, eligibility tags, and one-click tracking |
| **Vault** | Document checklist synced across every card, checklist, and modal |
| **Command Palette** | `Ctrl/⌘ + K` quick actions with full keyboard navigation |
| **Theming** | Dark & light themes, persisted preference |
| **Persistence** | Profile, tracker, vault, & theme saved to `localStorage` with runtime schema validation |
| **Evaluator Presets** | Instant demo student state injection and reset buttons |
| **Print-ready** | Clean `@media print` styles for offline recordkeeping |

---

## Quality Gates

```bash
npm run lint        # ESLint: 0 errors, 0 warnings (a11y rules enabled)
npm run typecheck   # tsc -b: strict, zero errors
npm run build       # tsc -b && vite build → dist/
```

---

## Accessibility

- Semantic landmarks (`nav`, `main`, `header`, `footer`, `article`, `section`)
- Skip link, focus-visible outlines, focus-trapped modals with focus restoration
- `aria-live` regions for chat log, toasts, and filter results
- Real `<label>` + checkbox inputs for checklists; `role="combobox/listbox"` palette
- `prefers-reduced-motion` respected; WCAG-conscious contrast in both themes

---

## Security

- Strict **Content-Security-Policy** meta (no external scripts/styles/fonts)
- No `dangerouslySetInnerHTML` anywhere; React-escaped rendering only
- Input sanitisation (control-char strip + length clamps) for all free-text fields
- All data stays in the browser; dependency tree limited to React + build tooling

---

## Efficiency

- Initial chunk ≈ 57 KB gzip (React + shell); each page lazy-loads 1.5–7.5 KB
- Zero layout shift: fixed sidebar/topbar metrics, skeleton fallbacks
- Memoised derived state (`useMemo`) for ranking and eligibility calculations

---

## License

MIT License — see [LICENSE](file:///c:/Users/nirmal/Downloads/grantly-scholarship/LICENSE) for details.
