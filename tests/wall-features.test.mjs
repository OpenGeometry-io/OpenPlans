import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

import { OpenGeometry } from "opengeometry";

import {
  Door,
  IFCExporter,
  PlanPDFGenerator,
  Wall,
  WallOpening,
  WallSystem,
  Window,
} from "../dist/index.js";
import { evaluateWallFeatureSuite } from "./helpers/wall-feature-evaluator.mjs";

function createWall(labelName, path, color = 0xcccccc) {
  return new Wall({
    labelName,
    path,
    section: {
      layers: [{
        role: "core",
        thickness: 0.2,
        material: "CONCRETE",
        color,
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

function registerWalls(system, walls) {
  walls.forEach((wall) => system.register(wall));
  return system;
}

function approx(a, b, tolerance = 1e-6) {
  return Math.abs(a - b) <= tolerance;
}

function samePoint(a, b, tolerance = 1e-6) {
  return approx(a.x, b.x, tolerance) && approx(a.z, b.z, tolerance);
}

function hasEdge(edges, start, end, tolerance = 1e-6) {
  return edges.some((edge) =>
    (samePoint(edge.start, start, tolerance) && samePoint(edge.end, end, tolerance))
    || (samePoint(edge.start, end, tolerance) && samePoint(edge.end, start, tolerance)));
}

function hasNativeModelOutline(wall) {
  return wall.getExportRoots("isometric").every((root) =>
    root.outline === true
    && root.fatOutlines === true
    && root.outlineWidth === 2
    && root.outlineColor === 0x000000);
}

function hasMergedDisplayRoot(wall) {
  return wall.children.some((child) => child.userData.wallMergedDisplay);
}

function exportRootsVisible(wall) {
  return wall.getExportRoots("isometric").every((root) => root.visible);
}

function joinedExports(elements) {
  const pdf = new PlanPDFGenerator();
  return {
    top: pdf.generate({ elements, view: "top" }),
    iso: pdf.generate({ elements, view: "isometric" }),
    ifc: JSON.parse(new IFCExporter().generate({ elements }).reportJson),
  };
}

test.before(async () => {
  const wasm = fs.readFileSync(
    new URL("../node_modules/opengeometry/opengeometry_bg.wasm", import.meta.url),
  );

  await OpenGeometry.create({ wasmURL: wasm });
});

test("WallSystem auto-classifies L joins and keeps the chosen primary wall continuous", () => {
  const host = createWall("L Host", [
    { x: 0, y: 0, z: 0 },
    { x: 4, y: 0, z: 0 },
  ]);
  const branch = createWall("L Branch", [
    { x: 4, y: 0, z: 0 },
    { x: 4, y: 0, z: 3 },
  ], 0x9fa7b3);
  registerWalls(new WallSystem({ capStyle: "uncapped" }), [host, branch]);

  const hostArtifacts = host.getResolvedArtifacts();
  const branchArtifacts = branch.getResolvedArtifacts();
  const branchPolygon = branchArtifacts.planArtifacts[0].polygon;

  assert.ok(hostArtifacts.joinNodes.some((node) => node.type === "L"));
  assert.ok(branchArtifacts.joinNodes.some((node) => node.type === "L"));
  assert.equal(hostArtifacts.joinNodes[0].primaryWallId, host.ogid);
  assert.equal(branchArtifacts.planArtifacts.length, 1);
  assert.equal(branchArtifacts.planArtifacts[0].visibleEdges.length, 3);
  assert.ok(!hasEdge(branchArtifacts.planArtifacts[0].visibleEdges, branchPolygon[0], branchPolygon[3]));
});

test("WallSystem splits X joins automatically and removes uncapped closure lines in plan view", () => {
  const host = createWall("Overlap Host", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const branch = createWall("Overlap Branch", [
    { x: 3, y: 0, z: -3 },
    { x: 3, y: 0, z: 3 },
  ], 0xd8a15a);
  registerWalls(new WallSystem({ capStyle: "uncapped" }), [host, branch]);

  const branchArtifacts = branch.getResolvedArtifacts();
  const branchEdges = branchArtifacts.planArtifacts.flatMap((artifact) => artifact.visibleEdges);
  const exports = joinedExports([host, branch]);

  assert.ok(branchArtifacts.joinNodes.some((node) => node.type === "X" && node.primaryWallId === host.ogid));
  assert.equal(branchArtifacts.modelPolygons.length, 2);
  assert.equal(branchArtifacts.planArtifacts.length, 2);
  assert.ok(branchArtifacts.planArtifacts.every((artifact) => artifact.visibleEdges.length === 3));
  assert.ok(!hasEdge(branchEdges, { x: 2.9, z: -0.1 }, { x: 3.1, z: -0.1 }));
  assert.ok(!hasEdge(branchEdges, { x: 2.9, z: 0.1 }, { x: 3.1, z: 0.1 }));
  assert.ok(host.constructor.name !== "Line");
  assert.ok(hasNativeModelOutline(host));
  assert.ok(hasNativeModelOutline(branch));
  assert.ok(hasMergedDisplayRoot(host));
  assert.ok(!hasMergedDisplayRoot(branch));
  assert.ok(!exportRootsVisible(host));
  assert.ok(!exportRootsVisible(branch));
  assert.ok(exports.top.lines.length > 0);
  assert.ok(exports.iso.lines.length > 0);
  assert.equal(exports.ifc.exported_elements, 2);
});

test("WallSystem trims T joins automatically and suppresses the branch closure edge in uncapped mode", () => {
  const host = createWall("T Host", [
    { x: 0, y: 0, z: 0 },
    { x: 4, y: 0, z: 0 },
  ]);
  const branch = createWall("T Branch", [
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 0, z: 2 },
  ], 0x9fa7b3);
  registerWalls(new WallSystem({ capStyle: "uncapped" }), [host, branch]);

  const hostArtifacts = host.getResolvedArtifacts();
  const branchArtifacts = branch.getResolvedArtifacts();
  const branchPolygon = branchArtifacts.planArtifacts[0].polygon;
  const exports = joinedExports([host, branch]);

  assert.ok(hostArtifacts.joinNodes.some((node) => node.type === "T" && node.primaryWallId === host.ogid));
  assert.equal(branchArtifacts.planArtifacts.length, 1);
  assert.equal(branchArtifacts.planArtifacts[0].visibleEdges.length, 3);
  assert.ok(approx(branchPolygon[0].z, 0.1));
  assert.ok(approx(branchPolygon[3].z, 0.1));
  assert.ok(!hasEdge(branchArtifacts.planArtifacts[0].visibleEdges, branchPolygon[0], branchPolygon[3]));
  assert.ok(hasNativeModelOutline(host));
  assert.ok(hasNativeModelOutline(branch));
  assert.ok(hasMergedDisplayRoot(host));
  assert.ok(!hasMergedDisplayRoot(branch));
  assert.ok(!exportRootsVisible(host));
  assert.ok(!exportRootsVisible(branch));
  assert.ok(host.getExportRoots("isometric").every((root) => root.outline === true));
  assert.ok(branch.getExportRoots("isometric").every((root) => root.outline === true));
  assert.ok(exports.top.lines.length > 0);
  assert.ok(exports.iso.lines.length > 0);
  assert.equal(exports.ifc.exported_elements, 2);
});

test("WallSystem recomputes joins when walls move and when a joined wall is removed", () => {
  const host = createWall("Move Host", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const branch = createWall("Move Branch", [
    { x: 3, y: 0, z: -3 },
    { x: 3, y: 0, z: 3 },
  ]);
  const system = registerWalls(new WallSystem({ capStyle: "uncapped" }), [host, branch]);

  assert.equal(branch.getResolvedArtifacts().planArtifacts.length, 2);

  branch.updatePoints([
    { x: 8, y: 0, z: -3 },
    { x: 8, y: 0, z: 3 },
  ]);

  assert.equal(branch.getResolvedArtifacts().planArtifacts.length, 1);
  assert.equal(branch.getResolvedArtifacts().joinNodes.length, 0);

  branch.updatePoints([
    { x: 3, y: 0, z: -3 },
    { x: 3, y: 0, z: 3 },
  ]);

  assert.equal(branch.getResolvedArtifacts().planArtifacts.length, 2);

  system.unregister(branch);

  assert.equal(host.getResolvedArtifacts().joinNodes.length, 0);
  assert.equal(host.getResolvedArtifacts().planArtifacts.length, 1);
});

test("Wall openings stay attached to authoring walls and cut both plan and model artifacts", () => {
  const host = createWall("Opening Host", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const baseWall = createWall("Baseline", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const plainOpening = new WallOpening({
    width: 1,
    height: 2,
    baseHeight: 0.75,
  });

  host.attachOpening(plainOpening, { offset: 2, baseHeight: 0.75 });

  const generator = new PlanPDFGenerator();
  const baseTop = generator.generate({ elements: [baseWall], view: "top" });
  const openedTop = generator.generate({ elements: [host], view: "top" });
  const openedIso = generator.generate({ elements: [host], view: "isometric" });
  const openedIfc = JSON.parse(new IFCExporter().generate({ elements: [host] }).reportJson);

  assert.equal(host.getHostedOpenings().length, 1);
  assert.equal(plainOpening.hostWallId, host.ogid);
  assert.deepEqual(plainOpening.position.toArray(), [2, 0.75, 0]);
  assert.ok(openedTop.lines.length > baseTop.lines.length);
  assert.ok(openedIso.lines.length > 0);
  assert.equal(openedIfc.exported_elements, 1);
});

test("Hosted doors and windows stay aligned after wall path updates", () => {
  const host = createWall("Hosted Wall", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const door = new Door();
  const windowElement = new Window();

  host.attachOpening(door, { offset: 3, baseHeight: 0 });
  host.attachOpening(windowElement, { offset: 4.5, baseHeight: 1.05 });
  host.updatePoints([
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 6 },
  ]);

  const diagonalScale = Math.SQRT1_2;
  const exports = joinedExports([host, door, windowElement]);

  assert.equal(door.hostWallId, host.ogid);
  assert.equal(windowElement.hostWallId, host.ogid);
  assert.ok(approx(door.getOPConfig().placement.position[0], 3 * diagonalScale));
  assert.ok(approx(door.getOPConfig().placement.position[2], 3 * diagonalScale));
  assert.ok(approx(windowElement.getOPConfig().placement.position[0], 4.5 * diagonalScale));
  assert.ok(approx(windowElement.getOPConfig().placement.position[2], 4.5 * diagonalScale));
  assert.ok(exports.top.lines.length > 0);
  assert.ok(exports.iso.lines.length > 0);
});

test("wall feature evaluator scores the new wall workflows at least 8 out of 10", () => {
  const { score, checks } = evaluateWallFeatureSuite();

  assert.ok(score >= 8, `expected evaluator score to be at least 8, got ${score}`);
  assert.equal(checks.length, 6);
  assert.ok(checks.every((check) => typeof check.name === "string"));
});
