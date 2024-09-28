/**
 * Author: Vishwajeet Mane
 * References
 * 1. https://github.com/Fyrestar/THREE.InfiniteGridHelper/blob/master/InfiniteGridHelper.js
 * 2. https://dev.to/javiersalcedopuyo/simple-infinite-grid-shader-5fah
 */

import * as THREE from 'three';

// const vertexShader = `
//   varying vec3 vWorldPosition;
//   void main() {
//     vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
//     vWorldPosition = worldPosition.xyz;
//     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//   }
// `;

// const fragmentShader = `
//   uniform vec3 color;
//   uniform float near;
//   uniform float far;
//   varying vec3 vWorldPosition;
//   void main() {
//     float depth = 1.0 - smoothstep( near, far, length( vWorldPosition ) / 1000.0 );
//     gl_FragColor = vec4( color * depth, 1.0 );
//   }
// `;

// const gridMaterial = new THREE.ShaderMaterial( {
//   uniforms: {
//     color: { value: new THREE.Color( 0x000000 ) },
//     near: { value: 1 },
//     far: { value: 1000 }
//   },
//   vertexShader,
//   fragmentShader
// } );


class Grid extends THREE.LineSegments {
  constructor(color = 0xffffff) {
    const shader = Shader;
    shader.uniforms.color.value.set(color);

    const material = new THREE.ShaderMaterial({
      name: shader.name,
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    const points = [];
    points.push(new THREE.Vector3(-1, 0, 0));
    points.push(new THREE.Vector3(1, 0, 0));
    points.push(new THREE.Vector3(0, 0, -1));
    points.push(new THREE.Vector3(0, 0, 1));
    // const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    // geometry.rotateX(Math.PI);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    super(geometry, material);
    this.frustumCulled = false;
  }
}

const axes = 'xzy'
const planeAxes = axes.substr( 0, 2 );

const Shader = {
  name: 'OpenGridHelper',
  uniforms: {
    color: { value: new THREE.Color(0xffffff) },
    uDistance: { value: 50 },
    size1: { value: 1 },
    size2: { value: 1 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    uniform float uDistance;
    void main() {
      vec3 pos = position * uDistance;
      // vec3 pos = position;
      pos.${planeAxes} = pos.${planeAxes} + cameraPosition.${planeAxes};
      vWorldPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float size1;
    uniform float size2;
    uniform float uDistance;
    varying vec3 vWorldPosition;

    float getGrid(float size) {
      vec2 r = vWorldPosition.${planeAxes} / size;
      vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
      float line = min(grid.x, grid.y);
      return 1.0 - min(line, 1.0);
    }

    void main() {
      // float d = 1.0 - min(distance(cameraPosition.${planeAxes}, vWorldPosition.${planeAxes}) / uDistance, 1.0);
      // float g1 = getGrid(size1);
      // float g2 = getGrid(size2);

      // gl_FragColor = vec4(color.rgb, mix(g2, g1, g1) * pow(d, 3.0));
      // gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2);

      // gl_FragColor = vec4(color.rgb, g1 * pow(d, 0.0));
    
      // if ( gl_FragColor.a <= 0.0 ) discard;
      
      gl_FragColor = vec4( color, 1.0 );
    }
  `
}

export { Grid, Shader }