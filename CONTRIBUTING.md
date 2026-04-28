# Contributing To OpenPlans

OpenPlans works best when changes stay small, verifiable, and easy to review. This guide is written for both human contributors and coding agents.

## Setup

```bash
npm install
```

Prerequisites:
- Node.js 18 or newer
- npm

For local development against a sibling [OpenGeometry](https://opengeometry.io) kernel checkout, see [developer.md](./developer.md). Product documentation is generated from a separate auto-docs pipeline and published at [docs.openplans.io](https://docs.openplans.io).

## Repo Layout

- `src/index.ts`: top-level exports and the main `OpenPlans` facade
- `src/packages/openplans-core/src/`: primitives, shapes, elements, layouts, exporters, and core data structures
- `src/packages/openplans-three/src/`: renderer, camera, grid, and Three.js-specific behavior
- `examples/src/`: browser examples used for manual verification
- `scripts/`: build helpers
- `dist/` and `examples/dist/`: generated output, never hand-edit

## Typical Workflow

1. Inspect the relevant code and existing examples first.
2. Make the smallest change that fully solves the task.
3. Update exports, examples, and docs together when public behavior changes.
4. Run the validation that matches the area you changed.
5. In your PR or handoff, explain what changed and how you verified it.

## Where To Make Changes

- Public API additions or renamed exports: update `src/index.ts`
- Primitives, shapes, elements, layouts, exporters, and model behavior: edit `src/packages/openplans-core/src/`
- Renderer, camera, grid, and scene integration: edit `src/packages/openplans-three/src/`
- Visual demos or manual repro cases: edit `examples/src/`
- Repo onboarding and contributor workflow: edit `README.md` or `CONTRIBUTING.md`
- Product docs and tutorials: handled by the external auto-docs pipeline at [docs.openplans.io](https://docs.openplans.io)

## When Examples Must Change

- New top-level export or changed setup guidance: update `README.md`
- Visual or interactive behavior change: update an existing example or add a focused example in `examples/src/`
- New example HTML: keep the `<!-- MIXPANEL_TRACKING -->` placeholder so the example build can inject analytics correctly

## Validation

Use the smallest validation set that proves the change:

- Library code changes: `npm run build`
- Example changes: `npm run build-examples`
- Manual browser verification: `npm run dev` and open the relevant example on `http://localhost:5555`

Important note:
- Do not rely on `npm test` as the main verification path. The repository does not currently include a maintained automated test suite, so build and example verification are the reliable signals today.

## Pull Requests

- Keep PRs focused on one task when possible.
- Summarize the problem, the fix, and the validation you ran.
- Call out any known follow-up work or validation you could not complete.
- Do not hand-edit generated output in `dist/` or `examples/dist/`.
