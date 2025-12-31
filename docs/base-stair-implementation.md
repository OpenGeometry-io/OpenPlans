# BaseStair Implementation Summary

## Overview
Successfully implemented the `BaseStair` class following the same principles and patterns as `BaseSlab`, `BaseDoor`, and `BaseWindow`.

## Files Created/Modified

### 1. `/src/elements/base-stair.ts` (NEW)
- **Class**: `BaseStair extends THREE.Group implements IShape`
- **Element Type**: `ElementType.STAIR`
- **Key Features**:
  - Extends THREE.Group (unlike BaseSlab which extends Cuboid)
  - Implements IShape interface for consistency
  - Automatically calculates number of steps based on height and riser
  - Creates treads, risers, stringers, and optional handrails

#### Properties:
```typescript
interface OPStair {
  ogid?: string;
  labelName: string;
  type: ElementType.STAIR;
  stairType: StairType;
  dimensions: {
    width: number;        // Width of the staircase
    totalHeight: number;  // Total vertical rise
    totalLength: number;  // Total horizontal run
  };
  stairPosition: [number, number, number];
  riserHeight: number;    // Height of each step (rise)
  treadDepth: number;     // Depth of each step (run)
  numberOfSteps: number;  // Total number of steps
  stairColor: number;
  handrailColor: number;
  hasHandrail: boolean;
  handrailHeight: number;
  stairMaterial: string;
  coordinates: Array<[number, number, number]>;
}
```

#### Stair Types:
```typescript
enum StairType {
  STRAIGHT = 'STRAIGHT',
  LSHAPED = 'LSHAPED',
  USHAPED = 'USHAPED',
  SPIRAL = 'SPIRAL',
  WINDER = 'WINDER',
}
```
*Note: Currently only STRAIGHT type is fully implemented. Other types are ready for future development.*

#### Key Methods:
- **Setters/Getters**: 
  - `labelName`, `stairColor`, `handrailColor`, `stairMaterial`
  - `stairPosition`, `stairWidth`, `totalHeight`
  - `riserHeight`, `treadDepth`, `hasHandrail`, `handrailHeight`
- **Configuration**: `setOPConfig()`, `getOPConfig()`
- **Geometry**: `setOPGeometry()`, `setOPMaterial()`
- **Visualization**: `showProfileView()`, `dispose()`
- **Calculation**: `calculateSteps()`, `calculateCoordinatesByConfig()`

#### Sub-elements:
- **steps**: Group containing all tread and riser Cuboids
- **stringers**: Diagonal support beams on sides (semi-transparent)
- **handrails**: Optional cylindrical handrails (left and right)
- **landing**: Reserved for future landing platform implementation

#### Automatic Calculations:
1. **Number of Steps**: `numberOfSteps = ceil(totalHeight / riserHeight)`
2. **Adjusted Riser Height**: Ensures even distribution of steps
3. **Total Length**: `totalLength = (numberOfSteps - 1) × treadDepth`

### 2. `/src/elements/base-type.ts` (MODIFIED)
Added new element type to the ElementType enum:
```typescript
export enum ElementType {
  // ... existing types
  STAIR = 'STAIR',
  // ... existing types
}
```

### 3. `/src/index.ts` (MODIFIED)
Added BaseStair integration:
- **Import**: Added `import { BaseStair, OPStair } from './elements/base-stair';`
- **Factory Method**: Added `baseStair()` method to OpenPlans class:
```typescript
baseStair(config?: OPStair): BaseStair {
  const stair = new BaseStair(config);
  this.openThree.scene.add(stair);
  this.ogElements.push(stair);
  return stair;
}
```

### 4. `/examples/elements/baseStair.html` (NEW)
Created comprehensive example demonstrating:
- Basic stair creation with default parameters
- Interactive GUI controls for all properties:
  - Dimensions (width, height, riser, tread)
  - Colors (stair, handrail)
  - Handrail settings (enabled, height)
  - Position controls (X, Y, Z)
- Camera presets (top view, side view, reset)
- Profile view toggle
- Dynamic stair creation with custom parameters
- Configuration retrieval and disposal

### 5. `/index.html` (MODIFIED)
Updated the main index page:
- Removed "Coming Soon" status from Stairs section
- Added link to the stair example: `./examples/elements/baseStair.html`

## Design Principles Followed

### 1. Inheritance Pattern
- Extends `THREE.Group` (different from BaseSlab which extends Cuboid)
- This allows for complex hierarchical structures with multiple sub-elements
- Implements `IShape` interface for consistent API

### 2. Property Management
- Uses `propertySet` object to store all configuration
- Implements getters/setters for controlled property updates
- Automatic geometry updates when properties change
- Smart recalculation of dependent values (steps, length)

### 3. Sub-elements Architecture
- Uses `Map<SubElementType, THREE.Object3D>` for organizing child elements
- Supports multiple component types:
  - **Steps Group**: Contains all tread and riser cuboids
  - **Stringers Group**: Side support structures
  - **Handrails Group**: Optional safety rails

### 4. Automatic Calculations
- **Step Calculation**: Automatically determines optimal number of steps
- **Riser Adjustment**: Ensures even distribution across total height
- **Length Calculation**: Computes total run based on steps and tread depth

### 5. Configuration API
- `setOPConfig()`: Accepts full configuration object
- `getOPConfig()`: Returns current configuration
- `setOPGeometry()`: Updates 3D geometry (rebuilds all sub-elements)
- `setOPMaterial()`: Updates materials and colors

### 6. View Management
- Supports multiple view types ('plan', '3d')
- `showProfileView()`: Enhanced for complex multi-element structures
  - Handles Cuboid elements (steps, stringers)
  - Handles Mesh elements (handrails)
  - Sets appropriate opacity for profile mode
- Proper outline control for technical drawings

### 7. Lifecycle Management
- Clean constructor with optional configuration
- Proper `dispose()` method for cleanup of all sub-elements
- Automatic coordinate calculation
- Smart geometry regeneration

## Usage Example

```typescript
// Create a basic stair
const stair = openPlans.baseStair();

// Create a custom stair
const customStair = openPlans.baseStair({
  labelName: 'Main Staircase',
  type: ElementType.STAIR,
  stairType: StairType.STRAIGHT,
  dimensions: {
    width: 1.5,
    totalHeight: 4.0,
    totalLength: 5.6, // Auto-calculated
  },
  stairPosition: [0, 0, 0],
  riserHeight: 0.18,
  treadDepth: 0.30,
  numberOfSteps: 22, // Auto-calculated
  stairColor: 0x8B7355,
  handrailColor: 0x654321,
  hasHandrail: true,
  handrailHeight: 1.0,
  stairMaterial: 'wood',
  coordinates: [],
});

// Update properties
stair.stairWidth = 1.8;
stair.totalHeight = 3.5;
stair.riserHeight = 0.17;
stair.treadDepth = 0.28;
stair.hasHandrail = true;
stair.handrailHeight = 0.9;
stair.stairColor = 0xA0826D;
stair.handrailColor = 0x4A3728;
stair.stairPosition = [5, 0, 0];

// Get configuration
const config = stair.getOPConfig();
console.log('Number of steps:', stair.propertySet.numberOfSteps);

// Show profile view
stair.showProfileView(true);

// Dispose
stair.dispose();
```

## Technical Details

### Step Construction
Each step consists of:
1. **Tread**: Horizontal walking surface (Cuboid)
   - Width: `treadDepth`
   - Height: 0.05m (5cm thickness)
   - Depth: `stairWidth`

2. **Riser**: Vertical face between steps (Cuboid)
   - Width: 0.02m (2cm thickness)
   - Height: `riserHeight - treadThickness`
   - Depth: `stairWidth`

### Stringer Construction
- Two diagonal support beams (left and right)
- Semi-transparent for visualization
- Positioned outside the stair width
- Height and length match stair dimensions

### Handrail Construction
- Cylindrical geometry with 4cm radius
- Angled to follow stair slope
- Positioned at specified `handrailHeight` above steps
- Two rails (left and right sides)
- Optional (can be toggled on/off)

### Building Code Compliance
Default values follow common building codes:
- **Riser Height**: 17cm (range: 15-22cm)
- **Tread Depth**: 28cm (range: 22-35cm)
- **Handrail Height**: 90cm (range: 70-120cm)
- **Stair Width**: 120cm minimum

## Comparison with Other Elements

### Similarities:
1. ✅ Implements IShape interface
2. ✅ Uses propertySet for configuration
3. ✅ Has setOPConfig/getOPConfig methods
4. ✅ Has setOPGeometry/setOPMaterial methods
5. ✅ Uses subElements Map for organizing child objects
6. ✅ Implements showProfileView for technical drawings
7. ✅ Has proper dispose method
8. ✅ Supports selected and edit states
9. ✅ Factory method in OpenPlans class
10. ✅ Example HTML with interactive controls

### Key Differences:
- **BaseDoor**: Single opening element with frame and panel
- **BaseWindow**: Single opening element with glass and frame
- **BaseSlab**: Single horizontal surface (extends Cuboid)
- **BaseStair**: Complex multi-element structure (extends THREE.Group)
  - Multiple steps (treads and risers)
  - Stringers for support
  - Optional handrails
  - Automatic step calculations
  - More complex geometry management

## Future Enhancements
- [ ] Implement L-shaped stairs
- [ ] Implement U-shaped stairs
- [ ] Implement spiral stairs
- [ ] Add landing platforms
- [ ] Add balustrades and spindles
- [ ] Add under-stair storage
- [ ] Support for curved stairs
- [ ] Stair nosing details
- [ ] Material textures (wood grain, concrete, metal)
- [ ] Building code validation
- [ ] Export to IFC with stair metadata
- [ ] Winder steps for turning stairs
- [ ] Anti-slip tread patterns

## Testing
To test the implementation:
1. Open `examples/elements/baseStair.html` in a browser
2. Use the GUI controls to:
   - Adjust stair dimensions
   - Change riser and tread sizes (observe auto-calculation)
   - Toggle handrails on/off
   - Modify colors
   - Change position
3. Create multiple stairs with different configurations
4. Test profile view mode
5. Switch between camera views (top, side, perspective)
6. Verify disposal functionality
7. Check console for configuration output
