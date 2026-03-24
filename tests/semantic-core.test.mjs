import test from "node:test";
import assert from "node:assert/strict";

import {
  OpenPlans,
  PlanDocument,
  buildAppearanceMetadata,
  buildIfcConfig,
} from "../dist/index.js";

test("PlanDocument stores wall, door, and window semantic elements", () => {
  const document = new PlanDocument({
    projectName: "Semantic Test Project",
    storeyName: "Level 01",
  });

  const wall = document.upsertWall({
    kind: "WALL",
    labelName: "Wall A",
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
    ],
    wallThickness: 0.3,
    wallHeight: 3,
    wallColor: 0xa7c957,
    wallMaterial: "concrete",
    appearance: { wallColor: 0xa7c957, materialLabel: "concrete" },
  });

  const door = document.upsertDoor({
    kind: "DOOR",
    labelName: "Door A",
    hostWallId: wall.id,
    doorPosition: { x: 1, y: 0, z: 0 },
    doorWidth: 1,
    doorHeight: 2.1,
    doorThickness: 0.1,
    frameThickness: 0.2,
    doorColor: 0xbc6c25,
    frameColor: 0x1b4332,
    doorMaterial: "wood",
    appearance: { doorColor: 0xbc6c25, frameColor: 0x1b4332, materialLabel: "wood" },
  });

  const windowElement = document.upsertWindow({
    kind: "WINDOW",
    labelName: "Window A",
    hostWallId: wall.id,
    windowPosition: { x: 3, y: 0, z: 0 },
    windowWidth: 1.5,
    windowHeight: 1.2,
    windowThickness: 0.15,
    sillHeight: 0.9,
    frameColor: 0x14213d,
    glassColor: 0x8ecae6,
    windowMaterial: "glass",
    appearance: { frameColor: 0x14213d, glassColor: 0x8ecae6, materialLabel: "glass" },
  });

  assert.equal(document.listWalls().length, 1);
  assert.equal(document.listDoors().length, 1);
  assert.equal(document.listWindows().length, 1);
  assert.equal(door.hostWallId, wall.id);
  assert.equal(windowElement.hostWallId, wall.id);
  assert.equal(document.toJSON().structure.projectName, "Semantic Test Project");
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
  assert.equal(typeof PlanDocument, "function");
});
