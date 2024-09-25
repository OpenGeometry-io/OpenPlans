export class OIDropdown extends HTMLElement {
  private shadow: ShadowRoot;
  trigger: any;
  dropdown: any;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    console.log(this);
    // Create Base Elements
    const dropdownTrigger = document.createElement('span');
    dropdownTrigger.innerHTML = 'Select';

    // Get elements
    const options = this.getElementsByTagName('oi-option');
    if (options.length === 0) {
      throw new Error('Dropdown must have at least one oi-option element');
    }

    // Create Dropdown
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown');
    dropdown.appendChild(dropdownTrigger);

    const dropdownOptions = document.createElement('div');
    dropdownOptions.classList.add('dropdown-options');
    dropdown.appendChild(dropdownOptions);

    this.shadowRoot?.appendChild(dropdown);

    // Add options to dropdown
    for (let option of options) {
      const optionElement = document.createElement('span');
      optionElement.innerHTML = option.innerHTML;
      optionElement.setAttribute('name', option.getAttribute('name') || option.innerHTML);
      optionElement.addEventListener('click', this.onDropdownSelect.bind(this));
      dropdownOptions.appendChild(optionElement);
    }

    this.dropdown = dropdown;

    // Add event listeners
    dropdownTrigger.addEventListener('click', this.toggleDropdown.bind(this));
  }

  onDropdownSelect(event) {
    const customEvent = new CustomEvent('onselect', {
      detail: {
        name: event.target.getAttribute('name'),
        value: event.target.innerHTML
      }
    });
    console.log(customEvent);

    // Dispatch the event from the host element
    this.dispatchEvent(customEvent);

    // Close the dropdown after selection
    this.dropdown.classList.remove('active');
  }

  toggleDropdown(event) {
    event.stopPropagation();
    this.dropdown.classList.toggle('active');
  }

  render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        .dropdown {
          position: relative;
          display: inline-block;
        }
        .dropdown span {
          cursor: pointer;
          padding: 6px 10px;
          border: 1px solid #ccc;
          box-shadow: 0 3px 10px rgb(0 0 0 / 0.2);
          border-radius: 6px;
          display: inline-block;
          background-color: #fff;
        }
        .dropdown-options {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          z-index: 1;
          background-color: #fff;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .dropdown.active .dropdown-options {
          display: block;
        }
        .dropdown-options span {
          display: block;
          padding: 6px;
          border-bottom: 1px solid #ccc;
        }
        .dropdown-options span:last-child {
          border-bottom: none;
        }
      </style>
    `;
  
    console.log('OIDropdown connectedCallback');
  }
}

customElements.define("oi-dropdown", OIDropdown);
