# Contributing To OpenPlans

OpenPlans works best when changes stay small, verifiable, and easy to review. This guide is written for both human contributors and coding agents. For the canonical agent workflow, see [AGENTS.md](./AGENTS.md).

## Setup

Root package:

```bash
npm install
```

Docs site:

```bash
cd docs
npm install
```

Prerequisites:
- Node.js 18 or newer
- npm

## Repo Layout

- `src/index.ts`: top-level exports and the main `OpenPlans` facade
- `src/packages/openplans-core/src/`: primitives, shapes, elements, layouts, exporters, and core data structures
- `src/packages/openplans-three/src/`: renderer, camera, grid, and Three.js-specific behavior
- `examples/src/`: browser examples used for manual verification
- `docs/docs/`: user-facing docs pages
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
- Product docs and tutorials: edit `docs/docs/`
- Repo onboarding and contributor workflow: edit `README.md`, `CONTRIBUTING.md`, or `AGENTS.md`

## When Docs Or Examples Must Change

- Public API or user workflow change: update the relevant page in `docs/docs/`
- New top-level export or changed setup guidance: update `README.md`
- Visual or interactive behavior change: update an existing example or add a focused example in `examples/src/`
- New example HTML: keep the `<!-- MIXPANEL_TRACKING -->` placeholder so the example build can inject analytics correctly

## Validation

Use the smallest validation set that proves the change:

- Library code changes: `npm run build`
- Example changes: `npm run build-examples`
- Manual browser verification: `npm run dev` and open the relevant example on `http://localhost:5555`
- Docs site changes: from `docs/`, run `npm run build`

Important note:
- Do not rely on `npm test` as the main verification path. The repository does not currently include a maintained automated test suite, so build and example verification are the reliable signals today.

## Visual Verification Harness

OpenPlans output is inherently visual, so any change that affects a rendered example must be screenshot-verified against a reference before it is considered done. The binding checklist — the Definition of Done — lives in [AGENTS.md § Visual Verification](./AGENTS.md#visual-verification--definition-of-done); read it before making visual changes.

Harness pieces:
- `.mcp.json` — Playwright MCP server, headless Chromium. An agent or IDE integration must be restarted after first clone so this is picked up.
- `scripts/visual-verify.sh <example-path>` — preflight. Prints the canonical URL to screenshot, or exits non-zero with a clear message if the dev server is down or the file is missing.
- `window.__OP_READY__` (and a `openplans:ready` event) — set by `OpenThree.animate` after the first Three.js frame. Screenshots must wait for this signal; a shot taken too early is a blank canvas that *looks* fine.
- `docs/references/<area>/<feature>/expected.md` — trait list the render must satisfy, cited from NCS/AIA/ISO or office convention. A symbol with no `expected.md` has no definition of "correct" — author one before or alongside the code change.

Local agent bring-up:

```bash
npm install
npm run dev     # leave running on :5555 in a separate terminal
```

Then restart your agent / IDE so `.mcp.json` registers the Playwright MCP server.

### Smoke test for the harness

To confirm the harness is working end-to-end, point a local agent at this task:

> Verify that `examples/src/datums/section-line.html` satisfies every trait listed in `docs/references/datums/section-line/expected.md`. Follow the Definition of Done in `AGENTS.md § Visual Verification`.

Expected behavior:
1. The agent runs `scripts/visual-verify.sh examples/src/datums/section-line.html` and gets `ok` with the URL.
2. It navigates via the Playwright MCP server, waits on `window.__OP_READY__`, and captures a full-viewport screenshot at 1600×900 plus a cropped shot of one section head.
3. It walks the 7 traits in `expected.md` against the screenshot.

Expected finding against the **current** code: **trait 4 fails** — the two section-head arrows point in opposite perpendicular directions, not the same direction. Trait 5 is also borderline — the arrowheads are open two-segment "L" shapes rather than solid filled triangles attached to the bubble. If the agent reports "looks right" without surfacing trait 4, the harness has not actually been exercised and something in the bring-up is wrong.

## Pull Requests

- Keep PRs focused on one task when possible.
- Summarize the problem, the fix, and the validation you ran.
- Call out any known follow-up work or validation you could not complete.
- Do not hand-edit generated output in `dist/` or `examples/dist/`.
