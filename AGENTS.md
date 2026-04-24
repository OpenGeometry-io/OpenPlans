# OpenPlans Agent Guide

`AGENTS.md` is the canonical operating contract for coding agents in this repository. If another repo document disagrees with this file, follow `AGENTS.md` and update the stale document as part of the task.

## Goals
- Optimize for shipping small, correct changes.
- Read the current code before editing; do not rely on stale assumptions.
- Keep changes targeted and leave touched areas clearer than you found them.
- Report what you verified and call out any validation limits plainly.

## Repo Map
- `src/index.ts`: public facade and export surface. Update this when public APIs or top-level exports change.
- `src/packages/openplans-core/src/`: primitives, shapes, elements, layouts, exporters, model types, and view management.
- `src/packages/openplans-three/src/`: Three.js runtime, renderer wiring, camera logic, grid, and helpers.
- `examples/src/`: browser examples used for manual verification of runtime and visual behavior.
- `docs/docs/`: product documentation pages. The rest of `docs/` contains Docusaurus config and site assets.
- `scripts/`: build helpers such as `scripts/tracking.js`, which injects analytics into built example HTML.
- `dist/` and `examples/dist/`: generated output. Do not edit these by hand.

## Working Rules
1. Inspect the relevant code paths and existing examples before making changes.
2. Prefer the smallest change that solves the real problem.
3. Keep public API changes synchronized across implementation, exports, examples, and docs.
4. When changing visual or interactive behavior, update an existing example or add a focused example under `examples/src/`.
5. Keep `<!-- MIXPANEL_TRACKING -->` in example HTML files. The Vite build relies on that placeholder when generating `examples/dist/`.
6. Do not hand-edit generated or installed content such as `dist/`, `examples/dist/`, or `node_modules/`.
7. Do not assume `npm test` is a reliable signal. The repo does not currently include a maintained committed automated test suite, so validation is build- and example-driven.
8. Do not introduce arbitrary user-facing colors, temporary debug styling, helper fills, or placeholder visuals. Reuse the established palette/material behavior for the touched area, and keep helper geometry hidden or neutral unless the user explicitly asks for a new visual treatment.
9. Remove debug `console.log` output from runtime code before handoff. User-facing examples and production paths should not gain noisy diagnostic logging.

## Where To Edit
- Public factory methods or package exports: `src/index.ts`
- Core geometry-facing behavior: `src/packages/openplans-core/src/`
- Three.js runtime behavior: `src/packages/openplans-three/src/`
- Example pages and manual verification harnesses: `examples/src/`
- Repository onboarding or workflow docs: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`
- Product docs for users: `docs/docs/`

## Validation Expectations
- Library source changes: run `npm run build`
- Example or visual workflow changes: run `npm run build-examples`
- Docs site changes under `docs/`: run `npm run build` from `docs/`
- Visual debugging or manual review: run `npm run dev` and inspect the relevant page on `http://localhost:5555`
- Multi-area changes: run the relevant command for each changed area
- If an expected validation command is broken because of current repo state, say so clearly in the handoff instead of silently skipping it

## Visual Verification — Definition of Done
OpenPlans output is inherently visual. "The code looks right" is not proof the render is right; code review has repeatedly missed wrong glyphs, mirrored arrows, and misplaced tags. The Definition of Done below is binding for any change under `examples/src/**` or any change under `src/**` that alters what an example renders.

### Harness
- Dev server: `npm run dev` → `http://localhost:5555`.
- Browser driver: Playwright MCP server, declared in `.mcp.json`, runs headless Chromium.
- Render-ready signal: `window.__OP_READY__ === true` (also fires a `openplans:ready` event) once the first frame has been drawn. Always wait for this before screenshotting — a screenshot taken before the first render is a blank canvas that *looks* fine.
- Preflight: `scripts/visual-verify.sh <example-path>` prints the canonical URL and exits non-zero with a clear message if the dev server is down or the file is missing. Run it first; never guess the URL.
- Reference library: `docs/references/<area>/<feature>/` contains `expected.md` (traits the render must satisfy) and optionally reference images. A symbol with no `expected.md` has no definition of "correct" — author one before or alongside the code change.

### Definition of Done checklist
A change is **not done** until every applicable item below is true, in order. If any item cannot be satisfied, say so explicitly in the handoff — do **not** declare success.

1. **Build passes.** `npm run build` for library changes, `npm run build-examples` when only examples changed. Both for multi-area changes.
2. **Preflight succeeds.** `scripts/visual-verify.sh <example-path>` exits 0 and prints the URL. If it prints "dev server not reachable," start the dev server and retry — do not screenshot an offline page.
3. **Page reaches ready state.** Navigate to the printed URL via Playwright MCP and wait for `window.__OP_READY__ === true` (or the `openplans:ready` event). Set viewport to the value printed by preflight (default `1600×900`) before the first screenshot.
4. **Screenshot captured.** Full viewport PNG. If the feature lives inside a small region, take a second cropped screenshot of that region — a 4 px arrowhead is invisible in a 1600 px shot.
5. **Screenshot visually reviewed against a reference.** Open the PNG. Walk through `docs/references/<area>/<feature>/expected.md` trait-by-trait and confirm each one against what is actually on screen. For any trait that fails, stop and fix the code — do not rationalize.
6. **Interactive states exercised.** If the example exposes controls (sliders, toggles, `flip`, etc.), drive the ones the change could affect via Playwright MCP and take a screenshot of each resulting state. Confirm the reference's traits still hold under each state.
7. **Neighboring examples not regressed.** If the change touched `src/**`, screenshot at least one unrelated example that exercises the same subsystem (e.g. if you edited `datums/section-line.ts`, screenshot `datums/elevation-marker.html` too). A fix that breaks a sibling is not done.
8. **Handoff reports the proof.** The final message must list, per screenshotted example: the URL, viewport, which reference's traits were checked, and explicitly what was confirmed. If step 4–7 could not be completed (MCP unavailable, no reference yet, etc.), say so in the handoff — never imply verification happened when it didn't.

The handoff template:

```
Verified visually:
  - url:       http://localhost:5555/examples/src/datums/section-line.html
    viewport:  1600x900
    reference: docs/references/datums/section-line/expected.md
    confirmed: traits 1,2,3,4,5,7; trait 6 (line style) unchanged from baseline
    states:    flip=false, flip=true
  - url:       http://localhost:5555/examples/src/datums/elevation-marker.html  (regression check)
    confirmed: renders unchanged
```

## Docs And Examples
- Update `README.md` when the repo entry experience, setup steps, or key capability summary changes.
- Update `docs/docs/` when public APIs, workflows, or tutorials change.
- Update or add an example when behavior would be easier to understand or verify in the browser than by reading code alone.

## Finish Line
- Summarize the user-visible change, the files or areas touched, and the validation you ran.
- Mention follow-ups only when they are real blockers or meaningful next steps.
- If you encounter stale instructions while touching an area, fix them instead of leaving contradictory guidance behind.
