import { OpenThree } from "./service/three"
import { activeTheme } from "./base-type"
import * as THREE from 'three'

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
    this.threeScene = new OpenThree(container as HTMLElement);

    const button = this.shadow.querySelector("#toggle-theme");
    button?.addEventListener("click", () => {
      this.threeScene.toggleTheme("dark");
    });

    console.log('OpenPlanCanvas connectedCallback');
  }

  onThemeChange(value: string) {
    if (!value) {
      return;
    }
    this.threeScene.toggleTheme(value as activeTheme);
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
