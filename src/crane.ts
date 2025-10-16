// // Crane.TS test

import { BaseCircle, Vector3 } from "./kernel/dist";
import { GenericBuilder, IGenericPropertySet } from "./generic/generic-builder";
import { PolygonBuilder } from "./shape-builder";
import * as THREE from "three";

export type CraneType = 'mobile' | 'tower' | 'crawler';

// Some Properties Modify Geometry
// Some Properties Modify Material
// Some Properties Triggers other Actions
// TODO: Find a way to differentiate these properties and handle them accordingly

export interface ICranePropertySet extends IGenericPropertySet {
  craneRadius: number;
  craneWidth: number;
  craneHeight: number;
  craneColor: number;
  // craneType: CraneType;
}

export class Crane extends GenericBuilder {
  constructor(config?: ICranePropertySet) {
    super(config);
    // this.ogType = 'Crane';

    this.propertySet.type = 'crane';
    this.propertySet.craneWidth = 2; // Default width
    this.propertySet.craneHeight = 5; // Default height
    this.propertySet.craneColor = 0xFF0000; // Default color
    this.propertySet.craneRadius = 20; // Default radius

    this.createCraneBody();
    this.createCraneZone();

    // Update Geometry based on Event, one or more events can be added
    // this.onPropertyUpdate.add(() => this.createCraneBody());
  }

  set craneRotation(value: number) {
    this.builderRotation = value;
  }

  set craneWidth(value: number) {
    this.propertySet.craneWidth = value;
    this.createCraneBody();    
  }

  set craneHeight(value: number) {
    this.propertySet.craneHeight = value;
    this.createCraneBody();
  }

  set craneRadius(value: number) {
    this.propertySet.craneRadius = value;
    const craneZone = this.childNodes.get('craneZone');
    if (craneZone instanceof BaseCircle) {
      craneZone.radius = value;
    }
  }

  // A Polygon Shape
  createCraneBody() {
    if (this.childNodes.has('craneBody')) {
      const existingShape = this.childNodes.get('craneBody');
      if (existingShape instanceof PolygonBuilder) {
        existingShape.removeFromParent();
        existingShape.dispose();
        this.childNodes.delete('craneBody');
      }
    }

    // Create the body of the crane based on the type
    const points: Array<[number, number, number]> = [];
    const { craneWidth, craneHeight } = this.propertySet;
    // const { position } = this.propertySet.dimensions;

    points.push(
      [-craneWidth / 2, 0, -craneHeight / 2], // Bottom left
      [craneWidth / 2, 0, -craneHeight / 2], // Bottom right
      [craneWidth / 2, 0, craneHeight / 2], // Top right
      [-craneWidth / 2, 0, craneHeight / 2] // Top left
    );

    const craneShape = new PolygonBuilder();
    craneShape.insertMultiplePoints(points);
    craneShape.material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });

    craneShape.outline = true; // Enable outline for the crane body
    this.add(craneShape);
    this.childNodes.set('craneBody', craneShape);
  }

  createCraneLabel() {
    // Create Label using OpenGlyph
  }

  createCraneZone() {
    const { craneRadius } = this.propertySet;
    
    const circleArc = new BaseCircle({
      radius: craneRadius,
      segments: 32,
      position: new Vector3(0, 0, 0),
      startAngle: 0,
      endAngle: Math.PI * 2,
    })
    this.add(circleArc);
    this.childNodes.set('craneZone', circleArc);
  }
}

