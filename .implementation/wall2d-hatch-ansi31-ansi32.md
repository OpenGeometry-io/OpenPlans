# Execution Spec: Wall2D ANSI Hatch Patterns + Stored Implementation Plan

## Summary
Plan Mode is still active, so no repository mutations can be executed yet.  
When execution mode is enabled, implement Wall2D hatch patterns (`ANSI31`, `ANSI32`) with a dropdown in the wall example, keep default hatch as `NONE`, and store this exact plan at `/Users/gangsta/Work/OpenGeometry/OpenPlans/.implementation/wall2d-hatch-ansi31-ansi32.md`.

## Files To Change
1. [wall2D.ts](/Users/gangsta/Work/OpenGeometry/OpenPlans/src/elements/planview/wall2D.ts)
2. [index.ts](/Users/gangsta/Work/OpenGeometry/OpenPlans/src/index.ts)
3. [wall2d.html](/Users/gangsta/Work/OpenGeometry/OpenPlans/examples/elements/2DElements/wall2d.html)
4. Create `/Users/gangsta/Work/OpenGeometry/OpenPlans/.implementation/wall2d-hatch-ansi31-ansi32.md`

## Public API Additions
1. In `Wall2D` module, add:
   - `export enum WallHatchPattern { NONE = "NONE", ANSI31 = "ANSI31", ANSI32 = "ANSI32" }`
2. Extend `WallOptions` with:
   - `wallHatchPattern: WallHatchPattern`
   - `wallHatchColor: number`
3. Add to `Wall2D`:
   - `get/set wallHatchPattern`
   - `get/set wallHatchColor`
4. Re-export from [index.ts](/Users/gangsta/Work/OpenGeometry/OpenPlans/src/index.ts):
   - `WallHatchPattern` alongside existing `Wall2D`/`WallOptions` export.

## Wall2D Implementation Details
1. Add defaults in `propertySet`:
   - `wallHatchPattern: WallHatchPattern.NONE`
   - `wallHatchColor: 0x000000`
2. Replace `setOPConfig` no-op with merge + rebuild:
   - Merge incoming config into `propertySet`.
   - Normalize `points` to `{x,y,z}` objects when provided.
   - Call `setOPGeometry()`.
3. Keep current wall polygon behavior, then append hatch generation from the same polygon vertices.
4. Add constants:
   - `HATCH_SPACING = 0.2` (fixed, per user decision)
   - `HATCH_Y_OFFSET = 0.002`
5. Add hatch lifecycle helpers:
   - `clearHatchGeometry()` disposes/removes all sub-elements whose key starts with `"wallHatch"`.
   - Call this before regenerating and when wall has fewer than 2 points.
6. Add hatch builder methods:
   - `applyHatchPattern(polygonVertices: Vector3[])`
   - `buildHatchSegments(polygon2D, angleDeg, spacing)` returning segment endpoint pairs.
   - `createHatchLineSegments(key, segments)` to create `THREE.LineSegments` with `LineBasicMaterial`.
7. Pattern mapping:
   - `NONE`: no hatch.
   - `ANSI31`: one hatch pass at `45°`.
   - `ANSI32`: two passes at `45°` and `-45°`.
8. Clipping algorithm for hatch lines:
   - Convert polygon to 2D XZ coordinates.
   - Sweep parallel lines by projecting polygon vertices onto line normal.
   - For each sweep line, compute intersections with polygon edges.
   - Sort intersections along line direction and pair them into inside segments.
   - Emit only non-degenerate segments (epsilon filter).
9. Rendering details:
   - Build BufferGeometry positions as `[x, HATCH_Y_OFFSET, z]`.
   - Use `LineBasicMaterial({ color: wallHatchColor })`.
   - Set `line.renderOrder` higher than fill to reduce flicker.

## Example UI Changes
1. In [wall2d.html](/Users/gangsta/Work/OpenGeometry/OpenPlans/examples/elements/2DElements/wall2d.html), import `WallHatchPattern`.
2. Pass hatch defaults when creating wall:
   - `wallHatchPattern: WallHatchPattern.NONE`
   - `wallHatchColor: 0x000000`
3. Add GUI controls:
   - Dropdown: `wallHatchPattern` with `Object.values(WallHatchPattern)`.
   - Color picker: `wallHatchColor`.
4. Control handlers:
   - `wall.wallHatchPattern = value`
   - `wall.wallHatchColor = value`

## Stored Plan Artifact
1. Ensure directory exists: `/Users/gangsta/Work/OpenGeometry/OpenPlans/.implementation`
2. Write this full plan to:
   - `/Users/gangsta/Work/OpenGeometry/OpenPlans/.implementation/wall2d-hatch-ansi31-ansi32.md`

## Verification
1. Run targeted build/type checks feasible in repo:
   - `npm run build-examples` (or equivalent non-mutating check path already used by repo).
2. Manual runtime checks on wall example:
   - Default loads with no hatch.
   - Switching to `ANSI31` shows single 45-degree hatch.
   - Switching to `ANSI32` shows cross hatch.
   - Hatch color changes immediately.
   - Changing wall thickness/points keeps hatch clipped to wall polygon.
   - Switching back to `NONE` removes hatch visuals cleanly.
3. Note: repo currently has pre-existing unrelated TypeScript errors under `npx tsc --noEmit`; do not treat those as regressions from this feature unless new errors are introduced in touched files.

## Assumptions
1. Hatch applies only to `Wall2D`.
2. Hatch spacing is fixed (`0.2`) and not user-configurable.
3. Hatch line color is independent (`wallHatchColor`).
4. Backward compatibility is preserved by defaulting missing hatch fields to `NONE` and black.
