# Wall Openings — Spec Debt Against the OpenGeometry Kernel

This note lists the kernel-side gaps that keep the wall + opening boolean
pipeline from being fully correct when a single wall (or polyline wall) hosts
multiple doors / windows / plain openings. Each item is scoped tightly so the
kernel work can be sized independently.

Current boolean call sites:

- `SingleWall.resolveOpenings()` — `wall2D.subtract([...opening2D])` and
  `wall3D.subtract([...opening3D])`.
- `PolyWall.resolveOpenings()` — same two calls, passing
  `{ color, outline }` render options.

All of the items below assume `opengeometry@^2.0.6`.

## 1. `Polygon.subtract(operands)` — XZ coplanarity rules are undocumented

**Symptom.** Plan-view (`profileView`) cuts for windows can silently produce
empty or partial results. The window's 2D polygon is lifted to
`y = sillHeight - frameWidth` (see `window.ts` `createOpening`) while the
wall's 2D polygon sits at `y = 0`. They are coplanar in projection (XZ) but
not in strict 3D.

**What we need from the kernel.**

- Declare whether `Polygon.subtract` treats operands as XZ projections or as
  strict 3D coplanar polygons.
- If XZ-projected, document the tolerance for "approximately coplanar".
- If strict, expose a way to ask for projection-based subtraction, or accept
  a `{ plane: "xz" }` hint.

Once this is nailed down, `Window.createOpening` can stop encoding `baseHeight`
into the Y coordinate of the opening line. See item 3 below.

## 2. `Solid.subtract(operands)` — robustness with many near-coplanar cutters

**Symptom.** When multiple openings sit on the same wall face, their cut
solids share three coplanar faces with the wall (outer, inner, and top/bottom
if sills differ by `< epsilon`). Kernel output occasionally "leaks" —
inner-surface sliver faces remain or boundary edges are duplicated.

**What we need from the kernel.**

- A stable `tolerance` parameter that applies uniformly across all N cutters
  in a single `executeBooleanSubtractionMany` call. Today we can pass
  `options.kernel.tolerance`, but the shape-level `.subtract` documentation
  does not confirm whether it is respected when the cutter list is an array.
- Ideally a kernel-side merge pass that recognises coincident faces between
  cutters and removes the resulting sliver faces before returning the BRep.
- Failure telemetry: `BooleanReport.empty = true` with the current cutter
  index so the wall layer can surface which opening caused a degenerate cut.

## 3. `Opening.baseHeight` needs real kernel-level support

**Current state in the app.** `Opening.setOPGeometry` builds a 2D polygon
from the opening's line with its Y set by the points' Y. `baseHeight` on
`OpeningOptions` is stored but ignored. `Window` works around this by
pushing its own `baseHeight` into the opening's point Y. `Door` always uses
Y = 0, so doors happen to work.

**What we need from the kernel.** Nothing strictly — the fix is app-side:
translate the extruded solid up by `baseHeight` after `polygon.extrude`, and
lift the 2D polygon by `baseHeight` only when the kernel confirms item 1.
But see item 4 — the cleanest path is a parametric wrapper.

This item is deferred until item 1 is resolved so we can stop double-encoding
the sill height. A follow-up PR in this repo will align Window, Opening, and
Door around a single `baseHeight` semantics once item 1 is locked.

## 4. Parametric opening-as-cutter wrapper

**Symptom.** Today every opening owns a `Polygon` (2D) and a `Solid` (3D)
that are rebuilt on every property change, and the wall treats them as
passive meshes passed to `.subtract`. The kernel already has
`opengeometry/src/shapes/opening.d.ts` with `Opening.subtractFrom(host)` —
exactly the API we want, but it takes a `center + width + height + depth`
and ignores our polyline-based points / host-wall local space.

**What we need from the kernel.**

- A constructor or factory that accepts our current inputs (wall-local
  start/end points, thickness, height, baseHeight) and produces a
  boolean-ready cutter, so we do not have to maintain the manual
  `Polygon → extrude → Solid` pipeline.
- A batch helper: `host.applyCutters([cutter1, cutter2, ...])` that returns
  one `BooleanResult` and guarantees identical numerical behaviour to the
  current `executeBooleanSubtractionMany`.
- A way to update a cutter in place (dimension/position change) without
  rebuilding the host's BRep on the JavaScript side.

This is the biggest item; it is what lets `attachOpenings([...])` actually
amortise kernel cost and what lets opening-edit callbacks stop invalidating
the wall's base geometry.

## 5. Polyline-wall bevelled corners vs. rectangular openings

**Symptom.** A `PolyWall`'s 2D footprint bevels corners via
`Polyline.getOffset(..., bevel=true)`. A user-placed opening near a corner
is an axis-aligned rectangle perpendicular to *its own* line, not to the
segment it lives on. Result: the cutter polygon partially escapes the wall
polygon and `.subtract` trims it, which looks like a bite out of the wall on
the outer face near the corner.

**Two kernel-side options.**

- A `Polygon.subtract(operand, { segmentId })` variant that restricts the
  boolean to the area of a named segment of the host polyline. This would
  require the host polygon to carry a segment-index tag per edge —
  invasive.
- A geometric helper to clip an opening rectangle against the nearest
  polyline segment band before subtraction. Lighter weight, and could live
  in the app layer if the kernel exposes `polyline.getSegmentBand(index)`.

**App-side workaround we can ship without kernel help.** Validate at
`attachOpening` time that the opening's line lies fully on a single segment
of the host polyline and log a warning otherwise. Deferred until we agree
on the direction above.

## 6. BooleanResult reuse across re-solves

**Symptom.** Every call to `wall.resolveOpenings()` constructs a new
`BooleanResult` mesh, and the previous one is disposed and detached.
Interactive sliders in the example GUIs can resolve hundreds of times in a
few seconds.

**What we need from the kernel.** A `BooleanResult.update(kernelResult)`
path that reuses the existing `THREE.Mesh` + `BufferGeometry` instead of
allocating new ones. Optional but impactful for editor-style workflows.

---

## Summary for the kernel maintainer

If you want to triage in priority order for wall/opening correctness:

1. Item 1 — clarify `Polygon.subtract` planarity semantics. Blocks item 3.
2. Item 2 — tolerance + sliver cleanup for many-cutter `Solid.subtract`.
3. Item 4 — parametric opening-as-cutter with in-place update.
4. Item 5 — segment-aware cutting for polyline walls.
5. Item 6 — `BooleanResult` reuse.

Items 3 and 5's app-side parts are tracked as TODOs in this repo and will
land as a follow-up PR once the kernel pieces are available.
