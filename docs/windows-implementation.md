# Window Elements - BaseSingleWindow and BaseDoubleWindow

This document describes the newly created window elements that follow the same architecture as the `BaseDoor` element.

## Overview

Two new window classes have been created:
- **BaseSingleWindow**: A single casement/opening window
- **BaseDoubleWindow**: A double window with two panels and a center mullion

Both classes extend the `Opening` class from the kernel and implement the `IShape` interface.

## Files Created

1. `/src/elements/base-single-window.ts` - Single window implementation
2. `/src/elements/base-double-window.ts` - Double window implementation
3. `/examples/elements/baseSingleWindow.html` - Interactive example for single window
4. `/examples/elements/baseDoubleWindow.html` - Interactive example for double window

## Files Modified

1. `/src/elements/base-type.ts` - Added `WindowType` enum and updated `ElementType` enum
2. `/src/index.ts` - Added methods to create window instances

## BaseSingleWindow

### Interface: OPSingleWindow

```typescript
interface OPSingleWindow {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  dimensions: {
    start: { x: number; y: number; z: number; };
    end: { x: number; y: number; z: number; };
    length: number;
  };
  windowPosition: [number, number, number];
  windowType: WindowType;
  windowHeight: number;           // Height of the window panel
  windowThickness: number;        // Panel thickness
  frameThickness: number;         // Frame depth
  frameColor: number;             // Frame color (hex)
  windowColor: number;            // Window glass color (hex)
  windowRotation: number;         // Rotation value (1-2)
  windowQuadrant: number;         // Quadrant position (1-4)
  sillHeight: number;             // Height from floor to window bottom
  coordinates: Array<[number, number, number]>;
}
```

### Usage

```javascript
import { OpenPlans } from 'openplans';

const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();

// Create with default configuration
const singleWindow = openPlans.baseSingleWindow();

// Or create with custom configuration
const customWindow = openPlans.baseSingleWindow({
  labelName: 'Custom Window',
  windowHeight: 1.5,
  windowThickness: 0.08,
  frameThickness: 0.2,
  windowColor: 0x87CEEB,  // Sky blue
  frameColor: 0x8B4513,    // Saddle brown
  sillHeight: 1.0,
  windowQuadrant: 1,
  dimensions: {
    start: { x: -0.75, y: 0, z: 0 },
    end: { x: 0.75, y: 0, z: 0 },
    length: 1.5
  }
});
```

### Properties

- **windowLength**: Set/get the width of the window
- **windowHeight**: Height of the window panel
- **windowThickness**: Thickness of the glass/panel
- **frameThickness**: Depth of the frame
- **windowQuadrant**: Opening direction (1-4)
- **windowRotation**: How far the window is open (1=closed, 2=fully open)
- **sillHeight**: Height from floor to bottom of window
- **windowPosition**: 3D position of the window

### Sub-Elements

- **frame**: Group containing left, right, top, and sill frames
- **panel**: The openable window panel

## BaseDoubleWindow

### Interface: OPDoubleWindow

```typescript
interface OPDoubleWindow {
  ogid?: string;
  labelName: string;
  type: ElementType.WINDOW;
  dimensions: {
    start: { x: number; y: number; z: number; };
    end: { x: number; y: number; z: number; };
    length: number;
  };
  windowPosition: [number, number, number];
  windowType: WindowType;
  windowHeight: number;
  windowThickness: number;
  frameThickness: number;
  frameColor: number;
  windowColor: number;
  leftWindowRotation: number;     // Left panel rotation (1-2)
  rightWindowRotation: number;    // Right panel rotation (1-2)
  windowQuadrant: number;
  sillHeight: number;
  mullionWidth: number;           // Width of center divider
  coordinates: Array<[number, number, number]>;
}
```

### Usage

```javascript
import { OpenPlans } from 'openplans';

const openPlans = new OpenPlans(container);
await openPlans.setupOpenGeometry();

// Create with default configuration
const doubleWindow = openPlans.baseDoubleWindow();

// Or create with custom configuration
const customDoubleWindow = openPlans.baseDoubleWindow({
  labelName: 'Custom Double Window',
  windowHeight: 1.4,
  windowThickness: 0.06,
  frameThickness: 0.18,
  mullionWidth: 0.08,
  windowColor: 0x87CEEB,
  frameColor: 0x000000,
  sillHeight: 0.85,
  leftWindowRotation: 1.3,
  rightWindowRotation: 1.7,
  dimensions: {
    start: { x: -1.2, y: 0, z: 0 },
    end: { x: 1.2, y: 0, z: 0 },
    length: 2.4
  }
});
```

### Properties

All properties from BaseSingleWindow, plus:
- **leftWindowRotation**: Opening angle for left panel
- **rightWindowRotation**: Opening angle for right panel
- **mullionWidth**: Width of the center vertical divider

### Sub-Elements

- **frame**: Group containing left, right, top, and sill frames
- **mullion**: Center vertical divider between panels
- **leftPanel**: Left openable window panel
- **rightPanel**: Right openable window panel

## Window Types

The `WindowType` enum includes:
- `GLASS` - Standard glass window
- `WOOD` - Wooden window
- `SLIDING` - Sliding window
- `CASEMENT` - Casement (hinged) window
- `AWNING` - Awning style window
- `FIXED` - Fixed (non-opening) window
- `OTHER` - Other window types

## Quadrants

Both window types support 4 quadrants that determine the opening direction:

```
Wall Cross-Section View:

Quadrant 1: Opens outward to the right
Quadrant 2: Opens outward to the left
Quadrant 3: Opens inward to the left
Quadrant 4: Opens inward to the right
```

## Architecture

Both window classes follow the same pattern as `BaseDoor`:

1. **Extends Opening**: Inherit from kernel's `Opening` class
2. **Implements IShape**: Follow the shape interface contract
3. **Sub-Elements**: Store child geometries in a Map
4. **Views**: Support for plan and 3D views
5. **Skeleton**: Line representation of the window opening
6. **Property Setters**: Reactive property updates that rebuild geometry

## Methods

### Common Methods

- `setOPConfig(config)`: Update configuration and rebuild
- `getOPConfig()`: Get current configuration
- `setOPGeometry()`: Rebuild the window geometry
- `setOPMaterial()`: Update materials (placeholder for future use)
- `showProfileView(status)`: Toggle outline/opacity for plan views

## Examples

Two interactive HTML examples are provided:
- `/examples/elements/baseSingleWindow.html`
- `/examples/elements/baseDoubleWindow.html`

Both examples include UI controls to modify all window properties in real-time.

## Notes

- Windows are positioned at the origin by default
- The `sillHeight` determines how high above the floor the window starts
- Window panels rotate around a hinge point determined by the quadrant
- Rotation values range from 1 (closed) to 2 (fully open)
- The old `/src/elements/base-window.ts` file contains commented-out code and should be replaced or removed
