# Tech Debt: Element Loader (.op files)

## What This Is

The plan is to replace individual per-fixture/furniture/appliance HTML examples with a single **Element Loader** example that loads reusable `.op` asset files. Non-spatial furnishing elements (beds, sofas, toilets, kitchen appliances, etc.) are being rebuilt as generic elements on the `feature/drawings` branch instead of the old `2DElements` planview classes.

The Element Loader card has been added to the examples index as "Coming Soon" (`./elements/element-loader.html`).

---

## Shortcomings / Blockers

1. **No `.op` file format defined.** No schema, spec, or reference implementation exists for the `.op` file format. The format needs to define geometry, metadata, versioning, and serialization.

2. **No serializer/deserializer.** No `ElementLoader` class or `.op` parser exists anywhere in the codebase. The `feature/drawings` branch contains datums (levels, grids, reference planes) — not the non-spatial furnishing elements that would be the first `.op` use-case.

3. **`demo.html` imports broken internal paths.** `demo.html` currently imports directly from private `openplans-core` sub-package paths:
   ```js
   import { Bed2D, DiningTable2D, Sofa2D } from './../../src/packages/openplans-core/src/elements/planview/furniture/index.ts';
   import { Bathtub2D, Toilet2D } from './../../src/packages/openplans-core/src/elements/planview/fixtures/index.ts';
   import { Cabinet2D, Island2D } from './../../src/packages/openplans-core/src/elements/planview/kitchen/index.ts';
   import { Washer2D } from './../../src/packages/openplans-core/src/elements/planview/appliances/index.ts';
   ```
   These are not exported from `@opengeometry/openplans` and cannot be resolved by external users. `demo.html` must be rewritten once the new element system is in place.

4. **`catalog/assets/` is empty.** The `examples/src/catalog/assets/` directory exists but contains no `.op` files. There is no asset pipeline or catalog management for distributing `.op` files.

5. **Browser file loading strategy undefined.** Options to decide between:
   - File System Access API (drag-and-drop from disk, Chromium-only)
   - Static URL loading (assets hosted alongside the example)
   - User-provided URL input

6. **No versioning strategy.** The `.op` format will evolve — there is no plan for forward/backward compatibility or a version field in the format.

7. **Integration contract undefined.** It is not specified how the Element Loader hands off parsed geometry to the existing Three.js scene/canvas (`OpenPlans` instance). The API surface needs to be designed before the example can be built.

---

## Next Steps (when unblocking this)

- [ ] Define `.op` file format spec (schema + version field)
- [ ] Implement serializer in `openplans-core`
- [ ] Export `ElementLoader` from `@opengeometry/openplans`
- [ ] Add sample `.op` files to `catalog/assets/`
- [ ] Build `examples/src/elements/element-loader.html`
- [ ] Rewrite `demo.html` to use the new element system
