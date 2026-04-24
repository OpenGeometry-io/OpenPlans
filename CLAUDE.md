# Claude operating contract

Follow `AGENTS.md` — it is the canonical agent contract for this repo. If this file and `AGENTS.md` ever disagree, `AGENTS.md` wins; update the stale one.

## Visual verification is mandatory

For any change under `examples/src/**`, or any `src/**` change that affects what an example renders, you must screenshot the example via the Playwright MCP server and visually confirm the output before reporting the task done. See the "Visual Verification" section in `AGENTS.md` for the full procedure.

The Playwright MCP server is configured in `.mcp.json` and runs headless Chromium. Use it to navigate to `http://localhost:5555/examples/src/...`, drive controls if needed, and take a screenshot you can read back.

"The code looks right" is not visual verification. Only an actual screenshot counts.
