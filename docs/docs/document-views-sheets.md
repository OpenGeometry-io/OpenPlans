---
sidebar_position: 3
---

# Experimental Document Views And Sheets

This page describes active architecture work that exists in the repository but is not yet the primary production-facing workflow.

If you are shipping against OpenPlans today, prefer the linked-view plus `PaperFrame` flow shown in the paper examples. The APIs below are still experimental and may change substantially as the editor/runtime architecture hardens.

## Core model

The document-backed workflow separates:

- model elements as document state
- saved views as camera/filter/display definitions
- viewport instances as sheet placements that reference views
- sheets as paper-space layout objects

This keeps the authored model shared across every viewport instead of duplicating scene graphs.

## Main APIs

```ts
const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();

openPlans.createDocument();

const floorSource = openPlans.createFloorSource({
  labelName: "Level 01",
  center: [0, 0, 0],
  cropSize: [14, 10],
});

const floorView = openPlans.createView({
  name: "Floor Plan",
  kind: "floor",
  sourceElementId: floorSource.id,
  camera: {
    projection: "orthographic",
    target: [0, 1.2, 0],
    up: [0, 0, -1],
  },
  clipping: {},
  filters: { hiddenElementIds: [], hiddenCategories: [] },
  display: {
    background: 0xffffff,
    foregroundMode: "model",
    backgroundMode: "solid",
    detailLevel: "fine",
  },
  annotationPolicy: {
    showModelAnnotations: true,
    showDimensions: true,
    showTags: true,
  },
  overrides: { byElementId: {}, byCategory: {} },
});

const sheet = openPlans.createSheet({ name: "A101" });
openPlans.placeViewport(sheet.id, {
  sourceViewId: floorView.id,
  title: "Floor Plan",
  rectOnSheet: { x: 18, y: 18, width: 145, height: 92 },
  fitMode: "fit-crop",
  localAnnotationIds: [],
  locked: false,
  hidden: false,
});

openPlans.activateSheet(sheet.id);
```

## Interaction

When a sheet is active, OpenPlans renders the shared model scene directly into viewport rectangles with `setViewport` and `setScissor`.

- clicking in a viewport activates that viewport
- picking raycasts the shared model scene through the viewport camera
- edits write back to the original document elements
- all dependent viewports refresh from the same source model

## Export

Use `openPlans.exportSheetToPDF(sheetId)` only as part of the experimental document-sheet path.

The long-term goal is for the export service to resolve each viewport from document state, collect vector linework, map it into sheet-space coordinates, and emit a single PDF document. That pipeline is still under active implementation.
