OpenPlans uses `opengeometry` as a real package dependency for geometry generation and IFC export.

## Local development with sibling OpenGeometry package

### 1. Build OpenGeometry first
OpenPlans depends on the published OpenGeometry package, so you need to build OpenGeometry if you want to use the latest local changes.
You can use OpenGeometry npm package as well directly from npm registry, but for local development, you need to build it from source.
To build OpenGeometry, clone [OpenGeometry Kernel](https://github.com/opengeometry/OpenGeometry-Kernel) and run the following commands from the OpenPlans directory

```bash
cd ../OpenGeometry-Kernel
npm install
npm run build
```

This produces a proper package artifact under `../OpenGeometry-Kernel/dist/opengeometry-X.tgz`.
OpenPlans installs that tarball directly, so local development uses package installation semantics instead of a linked directory.

### 2. Install OpenPlans dependencies

```bash
cd ../OpenPlans
npm install
```

### 3. Run OpenPlans

```bash
npm run dev
```

### 4. Validate OpenPlans

```bash
npm run build
npm test
```

## Package layout

The public package is still `@opengeometry/openplans`, but the repo has internal workspaces:

- `packages/openplans-core`
- `packages/openplans-three`

The root `src/index.ts` file is entry point for the public package and re-exports from the internal workspaces. This allows us to maintain a clean public API while organizing code internally.

## Architecture rules

- `opengeometry` stays domain-neutral.
- `openplans-core` owns semantic BIM data and IFC mapping.
- `openplans-three` owns runtime rendering and compatibility wrappers.
- Appearance fields such as wall, door, frame, and glass colors belong to semantic data and are exported as IFC metadata.

## Examples and Distribution
- All example code is under `examples/src` and is built into `examples/dist/` for distribution.
- Distribution of examples are published at `https://demo.openplans.io/` and are built with the same codebase as the main package, ensuring consistency and ease of maintenance.