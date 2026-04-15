# OpenPlans GitHub Copilot Instructions

Primary repository guidance lives in [`AGENTS.md`](../AGENTS.md). Follow that file when making changes.

## Quick Reference

- `src/index.ts`: public facade and top-level export surface
- `src/packages/openplans-core/src/`: primitives, shapes, elements, layouts, exporters, and model behavior
- `src/packages/openplans-three/src/`: Three.js runtime, renderer, camera, and grid behavior
- `examples/src/`: manual verification examples
- `docs/docs/`: user-facing docs
- `dist/` and `examples/dist/`: generated output, do not edit by hand

## Validation

- `npm run build`: validate library changes
- `npm run build-examples`: validate example changes
- from `docs/`, `npm run build`: validate docs site changes
- `npm run dev`: run the example server on `http://localhost:5555` for manual browser review

## Repo-Specific Notes

- Keep `<!-- MIXPANEL_TRACKING -->` in example HTML so the example build can inject analytics.
- When public behavior changes, update implementation, exports, docs, and examples together.
- Do not treat `npm test` as the primary verification path; the repo does not currently include a maintained committed automated test suite.
