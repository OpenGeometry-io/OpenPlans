import * as THREE from 'three';

interface LogoInfoBlockOptions {
  altText: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  width: number;
  height: number;
}

export class LogoInfoBlock {
  options: LogoInfoBlockOptions;

  constructor() {
    this.options = {
      altText: 'Logo',
      logoUrl: 'https://raw.githubusercontent.com/OpenGeometry-io/.github/refs/heads/main/profile/opengeometryTextLogo.png',
      logoWidth: 1,
      logoHeight: 1,
      width: 8,
      height: 1,
    };
  }

  set logoUrl(url: string) {
    this.options.logoUrl = url;
  }

  generateLogoTexture(): THREE.Texture {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(this.options.logoUrl, (texture) => {
      texture.needsUpdate = true;
    });

    // Set the texture size based on the logo width and height
    texture.repeat.set(this.options.logoWidth, this.options.logoHeight);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }

  generateBlock(): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(this.options.width, this.options.height);
    const material = new THREE.MeshBasicMaterial({
      map: this.generateLogoTexture(),
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'LogoInfoBlock';
    mesh.position.set(0, 0, 0);

    return mesh;
  }

  resetBlock() {
    this.options = {
      altText: 'Logo',
      logoUrl: 'https://raw.githubusercontent.com/OpenGeometry-io/.github/refs/heads/main/profile/opengeometryTextLogo.png',
      logoWidth: 1,
      logoHeight: 1,
      width: 8,
      height: 1,
    };
  }

  updateBlock() {
    // Update the block properties if needed
    // For example, you can change the logo URL or dimensions here
  }
}