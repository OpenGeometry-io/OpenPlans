// https://threejs.org/docs/#api/en/renderers/webgl/WebGLProgram

import * as THREE from 'three';

function vertexShader () {
  return `
        precision highp float;

    attribute vec3 position;
    attribute vec3 color;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    varying vec3 vColor;

    void main() {
      vColor = color;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
}

function fragmentShader () {
  return `
        precision highp float;
    varying vec3 vColor;

    void main() {
        float threshold = 0.1; // Sensitivity threshold
        
        // Approximate the edge detection by checking the color differences
        // In a real scenario, you would sample neighboring pixels
        // Here, we'll just use a fake neighboring color to illustrate:
        
        vec3 neighborColor = vec3(0.0, 0.0, 0.0); // Replace with actual neighboring color if possible
        
        // Calculate color difference
        float edgeStrength = length(vColor - neighborColor);

        // Output white for edges, black otherwise
        if (edgeStrength > threshold) {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // White for edges
        } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black otherwise
        }
    }
  `;
}




const shader = {
  name: 'OpenOutliner',
  uniforms: {
    thickness: { value: 0.1 },
    color: { value: new THREE.Color(0x000000) },
    screenResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  }
}

export {
  vertexShader,
  fragmentShader,
  shader
};