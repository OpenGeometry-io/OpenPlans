import { BasePoly, Vector3D } from "../../kernel/dist";
import { Pencil } from "../../kernel/dist/src/pencil";
import * as THREE from 'three';
import { GlyphNode, Glyphs } from "../glyphs";
import { OPSpace } from "./base-types";

interface SpaceContainerMesh {
  id: number;
  mainMesh: THREE.Mesh;
  labelMesh: GlyphNode;
}

export class BaseSpace extends BasePoly {
  public ogType = 'space';
  mesh: BasePoly | null = null;
  private spaceSetMesh: SpaceContainerMesh = {} as SpaceContainerMesh;
  private spaceSet: OPSpace;

  isEditing = false;
  isHovered = false;
  isHighlighted = false;
  isLocked = false;

  constructor(private pencil: Pencil, initialSpaceSet?: OPSpace) {
    super();

    if (initialSpaceSet) {
      this.spaceSet = initialSpaceSet;
    } else {
      this.spaceSet = {
        id: 0,
        position: {
          x: 0,
          y: 0,
          z: 0
        },
        color: 0xff0000,
        type: 'internal',
        coordinates: [
          [-10, 0, -10],
          [10, 0, -10],
          [10, 0, 10],
          [-10, 0, 10]
        ],
        labelName: 'Space'
      };
    }

    this.setGeometry();
  }

  private setGeometry() {
    if (!this.spaceSetMesh) return;

    const { coordinates, color } = this.spaceSet;
    const { x, y, z } = this.spaceSet.position;

    const spaceGeoemtry = new THREE.BufferGeometry();
    console.log(coordinates);

    for (let i = 0; i < coordinates.length; i++) {
      const coord = coordinates[i];
      const x = coord[0];
      const y = coord[1];
      const z = coord[2];
      const vector = new Vector3D(x, y, z);
      this.addVertex(vector);
    }

    // spaceGeoemtry.computeVertexNormals();
    // spaceGeoemtry.computeBoundingBox();

    const randomColor = Math.floor(Math.random() * 16777215);
    const spaceMaterial = new THREE.MeshBasicMaterial({ color: randomColor, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const spaceMesh = new THREE.Mesh(spaceGeoemtry, spaceMaterial);
    spaceMesh.position.set(x, y, z);
    this.material = spaceMaterial;

    // this.spaceSetMesh.mainMesh = spaceMesh;
    // this.add(spaceMesh);

    const label = Glyphs.addGlyph(this.spaceSet.labelName, 1, 0x000000, false);
    this.spaceSetMesh.labelMesh = label;

    // // get center of space mesh
    const center = new THREE.Vector3();
    this.geometry.computeBoundingBox();
    if (!this.geometry.boundingBox) return;
    this.geometry.boundingBox.getCenter(center);
    label.position.set(center.x + x, center.y + y, center.z + z);
    this.add(label);
  }

  
}