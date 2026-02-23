# OpenPlans Project Context

## Overview
OpenPlans is a 2D drawing and floorplan generation library built on top of the OpenGeometry Kernel and Three.js. It allows users to create architectural elements (walls, doors, windows, dimensions, stairs, slabs, etc.) and generate headless floorplans from JSON data. It supports headless PDF exports and high-quality rendering.

## Technologies Used
- **TypeScript**: Core codebase is written in typed TS.
- **Three.js**: Rendering backend for 2D/3D geometries, materials, handling the camera, and UI overlays (`THREE.Sprite`, `THREE.Mesh`, etc.).
- **Vite**: Used for the local development server and example building (`npm run dev`). The server usually runs on `localhost:5555`.
- **Rollup**: Used for the final production build (`npm run build`).
- **OpenGeometry Kernel**: A dependency providing fundamental geometric calculations, which is bundled or built locally when making deep changes.

## Directory Structure
- `src/`: Core TypeScript source files.
  - Subdirectories include `dimensions`, `elements`, `helpers`, `primitives`, `layouts`, `shapes`, etc.
  - `src/index.ts`: The main entry point file. New components must be exported here.
- `examples/`: HTML pages and JS scripts that demo features.
  - During development, testing is done through these HTML files. 
- `scripts/`: Custom Node.js scripts that automate tasks (e.g., `generate-thumbnails.js`).
- `docs/`: A Docusaurus-based documentation site. Modifications to dev APIs require corresponding updates here.
- `dist/`: The output folder when the library is built for publishing.

## Common Architecture Patterns
1. **Examples Setup**: Every significant component generally has a corresponding HTML example. For instance, testing a new dimension type involves creating a scene via OpenPlans and mapping the controls using `dat.gui` or `lil-gui` for interaction.
2. **Scene & Camera Setup**: Often, components switch `CameraMode` (e.g., `CameraMode.Plan`) to properly align 2D designs.
3. **Event Tracking**: Mixpanel is integrated in the build process via a comment signature `<!-- MIXPANEL_TRACKING -->` injected via Vite plugins in `examples-dist/`.
4. **Thumbnails Generation**: Tools exist (like `thumbnail-generator.html`) run via puppeteer in scripts to automate snapshots of dimensions or shapes.
