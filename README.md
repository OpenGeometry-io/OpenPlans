# OpenPlans

Floor-planning, drawing, and export toolkit for the web, built on top of OpenGeometry and Three.js.

[OpenGeometry](https://opengeometry.io) · [OpenGeometry Docs](https://docs.opengeometry.io) · [Contributor Guide](./CONTRIBUTING.md) · [Agent Guide](./AGENTS.md) · [Docs Site Guide](./docs/README.md)

> **Actively under development.** OpenPlans is evolving in the open, so APIs, examples, and docs may change as the library matures.

## What OpenPlans Provides

OpenPlans is the application-facing layer on top of [`opengeometry`](https://github.com/OpenGeometry-io/OpenGeometry). It combines scene setup, plan-view authoring, building elements, drawing helpers, and export workflows in one package.

Today the repo includes:

- primitives such as lines, arcs, polylines, and rectangles
- shapes such as cuboids and cylinders
- architectural elements such as walls, openings, doors, and windows
- drawing helpers such as paper frames, linked viewport blocks, and dimensions
- export flows such as IFC and printable PDF output
- browser examples for runtime and visual verification

## Quick Start

Install from npm:

```bash
npm install @opengeometry/openplans three camera-controls lil-gui
```

```ts
import { CameraMode, OpenPlans } from "@opengeometry/openplans";

const container = document.getElementById("app");
if (!container) throw new Error("Missing app container");

const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();

openPlans.CameraMode = CameraMode.Plan;

const wall = openPlans.singleWall();
wall.position.set(2, 0, 0);
```

`setupOpenGeometry()` must complete before creating geometry-backed content.

## Paper Frames And PDF Export

The stable sheet/export workflow today is the paper-frame path: compose linked viewports on a paper frame and export the result as a downloadable PDF.

```ts
const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();

const floorSource = openPlans.floorSection({
  labelName: "Level 01",
  center: [0, 0, 0],
  cropSize: [12, 8],
});

const floorView = openPlans.createLinkedView(floorSource.getOPConfig().ogid, {
  labelName: "Floor Plan",
});

const paperFrame = openPlans.paperFrame({
  labelName: "Sheet A101",
  format: "A3",
  orientation: "landscape",
});

paperFrame.addViewport({
  id: "floor-plan",
  ogType: "VIEWPORT_BLOCK",
  size: [11.8, 8.2],
  position: [-5.8, 0.03, 0.8],
  scale: 1,
  rotation: 0,
  viewId: floorView.ogid,
});

await openPlans.exportPaperFrameToPDF(paperFrame, {
  fileName: "sheet-a101.pdf",
});
```

There is active work in the repository toward a larger document-first views/sheets architecture, but that path is still experimental and is not the primary production-facing API yet.

## Examples

The repository keeps example source files under `examples/src/`. Useful entry points:

- [Demo](./examples/src/demo.html)
- [IFC export](./examples/src/export-ifc.html)
- [Single wall](./examples/src/elements/solids/single-wall.html)
- [Door opening](./examples/src/elements/openings/door.html)
- [Section and floor views](./examples/src/views/section-floor-views.html)
- [Paper frame export](./examples/src/drawings/paper.html)
- [Paper section sheet](./examples/src/drawings/paper-section-sheet.html)
- [Document sheet editor (experimental)](./examples/src/drawings/document-sheet-editor.html)
- [Viewport block](./examples/src/drawings/viewport-block.html)
- [Primitive line](./examples/src/primitives/line.html)

Run `npm run dev` to serve these locally at `http://localhost:5555`.

## Documentation

Product documentation lives in this repository:

- [Introduction](./docs/docs/intro.md)
- [Semantic architecture](./docs/docs/semantic-architecture.md)
- [Semantic IFC export](./docs/docs/semantic-ifc-export.md)
- [Colors and appearance](./docs/docs/colors-and-appearance.md)
- [Create wall tutorial](./docs/docs/tutorial-create-elements/create-wall.md)

If you also need kernel-level geometry docs, see [docs.opengeometry.io](https://docs.opengeometry.io).

## Repository Layout

```text
src/index.ts                         Public facade and top-level exports
src/packages/openplans-core/src/     Primitives, shapes, elements, layouts, exporters
src/packages/openplans-three/src/    Three.js runtime, camera, grid, helpers
examples/src/                        Browser examples used for manual verification
docs/docs/                           User-facing documentation pages
scripts/                             Build helpers and example build utilities
dist/                                Generated library output
examples/dist/                       Generated example site output
```

## Develop From Source

Prerequisites:

- Node.js 18 or newer
- npm

Install and build:

```bash
npm install
npm run build
```

Useful commands:

- `npm run dev`: start the Vite example server on port `5555`
- `npm run build`: build the library into `dist/`
- `npm run build-examples`: build the example site into `examples/dist/`

For docs site work:

```bash
cd docs
npm install
npm run start
```

The repository does not currently include a maintained committed automated test suite, so build and example validation are the primary verification paths.

## Contributing

OpenPlans is open source under the [MIT license](./LICENSE.md). For the practical change workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md). For repository-specific agent instructions, see [AGENTS.md](./AGENTS.md).
