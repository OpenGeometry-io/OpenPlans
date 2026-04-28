# OpenPlans

[![npm version](https://img.shields.io/npm/v/@opengeometry/openplans)](https://www.npmjs.com/package/@opengeometry/openplans)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE.md)
[![built on Three.js](https://img.shields.io/badge/built%20on-Three.js-black)](https://threejs.org)

[OpenGeometry](https://opengeometry.io) · [OpenGeometry Docs](https://docs.opengeometry.io) · [Contributor Guide](./CONTRIBUTING.md) · [Agent Guide](./AGENTS.md) · [Docs Site Guide](./docs/README.md)

> **Actively maintained.** OpenPlans is production-ready and ships regular updates. We welcome bug reports, feature requests, and contributions on [GitHub](https://github.com/OpenGeometry-io/OpenPlans/issues).

A web-based floor-planning, drawing, and export toolkit built on [OpenGeometry](https://opengeometry.io) and Three.js. OpenPlans gives architects and developers a browser-native environment for authoring 2D/3D architectural plans, annotating with dimensions and reference datums, composing drawing sheets, and exporting to IFC, DXF, or printable PDF. It is the application-facing layer on top of the OpenGeometry geometry kernel.

## Features

**Primitives**
- Line, Arc, Polyline, Rectangle

**Shapes**
- Cuboid, Cylinder, Wedge

**Architectural Elements**
- SingleWall, PolyWall, WallOpening, Door, Window

**Reference Datums**
- Levels, Grids, ReferencePlanes, SectionLines, ElevationMarkers, ProjectOrigin

**Drawing Helpers**
- PaperFrame (A4 / A3 / A2, portrait and landscape)
- ViewportBlock — linked, scaled view compositions
- Dimensions — line, angle, and radius
- DynamicTextBlock, LogoBlock — sheet annotation elements

**Catalog**
- Furniture: Chair, Sofa, Bed, Desk, DiningTable, Wardrobe
- Kitchen: Counter, Cabinet, Island, KitchenSink, Stove, Refrigerator, Dishwasher, Washer
- Fixtures: Bathtub, Shower, Sink, Toilet, Bidet, Urinal
- Landscape: Tree, Shrub, Planter, Fountain

**Camera Modes**
- `CameraMode.Plan` — orthographic top-down view
- `CameraMode.Model` — perspective 3D view

**Themes**
- `light`, `dark`, `darkBlue`

**Export**
- IFC — semantic BIM with B-rep geometry and property sets
- PDF — vector printable output via jsPDF
- DXF — CAD-compatible vector export

The document-first views/sheets API (`document-sheet-editor`) is available as a preview. The paper-frame PDF path, architectural elements, primitives, and IFC export are the primary production APIs.

## Quick Start

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

`setupOpenGeometry()` must complete before creating any geometry-backed content.

## Architecture

OpenPlans is organized as two internal packages under `src/packages/`:

**`openplans-core`** — the semantic BIM layer. Contains all element types (primitives, shapes, architectural elements, datums, catalog), layout and view management, dimension tools, and IFC/PDF/DXF exporters. Has no direct dependency on a renderer.

**`openplans-three`** — the Three.js runtime. Owns scene setup, the render loop, camera (Plan/Model modes), grid, and Three.js-specific helpers. Consumes `openplans-core` types and drives them through the OpenGeometry kernel.

The `OpenPlans` class in `src/index.ts` is the public facade that wires both packages together and is the primary entry point for application code.

## Paper Frames and PDF Export

Compose linked viewports on a named paper frame and export the result as a downloadable vector PDF.

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

## IFC Export

OpenPlans emits semantically valid IFC with B-rep geometry and standard property sets. See [Semantic IFC Export](./docs/docs/semantic-ifc-export.md) for the full workflow and property set reference.

## Examples

Run `npm run dev` to serve all examples locally at `http://localhost:5555`.

Source files live in `examples/src/`. Useful entry points by category:

**General**
- [Demo](./examples/src/demo.html)
- [IFC export](./examples/src/export-ifc.html)
- [DXF export](./examples/src/dxf-export/index.html)

**Elements**
- [Single wall](./examples/src/elements/solids/single-wall.html)
- [Polyline wall](./examples/src/elements/solids/polyline-wall.html)
- [Wall opening](./examples/src/elements/solids/wall-opening.html)
- [Door](./examples/src/elements/openings/door.html)
- [Window](./examples/src/elements/openings/window.html)
- [Opening](./examples/src/elements/openings/opening.html)

**Primitives**
- [Line](./examples/src/primitives/line.html)
- [Arc](./examples/src/primitives/arc.html)
- [Polyline](./examples/src/primitives/polyline.html)
- [Rectangle](./examples/src/primitives/rectangle.html)

**Shapes**
- [Cuboid](./examples/src/shapes/cuboid.html)
- [Cylinder](./examples/src/shapes/cylinder.html)

**Datums**
- [All datums](./examples/src/datums/all-datums.html)
- [Level](./examples/src/datums/level.html)
- [Grid](./examples/src/datums/grid.html)
- [Section line](./examples/src/datums/section-line.html)
- [Elevation marker](./examples/src/datums/elevation-marker.html)
- [Reference plane](./examples/src/datums/reference-plane.html)
- [Project origin](./examples/src/datums/project-origin.html)

**Dimensions**
- [Line dimension](./examples/src/dimensions/line-dimension.html)
- [Angle dimension](./examples/src/dimensions/angle-dimension.html)
- [Radius dimension](./examples/src/dimensions/radius-dimension.html)

**Drawings and Sheets**
- [Paper frame export](./examples/src/drawings/paper.html)
- [Viewport block](./examples/src/drawings/viewport-block.html)
- [Dynamic text block](./examples/src/drawings/dynamic-text-block.html)
- [Logo block](./examples/src/drawings/logo-block.html)

**Views**
- [View creation](./examples/src/views/view-creation.html)

## Documentation

Product documentation lives in this repository under `docs/docs/`:

- [Semantic architecture](./docs/docs/semantic-architecture.md)
- [Semantic IFC export](./docs/docs/semantic-ifc-export.md)
- [Colors and appearance](./docs/docs/colors-and-appearance.md)
- [Document views and sheets](./docs/docs/document-views-sheets.md)
- [Migration guide](./docs/docs/migration-semantic-core.md)

For kernel-level geometry documentation, see [docs.opengeometry.io](https://docs.opengeometry.io).

## Repository Layout

```text
src/index.ts                         Public facade and top-level exports
src/packages/openplans-core/src/     Primitives, shapes, elements, layouts, exporters
src/packages/openplans-three/src/    Three.js runtime, camera, grid, helpers
examples/src/                        Browser examples used for manual verification
docs/docs/                           User-facing documentation pages
scripts/                             Build helpers
dist/                                Generated library output (do not edit)
examples/dist/                       Generated example site output (do not edit)
```

## Develop From Source

Prerequisites: Node.js 18 or newer, npm.

```bash
npm install
npm run build
```

Useful commands:

- `npm run dev` — start the Vite example server on port `5555`
- `npm run build` — build the library into `dist/`
- `npm run build-examples` — build the example site into `examples/dist/`

For the docs site:

```bash
cd docs
npm install
npm run start
```

Verify changes by running `npm run build` and exercising the relevant examples in the browser at `http://localhost:5555`.

## Contributing

OpenPlans is open source under the [MIT license](./LICENSE.md). Contributions are welcome.

- For the change workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md).
- For repository-specific agent instructions, see [AGENTS.md](./AGENTS.md).
- To report a bug or request a feature, open an issue on [GitHub](https://github.com/OpenGeometry-io/OpenPlans/issues).
