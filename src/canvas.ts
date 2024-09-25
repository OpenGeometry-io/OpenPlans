import { OpenThree, activeTheme } from "./service/three"
import * as THREE from 'three'
// const uiStore = {

// }

// const html = `
//   <div id="canvas"></div>
// `

// function setupUI (canvasDiv: HTMLDivElement) {
//   const button = document.createElement('button')
//   button.textContent = 'Click me'
//   button.onclick = () => {
//     alert('Hello, world!')
//   }
//   canvasDiv.appendChild(button)
// }

// function setupCanvas(canvasDiv: HTMLDivElement) {
//   if (!canvasDiv) {
//     return
//   }

//   setupUI(canvasDiv)

//   const threeScene = new OpenThree(canvasDiv)
//   threeScene.addCube()
// }

// export function OpenCanvas() {
//   // console.log('OpenCanvas');
  
//   return html
// }


class OpenPlanCanvas extends HTMLElement {
  static observedAttributes = ["size"];
  private shadow: ShadowRoot;
  private threeScene!: OpenThree;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();

    const container = this.shadow.querySelector("div");
    console.log(container);
    this.threeScene = new OpenThree(container as HTMLElement);
    this.threeScene.addCube();

    const button = this.shadow.querySelector("#toggle-theme");
    button?.addEventListener("click", () => {
      this.threeScene.toggleTheme("dark");
      (this.threeScene.dummyMesh.material as THREE.MeshStandardMaterial).color.set(this.threeScene.theme.dark.color);
    });

    console.log('OpenPlanCanvas connectedCallback');
  }

  onThemeChange(value: string) {
    if (!value) {
      return;
    }
    this.threeScene.toggleTheme(value as activeTheme);
    (this.threeScene.dummyMesh.material as THREE.MeshStandardMaterial).color.set(this.threeScene.theme[value as activeTheme].color);
  }

  render() {
    const size = this.getAttribute("size") || "100";
    this.shadow.innerHTML = `
      <style>
        div {
          width: ${size}%;
          height: ${size}%;
          position: absolute;
        }
      </style>
      <div>
        <div style="position: absolute; top: 0; left: 0;">
          <oi-dropdown>
            <oi-option name="dark">Dark</oi-option>
            <oi-option name="light">Light</oi-option>
            <oi-option name="darkBlue">Dark Blue</oi-option>
          </oi-dropdown>
        </div>
      </div>
    `;

    const dropdown = this.shadow.querySelector("oi-dropdown");
    dropdown?.addEventListener("onselect", (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(customEvent.detail);
      this.onThemeChange(customEvent.detail.name);
    });
  }
}

customElements.define("open-plans-canvas", OpenPlanCanvas);
