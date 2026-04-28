<p align="center">
  <a href="https://opengeometry.io">
    <img src="https://raw.githubusercontent.com/OpenGeometry-io/.github/main/profile/opengeometryTextLogo.png" alt="OpenGeometry" />
  </a>
</p>

<h1 align="center">OpenPlans</h1>

<p align="center">
  <strong>Browser-native floor-planning, drawing, and BIM export &mdash; built on the <a href="https://opengeometry.io">OpenGeometry</a> kernel.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@opengeometry/openplans"><img src="https://img.shields.io/npm/v/@opengeometry/openplans?style=flat-square&color=4460FF&label=npm" alt="npm version" /></a>
  <a href="./LICENSE.md"><img src="https://img.shields.io/github/license/OpenGeometry-io/OpenPlans?style=flat-square" alt="license" /></a>
  <a href="https://opengeometry.io"><img src="https://img.shields.io/badge/built%20on-OpenGeometry-4460FF?style=flat-square" alt="built on OpenGeometry" /></a>
  <a href="https://threejs.org"><img src="https://img.shields.io/badge/three.js-000000?style=flat-square&logo=three.js&logoColor=white" alt="three.js" /></a>
  <a href="https://discord.com/invite/cZY2Vm6E"><img src="https://img.shields.io/badge/Discord-Join%20us-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
  <a href="https://x.com/openGeometry"><img src="https://img.shields.io/badge/Twitter-Follow-1DA1F2?style=flat-square&logo=x&logoColor=white" alt="Twitter" /></a>
  <a href="https://linkedin.com/company/openGeometry"><img src="https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
</p>

<p align="center">
  <a href="https://openplans.io">Website</a> ·
  <a href="https://docs.openplans.io">Documentation</a> ·
  <a href="https://demo.openplans.io">Live Demos</a> ·
  <a href="https://www.npmjs.com/package/@opengeometry/openplans">npm</a> ·
  <a href="https://opengeometry.io">OpenGeometry Kernel</a>
</p>

---

> **Actively maintained.** OpenPlans ships regular updates and welcomes bug reports, feature requests, and contributions on [GitHub](https://github.com/OpenGeometry-io/OpenPlans/issues).

## What is OpenPlans?

OpenPlans is a TypeScript toolkit for authoring architectural plans in the browser. It gives architects, BIM developers, and AEC tooling teams a single, integrated environment to:

- Draft 2D and 3D architectural elements (walls, doors, windows, openings, floors)
- Place reference datums (levels, grids, section lines, elevation markers, project origin)
- Compose printable drawing sheets with linked viewports and dimensions
- Export to **IFC** (semantic BIM), **PDF** (vector sheets), and **DXF** (CAD interchange)

Under the hood, every piece of geometry is generated and operated on by the [OpenGeometry](https://opengeometry.io) kernel — a Rust + WebAssembly CAD kernel that runs entirely in the browser. OpenPlans is the architectural-domain layer; OpenGeometry is the geometry engine.

## Built on OpenGeometry

OpenPlans does not implement its own geometry. Every wall extrusion, every CSG cut for a window, every B-rep solid that ends up in the IFC export is computed by the [**OpenGeometry**](https://opengeometry.io) kernel.

| OpenGeometry provides | OpenPlans turns it into |
|---|---|
| `Polygon`, `Solid`, `Sweep` | Walls, slabs, openings |
| `Arc`, `Line`, `Polyline`, `Rectangle` | 2D primitives and door swing arcs |
| `Cuboid`, `Cylinder` | Catalog furniture and fixtures |
| Boolean operations (`subtract`, polygon-with-holes) | Doors and windows cut into walls |
| IFC B-rep serialization | Standards-compliant `IFCWALL`, `IFCDOOR`, `IFCWINDOW` |

This separation means OpenPlans inherits OpenGeometry's robustness, AI-friendly API surface, and IFC fidelity for free, while focusing on the architectural domain — semantic elements, sheets, dimensions, and exports.

If you need lower-level geometry primitives directly, work with [OpenGeometry](https://opengeometry.io). If you are building floor plans, drawing sets, or BIM export pipelines in the browser, OpenPlans is the higher-level toolkit you want.

## When to use OpenPlans

- You're building a browser-based **architectural design**, **space-planning**, or **BIM authoring** tool.
- You need to emit **semantically valid IFC** (with property sets and B-rep geometry) directly from the browser.
- You need both **2D plan views** and **3D model views** of the same building, in sync.
- You need to compose and export **printable drawing sheets** (PDF / DXF) without a server round-trip.
- You want an AI-friendly, declarative API for floor plans and architectural elements.

If you only need a CAD geometry kernel without the architectural semantics, use [OpenGeometry](https://opengeometry.io) directly.

## Quick Start

```bash
npm install @opengeometry/openplans three camera-controls lil-gui
```

```ts
import { CameraMode, OpenPlans } from "@opengeometry/openplans";

const container = document.getElementById("app");
if (!container) throw new Error("Missing app container");

const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();   // boots the OpenGeometry WASM kernel

openPlans.CameraMode = CameraMode.Plan;

const wall = openPlans.singleWall();
wall.position.set(2, 0, 0);
```

`setupOpenGeometry()` must complete before creating any geometry-backed content — it loads and initializes the OpenGeometry WASM module that powers the rest of the API.

## Features

**Primitives** — Line, Arc, Polyline, Rectangle

**Shapes** — Cuboid, Cylinder, Wedge

**Architectural Elements** — SingleWall, PolyWall, WallOpening, Door, Window

**Reference Datums** — Levels, Grids, ReferencePlanes, SectionLines, ElevationMarkers, ProjectOrigin

**Drawing Helpers** — PaperFrame (A4 / A3 / A2, portrait & landscape), ViewportBlock, Dimensions (line / angle / radius), DynamicTextBlock, LogoBlock

**Catalog** — Furniture (Chair, Sofa, Bed, Desk, DiningTable, Wardrobe), Kitchen (Counter, Cabinet, Island, KitchenSink, Stove, Refrigerator, Dishwasher, Washer), Fixtures (Bathtub, Shower, Sink, Toilet, Bidet, Urinal), Landscape (Tree, Shrub, Planter, Fountain)

**Camera Modes** — `CameraMode.Plan` (orthographic top-down), `CameraMode.Model` (perspective 3D)

**Themes** — `light`, `dark`, `darkBlue`

**Exports** — IFC (semantic BIM with property sets), PDF (vector sheets via jsPDF), DXF (CAD interchange)

The document-first views/sheets API (`document-sheet-editor`) is available as a preview. The paper-frame PDF path, architectural elements, primitives, and IFC export are the primary production APIs.

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

await openPlans.exportPaperFrameToPDF(paperFrame, { fileName: "sheet-a101.pdf" });
```

## IFC Export

OpenPlans emits semantically valid IFC with B-rep geometry produced by the OpenGeometry kernel. Walls become `IFCWALL`, doors become `IFCDOOR`, windows become `IFCWINDOW`, each carrying the property sets you'd expect from a BIM authoring tool. See [docs.openplans.io](https://docs.openplans.io) for the full IFC workflow and property set reference.

## Demos

Live demos: [demo.openplans.io](https://demo.openplans.io)

To run the example gallery locally:

```bash
npm install
npm run dev
# open http://localhost:5555
```

Useful entry points by category:

**General** — [Demo](./examples/src/demo.html) · [IFC export](./examples/src/export-ifc.html) · [DXF export](./examples/src/dxf-export/index.html)

**Elements** — [Single wall](./examples/src/elements/solids/single-wall.html) · [Polyline wall](./examples/src/elements/solids/polyline-wall.html) · [Wall opening](./examples/src/elements/solids/wall-opening.html) · [Door](./examples/src/elements/openings/door.html) · [Window](./examples/src/elements/openings/window.html) · [Opening](./examples/src/elements/openings/opening.html)

**Primitives** — [Line](./examples/src/primitives/line.html) · [Arc](./examples/src/primitives/arc.html) · [Polyline](./examples/src/primitives/polyline.html) · [Rectangle](./examples/src/primitives/rectangle.html)

**Shapes** — [Cuboid](./examples/src/shapes/cuboid.html) · [Cylinder](./examples/src/shapes/cylinder.html)

**Datums** — [All datums](./examples/src/datums/all-datums.html) · [Level](./examples/src/datums/level.html) · [Grid](./examples/src/datums/grid.html) · [Section line](./examples/src/datums/section-line.html) · [Elevation marker](./examples/src/datums/elevation-marker.html) · [Reference plane](./examples/src/datums/reference-plane.html) · [Project origin](./examples/src/datums/project-origin.html)

**Dimensions** — [Line](./examples/src/dimensions/line-dimension.html) · [Angle](./examples/src/dimensions/angle-dimension.html) · [Radius](./examples/src/dimensions/radius-dimension.html)

**Drawings & Sheets** — [Paper frame export](./examples/src/drawings/paper.html) · [Viewport block](./examples/src/drawings/viewport-block.html) · [Dynamic text block](./examples/src/drawings/dynamic-text-block.html) · [Logo block](./examples/src/drawings/logo-block.html)

**Views** — [View creation](./examples/src/views/view-creation.html)

## Documentation

Full product documentation lives at **[docs.openplans.io](https://docs.openplans.io)** — generated by our auto-docs pipeline and kept in sync with the published package.

For lower-level geometry kernel docs, see **[docs.opengeometry.io](https://docs.opengeometry.io)**.

## Architecture

OpenPlans is organized as two internal packages under `src/packages/`:

- **`openplans-core`** — semantic BIM layer. Owns element types (primitives, shapes, architectural elements, datums, catalog), layout/view management, dimensions, and IFC/PDF/DXF exporters. Has no direct renderer dependency.
- **`openplans-three`** — Three.js runtime. Owns scene setup, the render loop, camera (Plan/Model modes), grid, and Three.js helpers. Consumes `openplans-core` types and drives them through the OpenGeometry kernel.

The `OpenPlans` class in `src/index.ts` is the public facade that wires both packages together and is the primary entry point for application code.

## Repository Layout

```text
src/index.ts                         Public facade and top-level exports
src/packages/openplans-core/src/     Primitives, shapes, elements, layouts, exporters
src/packages/openplans-three/src/    Three.js runtime, camera, grid, helpers
examples/src/                        Browser examples used for manual verification
dist/                                Generated library output (do not edit)
examples/dist/                       Generated example site output (do not edit)
```

## Build From Source

Prerequisites: Node.js 18 or newer, npm.

```bash
npm install
npm run build
```

Useful commands:

- `npm run dev` — start the Vite example server on port `5555`
- `npm run build` — build the library into `dist/`
- `npm run build-examples` — build the example site into `examples/dist/`

For local development against a sibling OpenGeometry kernel checkout, see [developer.md](./developer.md).

## Who is this for?

- **AEC software teams** building browser-based plan editors, schematic-design tools, or BIM viewers.
- **Architects and design technologists** prototyping spatial tools without a desktop CAD installation.
- **AI / agent builders** generating buildings programmatically and exporting to standards-compliant IFC.
- **OpenGeometry users** who need an architectural-domain layer instead of working with raw geometry.

## Community

- **Discord** — [Join us](https://discord.com/invite/cZY2Vm6E)
- **Twitter / X** — [@openGeometry](https://x.com/openGeometry)
- **LinkedIn** — [OpenGeometry](https://linkedin.com/company/openGeometry)
- **GitHub Issues** — [Report a bug or request a feature](https://github.com/OpenGeometry-io/OpenPlans/issues)

## Contributing

OpenPlans is open source under the [MIT license](./LICENSE.md). Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow.

---

<p align="center">
  <sub><em>OpenPlans is part of the <a href="https://opengeometry.io">OpenGeometry</a> family — a browser-native CAD ecosystem.</em></sub>
</p>
