# OpenPlans

OpenPlans is the BIM and floor-planning application layer built on top of `opengeometry`.

## Architecture

`@opengeometry/openplans` remains the only public package, but the repo is now split internally into two workspace packages:

- `@opengeometry/openplans-core`
  - semantic BIM document
  - wall / door / window specs
  - geometry generation
  - IFC mapping and export orchestration
- `@opengeometry/openplans-three`
  - Three.js runtime
  - editor/view APIs
  - compatibility wrappers for existing visual factories

This mirrors the standard CAD pattern:

- `opengeometry` owns geometry, topology, booleans, and final file serialization
- `openplans-core` owns BIM meaning and regeneration rules
- `openplans-three` owns rendering and interaction

## Public API

Users still import only:

```ts
import { OpenPlans, PlanDocument } from "@opengeometry/openplans";
```

The facade re-exports both the semantic core APIs and the Three/runtime APIs.

## IFC Flow

1. Create or update semantic wall / door / window data.
2. Generate derived geometry through `opengeometry`.
3. Map semantic elements to IFC classes and property sets in `openplans-core`.
4. Serialize IFC through `opengeometry`.

V1 appearance support includes:

- `wallColor`
- `doorColor`
- `frameColor`
- `glassColor`

These drive rendering in OpenPlans and are exported to IFC as metadata in `Pset_OpenPlansAppearance`.

## Canonical Example

Use the semantic IFC example in:

- `examples/export-ifc.html`

It shows:

- wall / door / window creation
- live color and size edits
- semantic document inspection
- direct IFC export through `opengeometry`

## Local Development

OpenPlans now consumes a packaged `opengeometry` artifact instead of copying the kernel into `src/kernel`.

Build the kernel package first:

```bash
cd ../OpenGeometry-Kernel
npm run build
```

This produces:

- `dist/package.json`
- `dist/opengeometry-2.1.0.tgz`

Then install dependencies in OpenPlans:

```bash
cd ../OpenPlans
npm install
```

Run the example/dev server:

```bash
npm run dev
```

During local development, npm installs `opengeometry` from the generated versioned tarball package, not from a directory link.

## Notes

- Existing visual factories such as `wall2D`, `door2D`, and `singleWindow2D` still work.
- The semantic export flow currently focuses on wall, door, and window.
- `OpenBoard` should follow the same architecture later, but it is not part of this repo refactor.
