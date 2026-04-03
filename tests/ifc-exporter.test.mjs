import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { OpenGeometry } from "opengeometry";

import {
  Door,
  IFCExporter,
  Wall,
  Window,
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

function parseIfcReport(result) {
  return JSON.parse(result.reportJson);
}

function extractIfcBounds(text) {
  const points = [];
  const pointListPattern = /IFCCARTESIANPOINTLIST3D\(\(\(([\s\S]*?)\)\)\);/g;

  for (const match of text.matchAll(pointListPattern)) {
    const pointList = match[1];
    for (const point of pointList.matchAll(/\((-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\)/g)) {
      points.push({
        x: Number(point[1]),
        y: Number(point[2]),
        z: Number(point[3]),
      });
    }
  }

  assert.ok(points.length > 0, "IFC export should include point list geometry");

  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y)),
    minZ: Math.min(...points.map((point) => point.z)),
    maxZ: Math.max(...points.map((point) => point.z)),
  };
}

test.before(async () => {
  const wasm = fs.readFileSync(
    new URL("../node_modules/opengeometry/opengeometry_bg.wasm", import.meta.url),
  );

  await OpenGeometry.create({ wasmURL: wasm });
});

test("buildIfcConfig maps structure defaults and explicit overrides", () => {
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
      validateTopology: true,
      requireClosedShell: false,
    },
  );

  assert.deepEqual(config, {
    schema: "Ifc4Add2",
    project_name: "Project A",
    site_name: "Site A",
    building_name: "Override Building",
    storey_name: "Storey A",
    scale: 0.5,
    error_policy: "Strict",
    validate_topology: true,
    require_closed_shell: false,
  });
});

test("IFCExporter exports supported elements with IFC classes and parseable reports", () => {
  const exporter = new IFCExporter();
  const cases = [
    { element: createWallForExport(), ifcClass: "IFCWALL" },
    { element: new Door(), ifcClass: "IFCDOOR" },
    { element: new Window(), ifcClass: "IFCWINDOW" },
  ];

  for (const { element, ifcClass } of cases) {
    const result = exporter.generate({ elements: [element] });
    const report = parseIfcReport(result);

    assert.ok(result.text.length > 0);
    assert.match(result.text, /=IFCBUILDINGELEMENTPROXY\(/);
    assert.ok(result.text.includes(`,'${ifcClass}',`));
    assert.equal(report.exported_elements, 1);
  }
});

test("IFCExporter unions multi-part door and window geometry into single IFC products", () => {
  const exporter = new IFCExporter();

  const doorResult = exporter.generate({ elements: [new Door()] });
  const windowResult = exporter.generate({ elements: [new Window()] });

  assert.equal(parseIfcReport(doorResult).exported_elements, 1);
  assert.equal(parseIfcReport(windowResult).exported_elements, 1);
});

test("IFCExporter preserves parent translation in exported IFC geometry", () => {
  const exporter = new IFCExporter();
  const originDoor = new Door();
  const movedDoor = new Door();

  const originResult = exporter.generate({ elements: [originDoor] });
  const originBounds = extractIfcBounds(originResult.text);

  movedDoor.position.set(5, 0, 2);
  movedDoor.updateWorldMatrix(true, true);

  const movedResult = exporter.generate({ elements: [movedDoor] });
  const movedBounds = extractIfcBounds(movedResult.text);

  assert.ok(Math.abs((movedBounds.minX - originBounds.minX) - 5) < 1e-6);
  assert.ok(Math.abs((movedBounds.minZ - originBounds.minZ) - 2) < 1e-6);
});

test("IFCExporter rejects empty export arrays", () => {
  const exporter = new IFCExporter();

  assert.throws(
    () => exporter.generate({ elements: [] }),
    /requires at least one exportable element/,
  );
});
