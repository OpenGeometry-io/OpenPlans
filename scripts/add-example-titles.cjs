/**
 * Script to add title overlays to all example HTML files
 * Run with: node scripts/add-example-titles.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Title mappings based on filename
const titleMappings = {
    // Primitives
    'line.html': 'Line Primitive',
    'polyline.html': 'Polyline Primitive',
    'arc.html': 'Arc Primitive',
    'rectangle.html': 'Rectangle Primitive',

    // Shapes
    'cuboid.html': 'Cuboid Shape',
    'cylinder.html': 'Cylinder Shape',

    // Dimensions
    'line-dimension.html': 'Line Dimension',
    'angle-dimension.html': 'Angle Dimension',

    // Drawings
    'paper.html': 'Paper Frame',
    'logo-block.html': 'Logo Block',
    'dynamic-text-block.html': 'Dynamic Text Block',

    // DXF Export
    'dxf-export/index.html': 'DXF Export',

    // Elements
    'baseDoor.html': 'Base Door 3D',
    'baseDoor2DView.html': 'Base Door 2D View',
    'baseWindow.html': 'Base Window',
    'baseSingleWindow.html': 'Single Window 3D',
    'baseDoubleWindow.html': 'Double Window 3D',
    'baseWall.html': 'Base Wall',
    'baseSlab.html': 'Base Slab',
    'baseStair.html': 'Base Stair',
    'board.html': 'Drawing Board',
    'doubleWindow.html': 'Double Window',
    'spaceContainer.html': 'Space Container',
    'legoBlock.html': 'Lego Block',

    // 2D Elements
    'baseDoor2D.html': 'Door 2D',
    'doubleDoor2D.html': 'Double Door 2D',
    'singleWindow2D.html': 'Single Window 2D',
    'doubleWindow2D.html': 'Double Window 2D',
    'stair2D.html': 'Stair 2D',

    // Fixtures
    'toilet2D.html': 'Toilet 2D',
    'sink2D.html': 'Sink 2D',
    'shower2D.html': 'Shower 2D',
    'bathtub2D.html': 'Bathtub 2D',
    'bidet2D.html': 'Bidet 2D',
    'urinal2D.html': 'Urinal 2D',

    // Appliances
    'refrigerator2D.html': 'Refrigerator 2D',
    'stove2D.html': 'Stove 2D',
    'dishwasher2D.html': 'Dishwasher 2D',
    'washer2D.html': 'Washer 2D',

    // Furniture
    'bed2D.html': 'Bed 2D',
    'sofa2D.html': 'Sofa 2D',
    'chair2D.html': 'Chair 2D',
    'desk2D.html': 'Desk 2D',
    'diningTable2D.html': 'Dining Table 2D',
    'wardrobe2D.html': 'Wardrobe 2D',

    // Kitchen
    'cabinet2D.html': 'Cabinet 2D',
    'counter2D.html': 'Counter 2D',
    'island2D.html': 'Island 2D',
    'kitchenSink2D.html': 'Kitchen Sink 2D',

    // Landscape
    'tree2D.html': 'Tree 2D',
    'fountain2D.html': 'Fountain 2D',

    // Glyph
    'glyph.html': 'Glyph Text',

    // JSON/IFC
    'jsonGeneratedPlans.html': 'JSON Generated Plans',
    'json_floor_plan.html': 'JSON Floor Plan',
    'export-ifc.html': 'IFC Export',
    'impleniaJsonToFloorplans.html': 'Implenia JSON to Floor Plans',

    // Shape Builder
    'shape-builder/index.html': 'Shape Builder',

    // Demo
    'demo.html': 'Floor Plan Demo',
};

// CSS and HTML to inject
const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">`;

const titleCss = `
    .example-title {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Space Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #fff;
      background: rgba(26, 26, 26, 0.8);
      padding: 12px 24px;
      z-index: 1000;
    }`;

function getTitleForFile(filePath) {
    const filename = path.basename(filePath);

    // Check direct mapping
    if (titleMappings[filename]) {
        return titleMappings[filename];
    }

    // Check path-based mapping
    for (const [key, value] of Object.entries(titleMappings)) {
        if (filePath.includes(key)) {
            return value;
        }
    }

    // Generate title from filename
    const name = filename.replace('.html', '');
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/2D/g, ' 2D')
        .replace(/3D/g, ' 3D')
        .trim()
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function addTitleToFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has example-title
    if (content.includes('example-title')) {
        console.log(`Skipping (already has title): ${filePath}`);
        return;
    }

    const title = getTitleForFile(filePath);

    // Add Google Font link to head if not present
    if (!content.includes('Space+Mono') && !content.includes('Space Mono')) {
        content = content.replace('</head>', `  ${fontLink}\n</head>`);
    }

    // Add CSS to existing style block
    if (content.includes('</style>')) {
        content = content.replace('</style>', `${titleCss}\n  </style>`);
    }

    // Add title div after body tag
    const titleDiv = `<div class="example-title">${title}</div>`;
    content = content.replace('<body>', `<body>\n  ${titleDiv}`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added title "${title}" to: ${filePath}`);
}

// Find all HTML files in examples folder
const exampleFiles = glob.sync('examples/**/*.html', {
    cwd: path.join(__dirname, '..'),
    absolute: true
});

console.log(`Found ${exampleFiles.length} example files`);

exampleFiles.forEach(filePath => {
    try {
        addTitleToFile(filePath);
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
});

console.log('\nDone!');
