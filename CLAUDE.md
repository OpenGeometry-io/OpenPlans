# Claude operating contract

Follow `AGENTS.md` — it is the canonical agent contract for this repo. If this file and `AGENTS.md` ever disagree, `AGENTS.md` wins; update the stale one.

## Visual verification is part of Definition of Done

Any change under `examples/src/**`, or any change under `src/**` that affects what an example renders, is **not done** until the Definition of Done in `AGENTS.md` § Visual Verification has been satisfied end-to-end.

Harness at a glance:

- **Preflight** before every screenshot: `scripts/visual-verify.sh <example-path>`. It prints the canonical URL and exits non-zero with a clear message if the dev server is down. Do not guess URLs.
- **Browser driver**: the Playwright MCP server in `.mcp.json`. Use it to navigate, drive interactive controls, and screenshot.
- **Render-ready signal**: wait for `window.__OP_READY__ === true` (or the `openplans:ready` event) before the first screenshot. A screenshot taken before the first frame is a blank canvas that looks fine.
- **Reference library**: `docs/references/<area>/<feature>/expected.md` lists the traits the render must satisfy. Walk the list; do not rationalize mismatches.

The handoff must explicitly state: URL screenshotted, viewport, which reference was checked, which traits were confirmed, and any interactive states exercised. If a step could not be completed, say so — never imply verification that didn't happen.

"The code looks right" is not visual verification. Only an actual screenshot compared against a reference counts.
