import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { OpenGeometry } from "opengeometry";

import {
  Bathtub,
  Bed,
  Bench,
  Bidet,
  Board,
  Cabinet,
  Chair,
  Counter,
  Desk,
  Dishwasher,
  Door,
  DoubleDoor,
  DoubleWindow,
  Fountain,
  IFCExporter,
  Island,
  KitchenSink,
  Planter,
  Refrigerator,
  Sink,
  Shower,
  Slab,
  Sofa,
  Space,
  Stair,
  Stove,
  Shrub,
  Toilet,
  Tree,
  Urinal,
  Wall,
  Washer,
  Window,
  Wardrobe,
  DiningTable,
} from "../dist/index.js";

test.before(async () => {
  const wasm = fs.readFileSync(
    new URL("../node_modules/opengeometry/opengeometry_bg.wasm", import.meta.url),
  );

  await OpenGeometry.create({ wasmURL: wasm });
});

function createWall() {
  return new Wall({
    labelName: "Catalog Wall",
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
    ],
    section: {
      layers: [{
        role: "core",
        thickness: 0.2,
        material: "CONCRETE",
        color: 0xcccccc,
      }],
    },
    height: 3,
    placement: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  });
}

function mutateElement(element) {
  if ("wallThickness" in element) {
    element.wallThickness += 0.05;
    return;
  }

  if ("panelWidth" in element) {
    element.panelWidth += 0.15;
    return;
  }

  if ("windowWidth" in element) {
    element.windowWidth += 0.15;
    return;
  }

  if ("doorWidth" in element) {
    element.doorWidth += 0.2;
    return;
  }

  if ("slabWidth" in element) {
    element.slabWidth += 0.25;
    return;
  }

  if ("spaceHeight" in element) {
    element.spaceHeight += 0.25;
    return;
  }

  if ("width" in element && "height" in element && element.ogType === "BOARD") {
    element.width += 1;
    return;
  }

  if ("stairDimensions" in element) {
    element.numberOfSteps += 1;
    return;
  }

  if ("canopyRadius" in element) {
    element.canopyRadius += 0.1;
    return;
  }

  if ("radius" in element) {
    element.radius += 0.1;
    return;
  }

  if ("dimensions" in element) {
    element.dimensions = {
      ...element.dimensions,
      width: element.dimensions.width + 0.1,
    };
    return;
  }

  throw new Error(`No mutation strategy defined for ${element.constructor.name}`);
}

const catalogCases = [
  { label: "wall", create: () => createWall() },
  { label: "door", create: () => new Door() },
  { label: "window", create: () => new Window() },
  { label: "doubleDoor", create: () => new DoubleDoor() },
  { label: "doubleWindow", create: () => new DoubleWindow() },
  { label: "slab", create: () => new Slab() },
  { label: "stair", create: () => new Stair() },
  { label: "board", create: () => new Board() },
  { label: "space", create: () => new Space() },
  { label: "chair", create: () => new Chair() },
  { label: "sofa", create: () => new Sofa() },
  { label: "bed", create: () => new Bed() },
  { label: "wardrobe", create: () => new Wardrobe() },
  { label: "desk", create: () => new Desk() },
  { label: "diningTable", create: () => new DiningTable() },
  { label: "toilet", create: () => new Toilet() },
  { label: "sink", create: () => new Sink() },
  { label: "shower", create: () => new Shower() },
  { label: "bathtub", create: () => new Bathtub() },
  { label: "bidet", create: () => new Bidet() },
  { label: "urinal", create: () => new Urinal() },
  { label: "refrigerator", create: () => new Refrigerator() },
  { label: "stove", create: () => new Stove() },
  { label: "washer", create: () => new Washer() },
  { label: "dishwasher", create: () => new Dishwasher() },
  { label: "kitchenSink", create: () => new KitchenSink() },
  { label: "counter", create: () => new Counter() },
  { label: "cabinet", create: () => new Cabinet() },
  { label: "island", create: () => new Island() },
  { label: "tree", create: () => new Tree() },
  { label: "shrub", create: () => new Shrub() },
  { label: "planter", create: () => new Planter() },
  { label: "fountain", create: () => new Fountain() },
  { label: "bench", create: () => new Bench() },
];

test("catalog elements expose dual-view roots, isolate visibility toggles, rebuild cleanly, and dispose cleanly", () => {
  for (const { label, create } of catalogCases) {
    const element = create();

    const topRoots = element.getExportRoots("top");
    const isometricRoots = element.getExportRoots("isometric");

    assert.ok(topRoots.length > 0, `${label} should expose top-view export roots`);
    assert.ok(isometricRoots.length > 0, `${label} should expose isometric export roots`);
    assert.equal(
      element.children.length,
      topRoots.length + isometricRoots.length,
      `${label} should not keep orphaned children after initial build`,
    );

    element.profileView = false;
    assert.ok(topRoots.every((root) => root.visible === false), `${label} should hide only 2D nodes in profile toggle`);
    assert.ok(isometricRoots.every((root) => root.visible === true), `${label} should preserve 3D nodes in profile toggle`);

    element.profileView = true;
    element.modelView = false;
    assert.ok(topRoots.every((root) => root.visible === true), `${label} should preserve 2D nodes in model toggle`);
    assert.ok(isometricRoots.every((root) => root.visible === false), `${label} should hide only 3D nodes in model toggle`);

    element.modelView = true;
    mutateElement(element);

    const rebuiltTopRoots = element.getExportRoots("top");
    const rebuiltIsometricRoots = element.getExportRoots("isometric");

    assert.ok(rebuiltTopRoots.length > 0, `${label} should rebuild top-view roots`);
    assert.ok(rebuiltIsometricRoots.length > 0, `${label} should rebuild isometric roots`);
    assert.equal(
      element.children.length,
      rebuiltTopRoots.length + rebuiltIsometricRoots.length,
      `${label} should not accumulate orphaned children after rebuild`,
    );

    element.dispose();
    assert.equal(element.children.length, 0, `${label} dispose should detach child roots`);
    assert.equal(element.getExportRoots("top").length, 0, `${label} dispose should clear top roots`);
    assert.equal(element.getExportRoots("isometric").length, 0, `${label} dispose should clear isometric roots`);
  }
});

test("DoubleDoor keeps swing arcs out of isometric export roots", () => {
  const door = new DoubleDoor();
  const topRoots = door.getExportRoots("top");
  const isometricRoots = door.getExportRoots("isometric");

  assert.ok(topRoots.some((root) => root.constructor.name === "Arc"));
  assert.ok(isometricRoots.every((root) => root.constructor.name !== "Arc"));
});

test("IFCExporter supports double-door and double-window variants", () => {
  const exporter = new IFCExporter();

  const doubleDoorResult = exporter.generate({
    elements: [new DoubleDoor()],
  });
  const doubleWindowResult = exporter.generate({
    elements: [new DoubleWindow()],
  });

  assert.match(doubleDoorResult.text, /IFCDOOR/);
  assert.match(doubleWindowResult.text, /IFCWINDOW/);
  assert.doesNotThrow(() => JSON.parse(doubleDoorResult.reportJson));
  assert.doesNotThrow(() => JSON.parse(doubleWindowResult.reportJson));
});
