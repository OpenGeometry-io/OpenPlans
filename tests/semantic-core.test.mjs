import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { Cuboid, OpenGeometry, Vector3 } from "opengeometry";

import {
  DEFAULT_ISOMETRIC_CAMERA,
  DEFAULT_ISOMETRIC_HLR,
  Door,
  OpenPlans,
  PlanPDFGenerator,
  Wall,
  Window,
  buildAppearanceMetadata,
  buildIfcConfig,
} from "../dist/index.js";

function createWallForExport() {
  return new Wall({
    labelName: "Wall Export",
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 6, y: 0, z: 0 },
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

function createWindowFrontCamera(windowElement) {
  const targetY = windowElement.sillHeight + windowElement.windowHeight / 2;
  return {
    position: { x: 0, y: targetY, z: 6 },
    target: { x: 0, y: targetY, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    near: 0.1,
    projection_mode: "Orthographic",
  };
}

test.before(async () => {
  const wasm = fs.readFileSync(
    new URL("../node_modules/opengeometry/opengeometry_bg.wasm", import.meta.url),
  );

  await OpenGeometry.create({ wasmURL: wasm });
});

test("buildAppearanceMetadata preserves exported color intent", () => {
  const metadata = buildAppearanceMetadata({
    wallColor: 0xa7c957,
    doorColor: 0xbc6c25,
    frameColor: 0x1b4332,
    glassColor: 0x8ecae6,
    materialLabel: "glass",
  });

  assert.deepEqual(metadata, {
    WallColor: "#a7c957",
    DoorColor: "#bc6c25",
    FrameColor: "#1b4332",
    GlassColor: "#8ecae6",
    MaterialLabel: "glass",
  });
});

test("buildIfcConfig uses structure defaults and explicit overrides", () => {
  const config = buildIfcConfig(
    {
      projectName: "Project A",
      siteName: "Site A",
      buildingName: "Building A",
      storeyName: "Storey A",
    },
    {
      buildingName: "Override Building",
      scale: 0.5,
      errorPolicy: "Strict",
    },
  );

  assert.equal(config.project_name, "Project A");
  assert.equal(config.site_name, "Site A");
  assert.equal(config.building_name, "Override Building");
  assert.equal(config.storey_name, "Storey A");
  assert.equal(config.scale, 0.5);
  assert.equal(config.error_policy, "Strict");
});

test("public facade re-exports runtime and semantic APIs", () => {
  assert.equal(typeof OpenPlans, "function");
  assert.equal(typeof PlanPDFGenerator, "function");
  assert.equal(typeof Door, "function");
  assert.equal(typeof Wall, "function");
  assert.equal(typeof Window, "function");
});

test("Door export roots split top-view symbols from isometric geometry", () => {
  const door = new Door();

  const topRoots = door.getExportRoots("top");
  const isometricRoots = door.getExportRoots("isometric");

  assert.ok(topRoots.some((root) => root.constructor.name === "Arc"));
  assert.ok(isometricRoots.every((root) => root.constructor.name !== "Arc"));
});

test("PlanPDFGenerator exports wall, door, and window individually for both views", () => {
  const generator = new PlanPDFGenerator();
  const samples = [
    { label: "wall", element: createWallForExport() },
    { label: "door", element: new Door() },
    { label: "window", element: new Window() },
  ];

  for (const { label, element } of samples) {
    const topPayload = generator.generate({
      elements: [element],
      view: "top",
    });
    const isometricPayload = generator.generate({
      elements: [element],
      view: "isometric",
    });

    assert.equal(topPayload.view, "top", `${label} top export should use top view`);
    assert.equal(isometricPayload.view, "isometric", `${label} iso export should use isometric view`);
    assert.ok(topPayload.lines.length > 0, `${label} top export should include linework`);
    assert.ok(isometricPayload.lines.length > 0, `${label} iso export should include linework`);
  }
});

test("PlanPDFGenerator exports top-view plan symbols without leaking 3D height", () => {
  const door = new Door();
  const generator = new PlanPDFGenerator();

  const payload = generator.generate({
    elements: [door],
    view: "top",
  });

  assert.equal(payload.view, "top");
  assert.equal(payload.units, "meters");
  assert.equal(payload.camera, undefined);
  assert.equal(payload.hlr, undefined);
  assert.ok(payload.lines.length > 0);
  assert.ok(payload.bounds.height < door.doorHeight);
});

test("PlanPDFGenerator exports isometric projected outlines with default camera and HLR", () => {
  const door = new Door();
  const generator = new PlanPDFGenerator();

  const payload = generator.generate({
    elements: [door],
    view: "isometric",
  });

  assert.equal(payload.view, "isometric");
  assert.deepEqual(payload.camera, DEFAULT_ISOMETRIC_CAMERA);
  assert.deepEqual(payload.hlr, DEFAULT_ISOMETRIC_HLR);
  assert.ok(payload.lines.length > 0);
  assert.ok(payload.bounds.height > 1);
});

test("PlanPDFGenerator preserves direct-BRep object placement in front-view projection", () => {
  const generator = new PlanPDFGenerator();
  const leftFrameBar = new Cuboid({
    center: new Vector3(-0.85, 1.5, 0),
    width: 0.2,
    height: 1.6,
    depth: 0.2,
    color: 0xff0000,
  });

  const payload = generator.generate({
    elements: [{
      getExportRoots() {
        return [leftFrameBar];
      },
    }],
    view: "isometric",
    camera: {
      position: { x: 0, y: 1.5, z: 6 },
      target: { x: 0, y: 1.5, z: 0 },
      up: { x: 0, y: 1, z: 0 },
      near: 0.1,
      projection_mode: "Orthographic",
    },
  });

  assert.ok(Math.abs(payload.bounds.min.x - (-0.95)) < 1e-6);
  assert.ok(Math.abs(payload.bounds.max.x - (-0.75)) < 1e-6);
});

test("PlanPDFGenerator respects grouped and parent transforms in top view", () => {
  const generator = new PlanPDFGenerator();
  const originDoor = new Door();
  const movedDoor = new Door();

  const originPayload = generator.generate({
    elements: [originDoor],
    view: "top",
  });

  movedDoor.position.set(5, 0, 2);
  movedDoor.updateWorldMatrix(true, true);

  const movedPayload = generator.generate({
    elements: [movedDoor],
    view: "top",
  });

  assert.ok(Math.abs((movedPayload.bounds.min.x - originPayload.bounds.min.x) - 5) < 1e-6);
  assert.ok(Math.abs((movedPayload.bounds.min.y - originPayload.bounds.min.y) + 2) < 1e-6);
});

test("PlanPDFGenerator respects parent transforms in front-view projection", () => {
  const generator = new PlanPDFGenerator();
  const originWindow = new Window();
  const movedWindow = new Window();

  const originPayload = generator.generate({
    elements: [originWindow],
    view: "isometric",
    camera: createWindowFrontCamera(originWindow),
  });

  movedWindow.position.set(5, 0, 0);
  movedWindow.updateWorldMatrix(true, true);

  const movedPayload = generator.generate({
    elements: [movedWindow],
    view: "isometric",
    camera: createWindowFrontCamera(movedWindow),
  });

  assert.ok(Math.abs((movedPayload.bounds.min.x - originPayload.bounds.min.x) - 5) < 1e-6);
});

test("PlanPDFGenerator exports mixed wall, door, and window arrays for both views", () => {
  const wall = createWallForExport();
  const door = new Door();
  const windowElement = new Window();
  const generator = new PlanPDFGenerator();

  door.position.set(1.5, 0, 0);
  windowElement.position.set(4, 0, 0);

  const topPayload = generator.generate({
    elements: [wall, door, windowElement],
    view: "top",
  });
  const isometricPayload = generator.generate({
    elements: [wall, door, windowElement],
    view: "isometric",
  });

  assert.ok(topPayload.lines.length > 0);
  assert.ok(isometricPayload.lines.length > 0);
  assert.ok(isometricPayload.bounds.height > topPayload.bounds.height);
});

test("PlanPDFGenerator rejects empty export arrays", () => {
  const generator = new PlanPDFGenerator();

  assert.throws(
    () => generator.generate({ elements: [] }),
    /requires at least one exportable element/,
  );
});
