---
sidebar_position: 2
---

# Semantic Architecture

OpenPlans now separates semantic BIM authoring from rendering.

## Internal layout

- `@opengeometry/openplans-core`
  - semantic document
  - wall / door / window specs
  - geometry generation through `opengeometry`
  - IFC mapping
- `@opengeometry/openplans-three`
  - Three.js runtime
  - editor/runtime APIs
  - compatibility factories such as `wall2D`, `door2D`, and `singleWindow2D`

## Public package

Users still import a single package:

```ts
import { OpenPlans, PlanDocument } from "@opengeometry/openplans";
```

The root package is a facade over the internal workspaces.

## Source of truth

The semantic document is the source of truth.

- semantic elements describe walls, doors, and windows
- geometry is derived from those semantic elements
- IFC classes and property sets are authored in `openplans-core`
- final IFC text is serialized by `opengeometry`

This is the same application-vs-kernel split used by traditional CAD systems.
