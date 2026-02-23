# OpenPlans - Copilot Instructions

## Project Overview
OpenPlans is a TypeScript library for creating 2D/3D architectural floor plans and CAD elements. Built on Three.js with a Rust/WASM geometry kernel (OpenGeometry).

## Architecture

### Layer Hierarchy
```
src/kernel/       → WASM geometry primitives (Line, Polyline, Cuboid, Polygon, Vector3)
src/primitives/   → Basic drawing elements implementing IPrimitive (uses subNodes Map)
src/shapes/       → 3D shape wrappers (CuboidShape, CylinderShape)
src/elements/     → Architectural elements implementing IShape (uses subElements Map)
  └─ planview/    → 2D plan representations (fixtures/, furniture/, appliances/, kitchen/, landscape/)
src/service/      → OpenThree (scene/renderer), PlanCamera, ShapeSelector
src/index.ts      → OpenPlans orchestrator class with factory methods
```

### Two Interface Patterns
- **`IShape`** (`src/shapes/base-type.ts`) - For elements: uses `subElements: Map<string, THREE.Object3D>`
- **`IPrimitive`** (`src/primitives/base-type.ts`) - For primitives: uses `subNodes: Map<string, THREE.Object3D>`

Both share: `ogType`, `selected`, `edit`, `locked`, `propertySet`, `setOPGeometry()`, `setOPConfig()`, `getOPConfig()`

## Creating New Elements

### 3D Element Pattern (see: `src/elements/base-slab.ts`)
```typescript
export interface OPMyElement {
  ogid?: string;
  labelName: string;
  type: ElementType.MYTYPE;
  // ...typed properties
}

export class BaseMyElement extends Cuboid implements IShape {
  ogType: string = ElementType.MYTYPE;
  subElements: Map<string, THREE.Object3D> = new Map();
  selected = false; edit = false; locked = false;
  propertySet: OPMyElement = { /* defaults */ };

  set myProperty(value: number) {
    this.propertySet.myProperty = value;
    this.setOPGeometry();  // Rebuild geometry on property change
  }

  constructor(config?: OPMyElement) {
    super();
    if (config) this.propertySet = { ...this.propertySet, ...config };
    this.setOPGeometry();
  }

  setOPGeometry(): void {
    // Clear old subElements, create new geometry, add to this
    const body = new Cuboid({ /* from propertySet */ });
    this.add(body);
    this.subElements.set('body', body);
  }
}
```

### 2D Plan Element Pattern (see: `src/elements/planview/toilet2D.ts`)
- Extend `Polyline` (for boundaries) or `Polygon` (for filled shapes)
- Constructor: set defaults → merge config → call `setOPGeometry()`
- Create child `Polygon` shapes for visual parts, store in `subElements`

### Register New Elements
1. Add factory method to `OpenPlans` class in `src/index.ts`:
```typescript
myElement(config?: OPMyElement): BaseMyElement {
  const el = new BaseMyElement(config);
  this.openThree.scene.add(el);
  this.ogElements.push(el);
  return el;
}
```
2. Export interface and class from `src/index.ts`
3. Add to `ElementType` enum in `src/elements/base-type.ts`

## Development

### Setup (Kernel Required)
```bash
git clone https://github.com/OpenGeometry-io/OpenGeometry ../OpenGeometry
cd ../OpenGeometry && npm install && npm run build-local
cd ../OpenPlans && npm install && npm run dev  # localhost:5555
```

### Commands
- `npm run dev` - Vite dev server (port 5555)
- `npm run build` - Rollup library build → `dist/`
- `npm run build-examples` - Vite examples build → `examples-dist/`
- `npm run release` - Build + npm publish

### Testing Changes
No test framework configured. Test via `examples/` HTML files:
```html
<script type="module">
  import { OpenPlans, CameraMode } from './../../src/index.ts';
  const openPlans = new OpenPlans(container);
  await openPlans.setupOpenGeometry();  // Required: loads WASM + fonts
  openPlans.CameraMode = CameraMode.Plan;
  const el = openPlans.myElement({ /* config */ });
</script>
```

Query elements: `openPlans.getEntitiesByType('MYTYPE')`

## Naming Conventions
| Type | Class | Interface | File |
|------|-------|-----------|------|
| 3D Element | `Base{Name}` | `OP{Name}` | `base-{name}.ts` |
| 2D Element | `{Name}2D` | `{Name}Options` | `{name}2D.ts` |
| Primitive | `{Name}Primitive` | - | `{name}.ts` |

## Key APIs
- `openPlans.setupOpenGeometry()` - Must await before creating elements
- `element.setOPGeometry()` - Rebuild geometry (call in property setters)
- `element.propertySet` - All configurable properties in one object
- `element.subElements.get('partName')` - Access child Three.js objects
- `openPlans.disposeElement(ogid)` - Clean removal from scene
