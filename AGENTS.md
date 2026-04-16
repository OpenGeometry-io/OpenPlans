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

## Docs And Examples
- Update `README.md` when the repo entry experience, setup steps, or key capability summary changes.
- Update `docs/docs/` when public APIs, workflows, or tutorials change.
- Update or add an example when behavior would be easier to understand or verify in the browser than by reading code alone.

## Finish Line
- Summarize the user-visible change, the files or areas touched, and the validation you ran.
- Mention follow-ups only when they are real blockers or meaningful next steps.
- If you encounter stale instructions while touching an area, fix them instead of leaving contradictory guidance behind.
