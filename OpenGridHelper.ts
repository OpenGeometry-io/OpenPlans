/**
 * Author: Vishwajeet Mane
 * References
 * 1. https://github.com/Fyrestar/THREE.InfiniteGridHelper/blob/master/InfiniteGridHelper.js
 * 2. https://dev.to/javiersalcedopuyo/simple-infinite-grid-shader-5fah
 */

/**
 * Notes
 * 1. Area is the size of the grid
 * 2. Visible Area is the portion of the grid that is visible with the raidal blur
 */

let vAxes = "xy";

import * as THREE from 'three';

function generateGridPoints(axes: string, size: number) {
  const gridPoints = [];
  gridPoints.push(1, 0, 1);
  gridPoints.push(-1, 0, 1);
  gridPoints.push(-1, 0, -1);
  gridPoints.push(1, 0, -1);
  gridPoints.push(1, 0, 1);

  const offsets = [];
  const area = size;
  const areaNeg = -area;
  for (let i = areaNeg/2; i < area/2; i++) {
    for (let j = areaNeg/2; j < area/2; j++) {
      offsets.push(i, 0, j);
    }
  }

  return {
    gridPoints: new Float32Array(gridPoints),
    offset: new Float32Array(offsets)
  };
}

class Grid {
  constructor(axes="xzy", color = new THREE.Vector3(0, 0, 0), size = 50, visibleArea = 25, polka = false) {
    const axesArray = axes.substring(0, 2);
    vAxes = axesArray;
    const shader = Shader;

    shader.uniforms.lineColor.value = color;
    shader.uniforms.visibleArea.value = visibleArea;
    shader.uniforms.polka.value = polka;

    const gridMaterial = new THREE.RawShaderMaterial({
      name: shader.name,
      uniforms: shader.uniforms,
      vertexShader: vertexShaderFunc(),
      fragmentShader: fragmentShaderFun(),
      side: THREE.DoubleSide,
      forceSinglePass: true,
      transparent: true
    });

    const gridData = generateGridPoints(axes, size);
    const gridPosition = gridData.gridPoints;
    const offsets = gridData.offset;

    const gridInstancedGeometry = new THREE.InstancedBufferGeometry();
    gridInstancedGeometry.instanceCount = offsets.length / 3;
    gridInstancedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPosition, 3));
    gridInstancedGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    
    if (polka) {
      gridMaterial.uniforms.polkaTexture = { value: new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png') };
      const grid = new THREE.Points(gridInstancedGeometry, gridMaterial);
      grid.frustumCulled = false;
      return grid;
    }
    else {
      const grid = new THREE.Line(gridInstancedGeometry, gridMaterial);
      grid.frustumCulled = false;
      return grid;
    }
  }
}




function fragmentShaderFun() {
  return `
  precision highp float;
  uniform vec3 lineColor;

  float near = 0.1;
  uniform float visibleArea;

  varying vec3 vPosition;
  uniform vec3 cameraPosition;

  uniform bool polka;
  uniform sampler2D polkaTexture;
  
  void main() {
    float dist = distance(vPosition, cameraPosition);
    float alpha = 1.0 - smoothstep(near, visibleArea, dist);
    
    if (polka) {
      gl_FragColor = vec4( lineColor, alpha );
      gl_FragColor = gl_FragColor * texture2D( polkaTexture, gl_PointCoord );
    }
    else {
      gl_FragColor = vec4(lineColor, alpha);
    }
  }
`;
}

function vertexShaderFunc() {
  console.log(`vAxes: ${vAxes}`);
  return `
  precision highp float;
  attribute vec3 offset;
  attribute vec3 position;
  
  varying vec3 vPosition;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform vec3 cameraPosition;

  uniform float visibleArea;
  uniform vec3 lineColor;

  vec3 worldPosition;
  uniform bool polka;

  void main() {
    worldPosition = position + offset;
    worldPosition.${vAxes} += cameraPosition.${vAxes} - mod(cameraPosition.${vAxes}, 1.0);
    vPosition = worldPosition;

    if (polka) {
      gl_PointSize = 4.0;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
  }
`;
}

const Shader = {
  name: 'OpenGridHelper',
  uniforms: {
    'lineColor': { value: new THREE.Vector3(0, 0, 0) },
    'visibleArea': { value: 25 },
    'polka': { value: false }
  }
}

export { Grid, Shader }