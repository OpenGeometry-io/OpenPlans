# OpenPlans Docs Site

This directory contains the Docusaurus site for OpenPlans product documentation.

## Prerequisites

- Node.js 18 or newer
- npm

## Install

```bash
cd docs
npm install
```

The docs package has its own `package-lock.json`, so use npm here as well.

## Commands

Run these from `docs/`:

| Command | Purpose |
| --- | --- |
| `npm run start` | Start the local Docusaurus dev server |
| `npm run build` | Build the static docs site |
| `npm run serve` | Serve the built docs site locally |
| `npm run clear` | Clear the Docusaurus cache |
| `npm run swizzle` | Eject a Docusaurus component for customization |
| `npm run deploy` | Run the configured Docusaurus deploy step |
| `npm run typecheck` | Run TypeScript checks for the docs app |

## Docs Structure

```text
docs/
  docs/                 Markdown and MDX content
  src/                  React components, CSS, and custom pages
  static/               Static assets
  docusaurus.config.ts  Site configuration
  sidebars.ts           Sidebar configuration
  package.json          Docs scripts and dependencies
```

## Writing Docs

- Add or update product documentation pages under `docs/docs/`
- Keep repository workflow docs in the repo root: `README.md`, `CONTRIBUTING.md`, and `AGENTS.md`
- If a public API or user workflow changes, update the relevant docs page in the same change
- Prefer linking to real examples under `../examples/src/` when a browser demo helps explain the feature

## Review And Verification

Local preview:

```bash
cd docs
npm run start
```

Build verification:

```bash
cd docs
npm run build
```
