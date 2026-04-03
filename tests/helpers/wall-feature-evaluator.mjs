import { Door, IFCExporter, PlanPDFGenerator, Wall, WallOpening, WallSystem, Window } from "../../dist/index.js";

const DEFAULT_PLACEMENT = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

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
      position: [...DEFAULT_PLACEMENT.position],
      rotation: [...DEFAULT_PLACEMENT.rotation],
      scale: [...DEFAULT_PLACEMENT.scale],
    },
  });
}

function registerWalls(system, walls) {
  walls.forEach((wall) => system.register(wall));
  return walls;
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

function collectEdges(wall) {
  return wall.getResolvedArtifacts()?.planArtifacts.flatMap((artifact) => artifact.visibleEdges) ?? [];
}

function joinedExportResults(elements) {
  const pdf = new PlanPDFGenerator();
  return {
    top: pdf.generate({ elements, view: "top" }),
    iso: pdf.generate({ elements, view: "isometric" }),
    ifc: JSON.parse(new IFCExporter().generate({ elements }).reportJson),
  };
}

export function evaluateWallFeatureSuite() {
  const checks = [];
  const addCheck = (name, passed, points, details = {}) => {
    checks.push({ name, passed, points, details });
  };

  const overlapHost = createWall("Overlap Host", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const overlapBranch = createWall("Overlap Branch", [
    { x: 3, y: 0, z: -3 },
    { x: 3, y: 0, z: 3 },
  ], 0xd8a15a);
  registerWalls(new WallSystem({ capStyle: "uncapped" }), [overlapHost, overlapBranch]);

  const overlapArtifacts = overlapBranch.getResolvedArtifacts();
  const overlapEdges = collectEdges(overlapBranch);
  const overlapExports = joinedExportResults([overlapHost, overlapBranch]);
  addCheck(
    "overlap-x-join",
    overlapArtifacts?.joinNodes.some((node) => node.type === "X" && node.primaryWallId === overlapHost.ogid)
      && overlapArtifacts.modelPolygons.length === 2
      && overlapArtifacts.planArtifacts.length === 2
      && overlapArtifacts.planArtifacts.every((artifact) => artifact.visibleEdges.length === 3)
      && !hasEdge(overlapEdges, { x: 2.9, z: -0.1 }, { x: 3.1, z: -0.1 })
      && !hasEdge(overlapEdges, { x: 2.9, z: 0.1 }, { x: 3.1, z: 0.1 })
      && hasNativeModelOutline(overlapHost)
      && hasNativeModelOutline(overlapBranch)
      && hasMergedDisplayRoot(overlapHost)
      && !hasMergedDisplayRoot(overlapBranch)
      && !exportRootsVisible(overlapHost)
      && !exportRootsVisible(overlapBranch)
      && overlapExports.top.lines.length > 0
      && overlapExports.iso.lines.length > 0
      && overlapExports.ifc.exported_elements === 2,
    2,
    {
      planArtifacts: overlapArtifacts?.planArtifacts.length ?? 0,
      modelPolygons: overlapArtifacts?.modelPolygons.length ?? 0,
      topLines: overlapExports.top.lines.length,
      isoLines: overlapExports.iso.lines.length,
    },
  );

  const tHost = createWall("T Host", [
    { x: 0, y: 0, z: 0 },
    { x: 4, y: 0, z: 0 },
  ]);
  const tBranch = createWall("T Branch", [
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 0, z: 2 },
  ], 0x9fa7b3);
  registerWalls(new WallSystem({ capStyle: "uncapped" }), [tHost, tBranch]);

  const tArtifacts = tBranch.getResolvedArtifacts();
  const tPolygon = tArtifacts?.planArtifacts[0]?.polygon ?? [];
  const tEdges = collectEdges(tBranch);
  const tExports = joinedExportResults([tHost, tBranch]);
  addCheck(
    "t-join",
    tArtifacts?.joinNodes.some((node) => node.type === "T" && node.primaryWallId === tHost.ogid)
      && tArtifacts.planArtifacts.length === 1
      && tArtifacts.planArtifacts[0].visibleEdges.length === 3
      && tPolygon.length === 4
      && approx(tPolygon[0].z, 0.1)
      && approx(tPolygon[3].z, 0.1)
      && !hasEdge(tEdges, tPolygon[0], tPolygon[3])
      && hasNativeModelOutline(tHost)
      && hasNativeModelOutline(tBranch)
      && hasMergedDisplayRoot(tHost)
      && !hasMergedDisplayRoot(tBranch)
      && !exportRootsVisible(tHost)
      && !exportRootsVisible(tBranch)
      && tHost.getExportRoots("isometric").every((root) => root.outline === true)
      && tBranch.getExportRoots("isometric").every((root) => root.outline === true)
      && tExports.top.lines.length > 0
      && tExports.iso.lines.length > 0
      && tExports.ifc.exported_elements === 2
      && !(tHost.constructor.name === "Line"),
    2,
    {
      visibleEdges: tArtifacts?.planArtifacts[0]?.visibleEdges.length ?? 0,
      topLines: tExports.top.lines.length,
      isoLines: tExports.iso.lines.length,
    },
  );

  const plainHost = createWall("Opening Host", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const plainOpening = new WallOpening({
    width: 1,
    height: 2,
    baseHeight: 0.75,
  });
  const baseTop = new PlanPDFGenerator().generate({ elements: [createWall("Baseline", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ])], view: "top" });
  plainHost.attachOpening(plainOpening, { offset: 2, baseHeight: 0.75 });
  const plainExports = joinedExportResults([plainHost]);
  addCheck(
    "plain-opening",
    plainHost.getHostedOpenings().length === 1
      && plainOpening.hostWallId === plainHost.ogid
      && approx(plainOpening.position.x, 2)
      && approx(plainOpening.position.y, 0.75)
      && plainExports.top.lines.length > baseTop.lines.length
      && plainExports.iso.lines.length > 0
      && plainExports.ifc.exported_elements === 1,
    2,
    {
      topLines: plainExports.top.lines.length,
      isoLines: plainExports.iso.lines.length,
    },
  );

  const hostedWall = createWall("Hosted Wall", [
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 0 },
  ]);
  const door = new Door();
  const windowElement = new Window();
  hostedWall.attachOpening(door, { offset: 3, baseHeight: 0 });
  hostedWall.attachOpening(windowElement, { offset: 4.5, baseHeight: 1.05 });
  hostedWall.updatePoints([
    { x: 0, y: 0, z: 0 },
    { x: 6, y: 0, z: 6 },
  ]);
  const diagonalScale = Math.SQRT1_2;
  const hostedExports = joinedExportResults([hostedWall, door, windowElement]);
  addCheck(
    "hosted-door-window",
    door.hostWallId === hostedWall.ogid
      && windowElement.hostWallId === hostedWall.ogid
      && approx(door.getOPConfig().placement.position[0], 3 * diagonalScale)
      && approx(door.getOPConfig().placement.position[2], 3 * diagonalScale)
      && approx(windowElement.getOPConfig().placement.position[0], 4.5 * diagonalScale)
      && approx(windowElement.getOPConfig().placement.position[2], 4.5 * diagonalScale)
      && hostedExports.top.lines.length > 0
      && hostedExports.iso.lines.length > 0,
    2,
    {
      doorPosition: door.getOPConfig().placement.position,
      windowPosition: windowElement.getOPConfig().placement.position,
    },
  );

  addCheck(
    "plan-pdf-export",
    overlapExports.top.lines.length > 0
      && tExports.top.lines.length > 0
      && plainExports.top.lines.length > 0,
    1,
    {
      overlapTopLines: overlapExports.top.lines.length,
      tTopLines: tExports.top.lines.length,
      openingTopLines: plainExports.top.lines.length,
    },
  );

  addCheck(
    "ifc-export",
    overlapExports.ifc.exported_elements === 2
      && tExports.ifc.exported_elements === 2
      && plainExports.ifc.exported_elements === 1,
    1,
    {
      overlapIfc: overlapExports.ifc.exported_elements,
      tIfc: tExports.ifc.exported_elements,
      openingIfc: plainExports.ifc.exported_elements,
    },
  );

  const score = checks.reduce((total, check) => total + (check.passed ? check.points : 0), 0);
  return { score, checks };
}
