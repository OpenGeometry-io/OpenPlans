// import { Vector3 } from "three";
// import { BasePoly } from "../kernel/dist";
// import * as THREE from 'three';

// /**
//  * Purpose of Geometry Set is to provide a set of properties that can be used to create a geometry
//  * This can be stored in a database and used to recreate the geometry
//  * Anchors should only be adjusted by the Kernel and not by the user
//  */
// export interface BaseGeometrySet {
//   type: string;
//   id: string;
//   position: Vector3;
//   length: number;
//   material: string;
//   anchor?: {
//     start: Vector3;
//     end: Vector3;
//   };
// }

// // TODO: BasePoly is provided from OpenGeometry, do more research if something more robust class can be created for Base Elements
// export abstract class BaseElement extends BasePoly {
//   abstract ogType: string;

//   abstract visibleMesh: THREE.Group;

//   public isEditing: boolean = false;
//   public isHovered: boolean = false;
//   public isSelected: boolean = false;
//   public isLocked: boolean = false;
//   public isHidden: boolean = false;
//   public isDeleted: boolean = false;

//   abstract geometrySet: BaseGeometrySet;

//   /**
//    * Creating the Element Geometry based on the geometry set
//    */
//   abstract setupGeometry(): void;
//   abstract setupEvents(): void;

//   /**
//    * To be used for updating main geometry and shadow geometry
//    */
//   abstract updateGeometry(): void;

//   /**
//    * Check if the geometry set is valid, if a property is set optional it will be ignored
//    * @param geometrySet 
//    * @returns 
//    */
//   verifyGeometrySet(geometrySet: BaseGeometrySet): boolean {
//     type RequiredKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];
//     const requiredKeys: RequiredKeys<BaseGeometrySet>[] = ["type", "id", "position", "length", "material"];
//     return requiredKeys.every(key => geometrySet[key] !== undefined && geometrySet[key] !== null);
//   }

//   /**
//    * Adjust the length of the geometry set based on the anchor points
//    * @param geometrySet 
//    */
//   adjustAnchors(length: number): void {
//     if (length < 0.1) {
//       length = 0.1;
//       throw new Error('Length cannot be less than 1');
//     }

//     this.geometrySet.length = length;
//     const startAnchor = length / 2;
//     const endAnchor = length / 2;
//     this.geometrySet.anchor = {
//       start: new Vector3(-startAnchor, 0, 0),
//       end: new Vector3(endAnchor, 0, 0)
//     };
//   }
// }