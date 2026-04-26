# Codebase Audit Report

Generated: 2026-04-26  
Branch: `claude/fix-vite-entry-point-L6JJx`

---

## 1. Dead Files (Never Imported)

These files exist on disk but have zero imports anywhere in the active codebase.

| File | Description | Action |
|------|-------------|--------|
| `src/parser/IGraph.ts` | TypeScript interfaces for a graph-based building data model (Floor, Room, Wall, Door, Window, Coordinates). No imports anywhere. | Delete or move to a `drafts/` folder |
| `src/parser/ImpleniaConverter.ts` | Converts Implenai/Implenia-format JSON to floor plan objects. Only imports from `IGraph.ts`. Never wired into `src/index.ts` or any other file. | Delete or integrate |
| `src/tools/pencil.ts` | Interactive CSS2D cursor + raycasting drawing tool (`PencilMode`: draw/erase/select/cursor/view). All references in `src/index.ts` are commented out. | Delete or integrate |
| `mint.json` (root) | Essentially empty: `{"name": "OpenGeometry", "navigation": []}`. The real docs config lives at `docs/docs.json` (Mintlify v2). | Delete root `mint.json` |

---

## 2. Commented-out Code Blocks

### 2a. Entire barrel index is commented out — `src/packages/openplans-core/src/elements/catalog/index.ts`

All six category exports are commented out. The element classes ARE fully implemented in their source files and ARE re-exported directly from `src/index.ts`, so this barrel is functionally dead:

```ts
// export * from "./furniture";
// export * from "./fixtures";
// export * from "./appliances";
// export * from "./kitchen";
// export * from "./landscape";
// export * from "./stair";
```

**Affected categories:** `furniture.ts`, `fixtures.ts`, `appliances.ts`, `kitchen.ts`, `landscape.ts`, `stair.ts`  
**Action:** Either uncomment all lines (re-enabling the catalog barrel) or delete the file since `src/index.ts` bypasses it.

---

### 2b. Commented-out exports in other index files

| File | Commented export | Implementation status |
|------|------------------|-----------------------|
| `src/packages/openplans-core/src/elements/solids/index.ts` | `// export * from "./slab"` | `slab.ts` exists and is implemented; also commented out in `src/index.ts` |
| `src/packages/openplans-core/src/layouts/index.ts` | `// export * from './row-info-block'` | `row-info-block.ts` exists and is implemented; also referenced in commented code in `paper-frame.ts` |

---

### 2c. Disabled subsystems in `src/index.ts` (`OpenPlans` class)

The main `OpenPlans` facade has large commented-out blocks representing unfinished or deferred subsystems:

| Subsystem | Code Location | State |
|-----------|---------------|-------|
| `WallSystem` | `src/index.ts:41,80,104,179` | Class likely exists; `getWallSystem()` method has empty body |
| `Glyphs` (text rendering) | `src/index.ts:107,119–121` | References `Glyphs.loadFaces`, `Glyphs.scene`, `Glyphs.camera` |
| `labelRenderer` (CSS2D) | `src/index.ts:110,140–143` | CSS2DRenderer setup and render loop disabled |
| `profileViews` (section views) | `src/index.ts:145–150` | Multiple profile camera/renderer pairs disabled |
| `ShapeSelector` | `src/index.ts:133` | Pencil-based shape selection disabled |
| `ShapeEditor` | `src/index.ts:134` | Pencil-based shape editing disabled |
| `theme()` method | `src/index.ts:162–164` | `openThree.applyTheme()` disabled |

---

### 2d. Commented-out element factory methods in `OpenPlans` (lines ~257–380)

All furniture, fixture, appliance, kitchen, and landscape convenience methods on the `OpenPlans` class are commented out. The underlying classes ARE imported at the top of `src/index.ts` and ARE exported from the package — users can call `new Chair()` directly. Only the fluent `openplans.chair()` API is missing.

**Furniture:** `chair`, `sofa`, `bed`, `wardrobe`, `desk`, `diningTable`  
**Fixtures:** `toilet`, `sink`, `shower`, `bathtub`, `bidet`, `urinal`  
**Appliances:** `refrigerator`, `stove`, `washer`, `dishwasher`, `kitchenSink`  
**Kitchen:** `counter`, `cabinet`, `island`  
**Landscape:** `tree`, `shrub`, `planter`, `fountain`, `bench` (and more likely)  
**Other elements:** `doubleDoor`, `doubleWindow`, `slab`, `stair`, `board`, `space`

**Action:** Uncomment all factory methods to complete the `OpenPlans` fluent API, or document that these must be instantiated directly.

---

## 3. TODO / FIXME Items

| File | Line | Comment |
|------|------|---------|
| `src/index.ts` | 84 | `TODO: Make ViewManager optional later and lazy load when needed` |
| `src/packages/openplans-core/src/elements/openings/opening.ts` | 62 | `TODO: Fix placement, something is wrong.` — **potential bug** |
| `src/packages/openplans-core/src/types.ts` | 9 | `TODO: Maybe we can change this to use Point3D` |
| `src/packages/openplans-core/src/view-manager/view.ts` | 33 | `TODO:` *(empty — should be filled in or removed)* |
| `src/packages/openplans-core/src/view-manager/view.ts` | 63 | `TODO: Inactive views can be offloaded to save memory` |
| `src/packages/openplans-core/src/view-manager/view.ts` | 70 | `TODO: Add error handling for properties` |
| `src/packages/openplans-core/src/primitives/polyline.ts` | 12 | `TODO: Add a method to modify individual points` |
| `src/packages/openplans-core/src/primitives/polyline.ts` | 13 | `TODO: Either implement modifying all points or provide API access` |
| `src/packages/openplans-core/src/dimensions/index.ts` | 33 | `TODO: Add type safety, create interfaces for different dimension types` |
| `src/packages/openplans-core/src/dimensions/index.ts` | 54 | `TODO:` *(empty — should be filled in or removed)* |
| `src/packages/openplans-core/src/layouts/logo-info-block.ts` | 25 | `TODO: Add a method to set the background color (needs Polygon)` |
| `src/packages/openplans-core/src/layouts/paper-frame.ts` | 107 | `TODO: Implement setOPMaterial properly` |
| `src/packages/openplans-core/src/layouts/paper-frame.ts` | 130 | `TODO: Figure out best way to retain ogid when calling parent elements` |
| `src/packages/openplans-core/src/layouts/paper-frame.ts` | 183 | `TODO: Material/Color changes should be applied here` |
| `src/packages/openplans-core/src/layouts/row-info-block.ts` | 40 | `TODO: Add a method to set the background color (needs Polygon)` |
| `src/packages/openplans-core/src/primitives/arc.ts` | 94 | `TODO: Create Enums for properties` |

---

## 4. Examples with Broken / Outdated Dependencies

These example HTML files depend on code that is disabled or deleted:

| Example File | Problem |
|--------------|---------|
| `examples/src/glyph/glyph.html` | Uses `Glyphs` system which is fully disabled in `src/index.ts` |
| `examples/src/object-Generated-Plans/impleniaJsonToFloorplans.html` | Depends on `ImpleniaConverter` which is never exported from the package |
| `examples/src/object-Generated-Plans/jsonGeneratedPlans.html` | Likely related to the parser pipeline; verify if it still works |
| `examples/src/views/view-creation.html` | Depends on profile/section view rendering which is commented out |

---

## 5. Priority Summary

| Priority | Item |
|----------|------|
| High | `opening.ts:62` — `TODO: Fix placement, something is wrong` (active bug) |
| High | Uncomment or delete `src/tools/pencil.ts`, `src/parser/` (dead code clutters the tree) |
| High | Delete root `mint.json` (confusing empty config alongside real `docs/docs.json`) |
| Medium | Uncomment factory methods in `src/index.ts` to complete the fluent API |
| Medium | Fix or remove broken example files (glyph, impleniaJsonToFloorplans, view-creation) |
| Medium | `TODO: Implement setOPMaterial properly` in `paper-frame.ts` |
| Low | Empty TODOs in `view.ts:33` and `dimensions/index.ts:54` |
| Low | `polyline.ts` — add point modification API |
| Low | `arc.ts` — Create Enums for properties |
| Low | Decide fate of `WallSystem`, `Glyphs`, `labelRenderer`, `profileViews` subsystems |
