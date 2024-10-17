// https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram

import * as THREE from 'three';

function vertexShader () {
  return `
    precision highp float;
    uniform float thickness;
    attribute vec3 normal;
    attribute vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform float size;

    void main() {
      vec4 tNormal = vec4(normal, 0.0);
      vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec4 clipNormal = projectionMatrix * modelViewMatrix * tNormal;
      vec2 offset = normalize(clipNormal.xz) * thickness / size * clipPosition.w * 2.0;
      clipPosition.xz += offset;
      gl_Position = clipPosition;
    }
  `;
}

function fragmentShader () {
  return `
    precision highp float;
    uniform vec3 color;
    uniform float opacity;

    void main() {
      gl_FragColor = vec4(color, opacity);
    }
  `;
}

const shader = {
  name: 'OpenOutliner',
  uniforms: {
    thickness: { value: 0.1 },
    color: { value: new THREE.Color(0x000000) },
    opacity: { value: 1.0 },
    size: { value: 1.0 }
  }
}

export {
  vertexShader,
  fragmentShader,
  shader
};