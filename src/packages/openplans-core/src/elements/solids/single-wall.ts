import * as THREE from "three";
import { Line, Polygon, Solid, Vector3 } from "opengeometry";

import { IShape } from "../../shapes/base-type";
import { ElementType } from "../base-type";
import {
  WallMaterial,
  WallOptions
} from "./wall-types";
import { Opening } from "../openings/opening";
import { Door, Window } from "../openings";
import { WallFrame, computeWallFrame } from "./wall-frame";
import { Event } from "../../../../../utils/event";
export { WallMaterial } from "./wall-types";

export class SingleWall extends Line implements IShape {
  ogType = ElementType.WALL;

  subElements2D: Map<string, THREE.Object3D> = new Map();
  private isProfileView: boolean = true;

  subElements3D: Map<string, THREE.Object3D> = new Map();
  private isModelView: boolean = true;

  private openings: Opening[] = [];
  private _frame: WallFrame | null = null;

  /** Fires whenever the wall's frame changes (endpoints, thickness, height). */
  onWallGeometryChanged: Event<null> = new Event();

  selected = false;
  edit = false;
  locked = false;

  /** Whether to keep this as pure line and not convert to 2D and 3D meshes. 
   * This can be used to create a Wall Engine, that will use the line as the base, and generate 2D and 3D geometry as needed, and keep them in sync with the line geometry.
   * If enabled, we will not generate 2D and 3D geometry for this wall, but keep it as a line, and let the Wall Engine handle the geometry generation and syncing.
  */
  isLineWall: boolean = false;

  // UI Properties
  _outlineEnabled: boolean = false;

  // Semantic Properties
  propertySet: WallOptions = {
    labelName: "Standard Wall",
    thickness: 0.3,
    material: WallMaterial.CONCRETE,
    color: 0xcccccc,
    height: 3,
    points: [
      [0, 0, 0],
      [1.5, 0, 1.5],
    ],
    placement: { 
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
    openings: [],
  };

  get outline() { return this._outlineEnabled; }
  set outline(value: boolean) {
    this._outlineEnabled = value;
    for (const obj of this.subElements2D.values()) {
      // @ts-ignore
      obj.outline = value;
    }
    for (const obj of this.subElements3D.values()) {
      // @ts-ignore
      obj.outline = value;
    }
  }

  get labelName() { return this.propertySet.labelName; }
  set labelName(value: string) {
    this.propertySet.labelName = value;
  }

  get wallThickness() { return this.propertySet.thickness; }
  set wallThickness(value: number) {
    this.propertySet.thickness = Math.max(0.1, value);
    this.setOPGeometry();
  }

  get wallMaterial() { return this.propertySet.material; }
  set wallMaterial(value: WallMaterial | string) {
    this.propertySet.material = value;
  }

  get wallColor() { return this.propertySet.color; }
  set wallColor(value: number) {
    this.propertySet.color = value;
    this.setOPMaterial();
  }

  get wallHeight() { return this.propertySet.height; }
  set wallHeight(value: number) {
    this.propertySet.height = Math.max(0.1, value);
    this.setOPGeometry();
  }

  get start() { return this.propertySet.points[0]; }
  set start(value: [number, number, number]) {
    if (!this.distanceChecker(value, this.end)) {
      return;
    }
    this.propertySet.points[0] = value;
    this.setOPGeometry();
  }

  get end() { return this.propertySet.points[1]; }
  set end(value: [number, number, number]) {
    if (!this.distanceChecker(this.start, value)) {
      return;
    }
    this.propertySet.points[1] = value;
    this.setOPGeometry();
  }

  /**
   * Checks if the length of wall is not negative or zero, and if the start and end points are not the same. If invalid, it throws an error. This can be used in the UI to prevent users from creating walls with invalid geometry.
   * @param start 
   * @param end 
   * @returns boolean indicating whether the distance is valid or not
   */
  distanceChecker(start: [number, number, number], end: [number, number, number]): boolean {
    const startVec = new Vector3(start[0], start[1], start[2]);
    const endVec = new Vector3(end[0], end[1], end[2]);
    const distance = startVec.subtract(endVec).length();
    if (distance <= 0) {
      console.error("Invalid wall geometry: Start and end points cannot be the same or have zero length.");
      return false;
    }
    return true;
  }

  get profileView() { return this.isProfileView; }
  set profileView(value: boolean) {
    this.isProfileView = value;

    if (this.subElements2D.has(this.ogid + '-2d-resolved')) {
      const resolved2D = this.subElements2D.get(this.ogid + '-2d-resolved') as Polygon;
      resolved2D.visible = value;
      return;
    }

    for (const obj of this.subElements2D.values()) {
      obj.visible = value;
    }
  }

  get modelView() { return this.isModelView; }
  set modelView(value: boolean) {
    this.isModelView = value;

    if (this.subElements3D.has(this.ogid + '-3d-resolved')) {
      const resolved3D = this.subElements3D.get(this.ogid + '-3d-resolved') as Solid;
      resolved3D.visible = value;
      return;
    }

    for (const obj of this.subElements3D.values()) {
      obj.visible = value;
    }
  }

  constructor(wallConfig?: Partial<WallOptions>) {
    super({
      start: new Vector3(0, 0, 0),
      end: new Vector3(1.5, 0, 1.5),
      color: 0xcccccc,
    });

    this.subElements2D = new Map<string, THREE.Object3D>();
    this.subElements3D = new Map<string, THREE.Object3D>();
    
    if (wallConfig) {
      this.propertySet = {
        ...this.propertySet,
        ...wallConfig
      };
    }

    this.propertySet.ogid = this.ogid;
    this.setOPGeometry();
  }

  setOPConfig(config: WallOptions): void {
    this.dispose();

    this.propertySet = {
      ...this.propertySet,
      ...config,
    };

    this.setOPGeometry();
    this.setOPMaterial();
  }

  getOPConfig(): WallOptions {
    return this.propertySet;
  }

  /** Returns this wall's local coordinate frame, computing on demand. */
  getFrame(): WallFrame {
    if (!this._frame) {
      const [s, e] = this.propertySet.points;
      this._frame = computeWallFrame(
        new Vector3(s[0], s[1], s[2]),
        new Vector3(e[0], e[1], e[2]),
        this.propertySet.thickness,
      );
    }
    return this._frame;
  }

  attachDoor(doorElement: Door) {
    doorElement.hostWallId = this.ogid;
    doorElement.bindHostFrame(this.getFrame());

    const openingFromDoor = doorElement.opening as Opening;
    if (!openingFromDoor) {
      console.error("Door element does not have a valid opening configuration.");
      return;
    }
    this.openings.push(openingFromDoor);
    this.propertySet.openings.push(openingFromDoor.ogid!);
    this.resolveOpenings();

    openingFromDoor.onOpeningUpdated.add(() => {
      this.resolveOpenings();
    });

    this.onWallGeometryChanged.add(() => {
      doorElement.bindHostFrame(this.getFrame());
    });
  }

  /**
   * Detach a previously attached door. Removes it from the openings list,
   * unbinds its host frame (so it falls back to the unhosted identity frame),
   * and re-resolves the wall's CSG so the cut hole is closed up.
   */
  detachDoor(doorElement: Door) {
    const openingFromDoor = doorElement.opening as Opening;
    const openingOgid = openingFromDoor?.ogid;

    const index = this.openings.findIndex((o) => o === openingFromDoor);
    if (index !== -1) this.openings.splice(index, 1);

    if (openingOgid) {
      const propIndex = this.propertySet.openings.indexOf(openingOgid);
      if (propIndex !== -1) this.propertySet.openings.splice(propIndex, 1);
    }

    doorElement.hostWallId = undefined;
    doorElement.bindHostFrame(null);

    this.resolveOpenings();
  }

  attachWindow(windowElement: Window) {
    windowElement.hostWallId = this.ogid;
    windowElement.bindHostFrame(this.getFrame());

    const openingFromWindow = windowElement.opening as Opening;
    if (!openingFromWindow) {
      console.error("Window element does not have a valid opening configuration.");
      return;
    }
    this.openings.push(openingFromWindow);
    this.propertySet.openings.push(openingFromWindow.ogid!);
    this.resolveOpenings();

    openingFromWindow.onOpeningUpdated.add(() => {
      this.resolveOpenings();
    });

    this.onWallGeometryChanged.add(() => {
      windowElement.bindHostFrame(this.getFrame());
    });
  }

  attachOpening(openingElement: Opening) {
    openingElement.bindHostFrame(this.getFrame());
    this.openings.push(openingElement);
    const openingConfig = openingElement.getOPConfig();
    // Add Opening to Wall's propertySet
    this.propertySet.openings.push(openingConfig.ogid!);
    this.resolveOpenings();

    openingElement.onOpeningUpdated.add(() => {
      this.resolveOpenings();
    });

    this.onWallGeometryChanged.add(() => {
      openingElement.bindHostFrame(this.getFrame());
    });
  }

  resolveOpenings() {
    const wall2D = this.subElements2D.get(this.ogid + "-2d-base") as Polygon | undefined;
    if (!wall2D) return;

    const resolved2DKey = this.ogid + "-2d-resolved";
    const existingResolved2D = this.subElements2D.get(resolved2DKey);
    if (existingResolved2D) {
      existingResolved2D.removeFromParent();
      this.subElements2D.delete(resolved2DKey);
    }

    const all2DOpenings = this.openings
      .map((opening) => opening.opening2D)
      .filter((opening): opening is Polygon => Boolean(opening));

    if (all2DOpenings.length === 0) {
      wall2D.visible = this.isProfileView;
      return;
    }

    // Pass the wall's color and force opaque material — opengeometry's
    // BooleanResult defaults to `transparent: true, opacity: 0.82`, which
    // makes a cut wall render translucent. The kernel exposes overrides
    // since 2.0.8; we use them to match a regular Solid (opaque, double-
    // sided so the cut interior renders correctly).
    const result = wall2D.subtract(all2DOpenings, {
      color:       this.propertySet.color,
      transparent: false,
      opacity:     1,
    });

    wall2D.visible = false;
    all2DOpenings.forEach((opening2D) => {
      opening2D.visible = false;
    });

    this.subElements2D.set(resolved2DKey, result);
    this.add(result);

    // 3D Resolution
    const wall3D = this.subElements3D.get(this.ogid + "-3d-base") as Solid | undefined;
    if (!wall3D) return;

    const resolved3DKey = this.ogid + "-3d-resolved";
    const existingResolved3D = this.subElements3D.get(resolved3DKey);
    if (existingResolved3D) {
      existingResolved3D.removeFromParent();
      this.subElements3D.delete(resolved3DKey);
    }

    const all3DOpenings = this.openings
      .map((opening) => opening.opening3D)
      .filter((opening): opening is Solid => Boolean(opening));

    if (all3DOpenings.length === 0) {
      wall3D.visible = this.isModelView;
      return;
    }

    const result3D = wall3D.subtract(all3DOpenings, {
      color:       this.propertySet.color,
      transparent: false,
      opacity:     1,
    });

    wall3D.visible = false;
    all3DOpenings.forEach((opening3D) => {
      opening3D.visible = false;
    });

    this.subElements3D.set(resolved3DKey, result3D);
    this.add(result3D);
}


  detachOpening(ogid: string) {
    const index = this.openings.findIndex(opening => opening.ogid === ogid);
    if (index !== -1) {
      this.openings.splice(index, 1);
    }

    if (this.openings.length === 0) {
      // If no more openings, remove resolved geometry and show original wall geometry
      this.subElements2D.delete(this.ogid + '-2d-resolved');
      this.subElements3D.delete(this.ogid + '-3d-resolved');
    }
  }

  getHostedOpenings() {
    return this.openings;
  }

  dispose() {
    for (const obj of this.subElements2D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }

      mesh.removeFromParent();
    }
    for (const obj of this.subElements3D.values()) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }

      mesh.removeFromParent();
    }

    this.subElements2D.clear();
    this.subElements3D.clear();
    this.discardGeometry();
  }

  setOPGeometry(): void {
    this.dispose();

    const [s, e] = this.propertySet.points;
    const startVec = new Vector3(s[0], s[1], s[2]);
    const endVec = new Vector3(e[0], e[1], e[2]);

    this.setConfig({
      start: startVec,
      end: endVec,
      color: this.propertySet.color,
    });

    this._frame = computeWallFrame(startVec, endVec, this.propertySet.thickness);
    this.onWallGeometryChanged.trigger(null);

    if (this.isLineWall) {
      return;
    }

    const offset1 = this.getOffset(this.propertySet.thickness / 2);
    const offset2 = this.getOffset(-this.propertySet.thickness / 2);

    // Use loop later
    const points: Vector3[] = [
      // Start point with positive offset
      offset1.points[0].clone(),
      // End point with positive offset
      offset1.points[1].clone(),
      // End point with negative offset
      offset2.points[1].clone(),
      // Start point with negative offset
      offset2.points[0].clone(),
    ];

    // We will use these points to generate the 2D and 3D geometry for the wall, and keep them in sync with the line geometry.
    // 2D Polygon
    const polygon = new Polygon({
      ogid: this.ogid + '-2d-base',
      vertices: points,
      color: this.propertySet.color,
    });
    this.subElements2D.set(polygon.ogid, polygon);
    this.add(polygon);

    // 3D Extrusion
    const height = this.propertySet.height; // Default height if not set
    const extrudedShape = polygon.extrude(height);
    extrudedShape.ogid = this.ogid + '-3d-base';
    this.subElements3D.set(extrudedShape.ogid, extrudedShape);
    this.add(extrudedShape);

    // Resolve Openings after geometry is generated so that we can use the generated geometry for boolean operations
    this.resolveOpenings();

    // Retaining same outline and visibility settings for new geometry
    this.outline = this._outlineEnabled;
    this.profileView = this.isProfileView;
    this.modelView = this.isModelView;
  }

  create3D() {

  }

  setOPMaterial(): void {
    
  }
}
