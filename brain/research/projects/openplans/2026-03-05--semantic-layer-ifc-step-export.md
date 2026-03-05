---
id: project-2026-03-05-semantic-layer-ifc-step-export
title: Semantic Layer Wiring for IFC/STEP Export in OpenPlans
status: active
created: 2026-03-05
updated: 2026-03-05
tags: [project, research, ifc, step, semantics]
project: openplans
topic: semantic-export
sources:
  - /Users/gangsta/Work/OpenGeometry/OpenPlans/developer.md
  - /Users/gangsta/Work/OpenGeometry/OpenPlans/src/index.ts
  - /Users/gangsta/Work/OpenGeometry/OpenPlans/src/kernel/index.js
decisions:
  - Keep semantics authored in OpenPlans and injected as IFC sidecar during export.
  - Keep STEP export semantics-agnostic and geometry-only.
  - Default export policy in OpenPlans should be BestEffort with require_closed_shell=false for plan-view entities.
next_actions:
  - Gather importer-specific validation feedback from target CAD/BIM apps and tune defaults.
  - Add an optional UI panel for editing full property_sets/quantity_sets JSON in-app.
---

# Summary

## Context

OpenPlans currently exports IFC in examples through an external HTTP endpoint, while the kernel now supports scene-level IFC/STEP export and IFC semantics sidecar.

## Goal

Implement semantic assignment in OpenPlans and wire exports to in-kernel `exportSceneToIfc(...)` and `exportSceneToStep(...)`.

## Findings

- OpenPlans kernel bundle now exposes `OGSceneManager`, `exportSceneToIfc`, and `exportSceneToStep`.
- OpenPlans entities maintain `ogid` and `ogType`, which can be used as scene entity IDs and default semantic hints.
- Promoted reusable API pattern note:
  - `/Users/gangsta/Work/OpenGeometry/OpenPlans/brain/research/topics/api-design/semantic-export--openplans-sidecar-pattern.md`

## Decision Log

- Decision: Semantic ownership stays in OpenPlans; IFC class assignment is set per element and passed at export time.
- Why: Keeps user workflow and domain metadata in app-layer while preserving kernel as geometry/export engine.
- Alternatives Rejected: Kernel-owned semantic state for all entities.
- Evidence: `OpenPlans.setIfcSemantics(...)`, `OpenPlans.exportSceneToIfc(...)`.

- Decision: Add OpenPlans native `exportSceneToIfc(...)` and `exportSceneToStep(...)` methods using `OGSceneManager`.
- Why: Removes dependency on external HTTP export service and makes export deterministic from current scene state.
- Alternatives Rejected: Keeping backend `fetch("generate_ifc")` as primary flow.
- Evidence: Updated `src/index.ts` and `examples/export-ifc.html`.

- Decision: Default to `BestEffort` with `require_closed_shell: false` in OpenPlans export wrappers.
- Why: Most plan-view entities are 2D/non-closed and would be dropped in strict closed-shell mode.
- Alternatives Rejected: Strict closed-shell defaults in OpenPlans UI-facing wrappers.
- Evidence: Export config defaults in `OpenPlans.exportSceneToIfc(...)` and `OpenPlans.exportSceneToStep(...)`.

## Risks

- Plan-view elements may not be closed solids; strict IFC/STEP export may skip them.

## Validation Evidence

- `npm --prefix /Users/gangsta/Work/OpenGeometry/OpenPlans run build` completed successfully.
- `npm --prefix /Users/gangsta/Work/OpenGeometry/OpenPlans run build-examples` completed successfully.
- `examples-dist/examples/export-ifc.html` is generated with semantic assignment and IFC/STEP export controls.

## Next Actions

- [x] Add semantic assignment APIs in `OpenPlans` class.
- [x] Add scene export APIs for IFC and STEP in `OpenPlans` class.
- [x] Add runnable example showing assignment + export.
- [x] Validate build and document behavior.
- [ ] Collect importer compatibility results from at least one BIM app and one CAD app.
