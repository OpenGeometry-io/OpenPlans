# OpenPlans

Floor-planning, drawing, and export toolkit for the web, built on top of OpenGeometry and Three.js.

[OpenGeometry](https://opengeometry.io) · [OpenGeometry Docs](https://docs.opengeometry.io) · [Repo Docs](./docs/README.md) · [Examples](./examples)

---

> **Actively under development.** OpenPlans is evolving in the open. APIs, examples, and docs are still being refined, so breaking changes are still possible.

---

## What is OpenPlans?

OpenPlans is the higher-level application layer built on top of [`opengeometry`](https://github.com/OpenGeometry-io/OpenGeometry). It combines browser-native rendering, floor-plan oriented primitives and elements, drawing helpers, and export workflows in a single package.

Whether you're building a floor-planning editor, a browser-based drawing workflow, or a geometry-heavy design tool with plan-view semantics, OpenPlans gives you an application-focused layer on top of the OpenGeometry kernel without leaving JavaScript.

### What you can do today

| Category | Capabilities |
| --- | --- |
| Runtime | Three.js-powered scene setup, camera modes, view fitting, browser rendering |
| Primitives | Lines, arcs, polylines, rectangles |
| Shapes | Cuboids, cylinders |
| Elements | Walls, doors, windows, and floor-plan oriented examples |
| Layouts | Paper frames, viewport blocks, and drawing-oriented helpers |
| Dimensions | Line, angle, and radius dimensions |
| Exports | IFC-oriented workflows through OpenGeometry and vector line export through `PlanPDFGenerator` |
| Integration | One package that bridges OpenGeometry kernel setup with an application-facing API |

## Examples

The repository includes browser examples for primitives, shapes, semantic elements, plan-view drawing blocks, and export workflows.

Start here:

- [Floor plan demo](./examples/demo.html)
- [Semantic IFC export](./examples/export-ifc.html)
- [Door 2D with vector/PDF export](./examples/elements/2DElements/baseDoor.html)
- [Window 2D with vector/PDF export](./examples/elements/2DElements/baseWindow.html)
- [Wall 2D with vector/PDF export](./examples/elements/2DElements/wall2D.html)

## Quick Start

Install from npm:

```bash
npm install @opengeometry/openplans three camera-controls lil-gui
```

```ts
import { CameraMode, OpenPlans } from "@opengeometry/openplans";

const container = document.getElementById("app");
const openPlans = new OpenPlans(container);

await openPlans.setupOpenGeometry();
openPlans.CameraMode = CameraMode.Plan;

const wall = openPlans.wall();
wall.position.set(2, 0, 0);
```

The package also exports drawing and export helpers such as `PlanPDFGenerator`, `PaperFrame`, `ViewportBlock`, `LineDimension`, `AngleDimension`, and `RadiusDimension`, along with core element classes like `Wall`, `Door`, and `Window`.

## Documentation

OpenPlans documentation currently lives in this repository:

- [Introduction](./docs/docs/intro.md)
- [Semantic Architecture](./docs/docs/semantic-architecture.md)
- [Semantic IFC Export](./docs/docs/semantic-ifc-export.md)
- [Colors and Appearance](./docs/docs/colors-and-appearance.md)
- [Create Wall Tutorial](./docs/docs/tutorial-create-elements/create-wall.md)

If you need kernel-level geometry docs as well, see [docs.opengeometry.io](https://docs.opengeometry.io).

## Repository Structure

```text
src/index.ts                      Public facade package
src/packages/openplans-core/      Semantic document, primitives, shapes, elements, exporters
src/packages/openplans-three/     Three.js runtime, camera, grid, helpers
examples/                         Browser examples and demos
docs/                             Docusaurus documentation source
tests/                            Node-based verification against the built package
```

## Building from Source

**Prerequisites:** Node.js and npm

```bash
npm install
npm run build
npm run dev
```

`npm run dev` starts the Vite example server for local browser work.

The repository also includes `npm test`, but as of 2026-03-29 that suite is out of sync with the built package and still expects a `PlanDocument` export that `dist/index.js` does not currently provide.

## Who is this for?

- Teams building browser-based floor-planning or BIM-adjacent tools
- Developers who want OpenGeometry-powered CAD behavior with a higher-level application layer
- Contributors exploring semantic document workflows plus Three.js rendering
- Anyone prototyping plan-view authoring or export pipelines on the web

## Contributing

OpenPlans is open source under the [MIT license](./LICENSE.md). Contributions are welcome through [GitHub Issues](https://github.com/opengeometry-io/openplans/issues) and pull requests.

## AI Agent Workflow

- Repository-level AI agent instructions live in [AGENTS.md](./AGENTS.md).
- Non-trivial work should be documented in the research brain under [brain/](./brain/README.md).
