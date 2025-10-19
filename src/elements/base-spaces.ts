// /**
//  * Space is somewhat equivalent to a room in a building
//  * It can be bounded by walls on all sides
//  * It can also be a free space without walls
//  */
// import { Polygon, Vector3 } from "../kernel/";
// // import { Pencil } from "../kernel/dist/src/pencil";
// import * as THREE from 'three';
// import { GlyphNode, Glyphs } from "@opengeometry/openglyph";
// import { OPSpace } from "./base-types";
// import { Event } from "../utils/event";

// interface SpaceContainerMesh {
//   id: number;
//   mainMesh: THREE.Mesh;
//   labelMesh: GlyphNode;
// }

// export class BaseSpace extends Polygon {
//   public ogType = 'space';

//   mesh: Polygon | null = null;
//   private spaceSetMesh: SpaceContainerMesh = {} as SpaceContainerMesh;
//   private spaceSet: OPSpace;

//   isEditing = false;

//   isHovered = false;
//   isHighlighted = false;
//   isLocked = false;

//   onSpaceSelected = new Event<String>();

//   get labelName() {
//     const label = this.spaceSetMesh.labelMesh;
//     return label.text;
//   }

//   set labelName(name: string) {
//     const label = this.spaceSetMesh.labelMesh;
//     Glyphs.updateGlyphText(label.uuid, name);
//   }

//   constructor(private pencil: Pencil, initialSpaceSet?: OPSpace) {
//     super();
//     this.name = `space`+this.ogid;

//     if (initialSpaceSet) {
//       this.spaceSet = initialSpaceSet;
//     } else {
//       this.spaceSet = {
//         id: 0,
//         position: {
//           x: 0,
//           y: 0,
//           z: 0
//         },
//         color: 0xff0000,
//         type: 'internal',
//         coordinates: [
//           [-10, 0, -10],
//           [10, 0, -10],
//           [10, 0, 10],
//           [-10, 0, 10]
//         ],
//         labelName: 'Space'
//       };
//     }

//     this.setGeometry();
//     this.setupEvents();
//   }

//   private setupEvents() {
//     this.pencil.onElementHover.add((mesh) => {
//       if (mesh.name === this.name) {
//         this.isHovered = true;
//         // const material = this.material as THREE.MeshBasicMaterial;
//         // material.color.setHex(0x00ff00);
//       } else {
//         this.isHovered = false;
//         const material = this.material as THREE.MeshBasicMaterial;
        
//         if (this.isEditing) {
//           material.color.setHex(0xffffff);
//         } else {
//           material.color.setHex(this.spaceSet.color);
//         }
//       }
//     });

//     this.pencil.onElementSelected.add((mesh) => {
//       // if (mesh.name === this.name) {
//       //   this.isEditing = true;
//       //   const material = this.material as THREE.MeshBasicMaterial;
//       //   material.color.setHex(0xff00ff);

//       //   this.onSpaceSelected.trigger(this.name);
//       // }
//     });
//   }

//   private setGeometry() {
//     if (!this.spaceSetMesh) return;

//     const { coordinates, color } = this.spaceSet;
//     const { x, y, z } = this.spaceSet.position;

//     const spaceGeoemtry = new THREE.BufferGeometry();

//     for (let i = 0; i < coordinates.length; i++) {
//       const coord = coordinates[i];
//       const x = coord[0];
//       const y = coord[1];
//       const z = coord[2];
//       const vector = new Vector3(x, y, z);
//       this.addVertex(vector);
//     }

//     const randomColor = Math.floor(Math.random() * 16777215);
//     this.spaceSet.color = randomColor;
//     const spaceMaterial = new THREE.MeshBasicMaterial({ color: randomColor, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
//     const spaceMesh = new THREE.Mesh(spaceGeoemtry, spaceMaterial);
//     spaceMesh.position.set(x, y, z);
//     this.material = spaceMaterial;

//     // this.spaceSetMesh.mainMesh = spaceMesh;
//     // this.add(spaceMesh);

//     const label = Glyphs.addGlyph(this.spaceSet.labelName, 8, 0x000000, false);
//     this.spaceSetMesh.labelMesh = label;

//     // // get center of space mesh
//     const center = new THREE.Vector3();
//     this.geometry.computeBoundingBox();
//     if (!this.geometry.boundingBox) return;
//     this.geometry.boundingBox.getCenter(center);
//     label.position.set(center.x + x, center.y + 0.01, center.z + z); // add small offset to y axis to avoid z-fighting
//     this.add(label);

//     this.pencil.pencilMeshes.push(this);
//   }

//   get area() {
//     const spaceDim = {
//       area: 0,
//       perimeter: 0
//     };

//     const position = this.geometry.getAttribute('position');
//     // calculate area
//     for (let i = 0; i < position.array.length; i+=9) {
//       const triangle = new THREE.Triangle(
//         new THREE.Vector3(position.array[i], position.array[i+1], position.array[i+2]),
//         new THREE.Vector3(position.array[i+3], position.array[i+4], position.array[i+5]),
//         new THREE.Vector3(position.array[i+6], position.array[i+7], position.array[i+8])
//       );
//       spaceDim.area += triangle.getArea();
//     }

//     return spaceDim.area;
//   }
// }