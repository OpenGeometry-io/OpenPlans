---
sidebar_position: 3
---

# Semantic IFC Export

OpenPlans exports IFC by generating semantic IFC payloads and handing them to `opengeometry`.

## Flow

1. Create wall, door, and window semantic data.
2. Generate host geometry and hosted openings through `opengeometry`.
3. Map semantic elements to IFC:
   - walls -> `IFCWALL`
   - doors -> `IFCDOOR`
   - windows -> `IFCWINDOW`
4. Serialize IFC through the kernel.

## Example

The canonical example is:

- `examples/export-ifc.html`

It demonstrates:

- semantic wall / door / window creation
- live property and color edits
- semantic document inspection
- direct IFC download

## Runtime API

```ts
const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();

const wall = openPlans.wall2D({ ... });
const door = openPlans.door2D({ ... });
const window2D = openPlans.singleWindow2D({ ... });

const result = await openPlans.exportIfc();
console.log(result.text);
console.log(result.reportJson);
```

## Appearance metadata

V1 exports appearance as semantic metadata in `Pset_OpenPlansAppearance`, not as full IFC presentation styling.
