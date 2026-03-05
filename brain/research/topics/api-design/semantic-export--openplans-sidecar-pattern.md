---
id: topic-semantic-export-openplans-sidecar-pattern
title: Semantic Export Sidecar Pattern (OpenPlans -> Kernel IFC)
status: active
created: 2026-03-05
updated: 2026-03-05
tags: [topic, api-design, ifc, step, semantics]
project: openplans
topic: api-design
sources:
  - /Users/gangsta/Work/OpenGeometry/OpenPlans/brain/research/projects/openplans/2026-03-05--semantic-layer-ifc-step-export.md
  - /Users/gangsta/Work/OpenGeometry/OpenPlans/src/index.ts
decisions:
  - Semantic data is authored and managed in OpenPlans, then injected at IFC export via sidecar map.
  - Kernel is treated as exporter/validator, not as semantic state owner.
next_actions:
  - Re-evaluate defaults after importer feedback from FreeCAD/Revit-class tools.
---

# Summary

Use OpenPlans as source-of-truth for semantic metadata (`IFCWALL`, `IFCWINDOW`, etc.) and pass this metadata to kernel export methods as an IFC sidecar map keyed by scene entity IDs.

# Pattern

1. Author semantics in app-layer APIs:
   - `setIfcSemantics(elementId, semantics)`
   - `setIfcClass(elementId, class)`
2. Build export scene from current entities and BREP payloads.
3. Emit IFC with:
   - `semantics` map
   - `BestEffort` policy by default for plan-view compatibility
4. Emit STEP without semantic sidecar (geometry only).

# Why This Is Reusable

- Works for any UI that has editable entities and IDs.
- Preserves kernel portability across products.
- Keeps BIM/business semantics decoupled from geometry kernel internals.
