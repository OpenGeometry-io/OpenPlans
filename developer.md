OpenPlans uses `opengeometry` as a real package dependency for geometry generation and IFC export.

## Local development with sibling OpenGeometry package

### 1. Build OpenGeometry first

```bash
cd ../OpenGeometry-Kernel
npm install
npm run build
```

This produces a proper package artifact under `../OpenGeometry-Kernel/dist/opengeometry-2.1.0.tgz`.
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

The public package is still `@opengeometry/openplans`, but the repo now has internal workspaces:

- `packages/openplans-core`
- `packages/openplans-three`

The root `src/index.ts` file is only the public facade.

## Architecture rules

- `opengeometry` stays domain-neutral.
- `openplans-core` owns semantic BIM data and IFC mapping.
- `openplans-three` owns runtime rendering and compatibility wrappers.
- Appearance fields such as wall, door, frame, and glass colors belong to semantic data and are exported as IFC metadata.
