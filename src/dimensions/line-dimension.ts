import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { ILineOptions, Line, Vector3 } from "../kernel/";
import * as THREE from "three";

export class LineDimension extends Line {
  ogType: string = 'LineDimension';
  dimensionData: ILineOptions;

  dimensionLabel: string = '1';
  dimensionMesh: CSS2DObject | null = null;

  constructor(dimensionData?: ILineOptions) {
    super(dimensionData);

    this.dimensionData = dimensionData || this.options;
    this.createDimension();
  }

  setDimensionLabel(label: string) {
    this.dimensionLabel = label;
    if (this.dimensionMesh) {
      (this.dimensionMesh.element as HTMLDivElement).textContent = label;
    }
  }

  setDimensionData(data: ILineOptions, length: number) {
    this.dimensionData.start = data.start;

    const newStart = new THREE.Vector3(data.start.x, data.start.y, data.start.z);
    const newEnd = new THREE.Vector3(data.end.x, data.end.y, data.end.z);
    
    this.dimensionData.end = newEnd;

    this.setDimensionLabel(length.toString());
    this.setConfig(this.dimensionData);
  }

  getDimensionLabel() {
    return this.dimensionLabel;
  }

  private createDimension() {
    // Div element for the label
    const dimensionMesh = this.createDimensionMesh();

    // Clear existing children
    // this.clear();

    // Cross lines at the ends
    const crossLineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const crossLineLength = 0.1;

    const direction = new THREE.Vector3().subVectors(this.dimensionData.end, this.dimensionData.start).normalize();
    const perpendicular = new THREE.Vector3(-direction.y, 0, direction.x).normalize();

    const startCrossGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3().addVectors(this.dimensionData.start, perpendicular.clone().multiplyScalar(crossLineLength / 2)),
      new THREE.Vector3().addVectors(this.dimensionData.start, perpendicular.clone().multiplyScalar(-crossLineLength / 2)),
    ]);
    const startCrossLine = new THREE.Line(startCrossGeometry, crossLineMaterial);
    this.add(startCrossLine);

    const endCrossGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3().addVectors(this.dimensionData.end, perpendicular.clone().multiplyScalar(crossLineLength / 2)),
      new THREE.Vector3().addVectors(this.dimensionData.end, perpendicular.clone().multiplyScalar(-crossLineLength / 2)),
    ]);

    const endCrossLine = new THREE.Line(endCrossGeometry, crossLineMaterial);
    this.add(endCrossLine);
  }

  createDimensionMesh() {
    if (this.dimensionMesh) {
      return this.dimensionMesh;
    }

    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = this.dimensionLabel;
    div.style.marginTop = '-1em';
    div.style.padding = '2px 5px';
    div.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    div.style.border = '1px solid #000';
    div.style.borderRadius = '4px';
    div.style.fontSize = '12px';

    this.dimensionMesh = new CSS2DObject(div);
    const centerPoint = new THREE.Vector3().addVectors(this.dimensionData.start, this.dimensionData.end).multiplyScalar(0.5);
    this.dimensionMesh.position.set(centerPoint.x, centerPoint.y, centerPoint.z);

    this.add(this.dimensionMesh);
  }

  updateDimensionMeshPosition() {
    if (!this.dimensionMesh) return;

    // const midPoint = new THREE.Vector3().addVectors(this.start, this.end).multiplyScalar(0.5);
    // this.dimensionMesh.position.copy(midPoint);
  }
}
