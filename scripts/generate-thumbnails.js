
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const elements = [
    // Furniture
    'chair2D',
    'sofa2D',
    'diningTable2D',
    'desk2D',
    'bed2D',
    'wardrobe2D',
    // Fixtures
    'toilet2D',
    'sink2D',
    'shower2D',
    'bathtub2D',
    'bidet2D',
    'urinal2D',
    // Appliances
    'refrigerator2D',
    'stove2D',
    'washer2D',
    'dishwasher2D',
    // Kitchen
    'kitchenSink2D',
    'counter2D',
    'cabinet2D',
    'island2D',
    // Landscape
    'tree2D',
    'shrub2D',
    'planter2D',
    'fountain2D',
    // Primitives
    'arc',
    'line',
    'polyline',
    'rectangle',
    // Dimensions
    'lineDimension',
    'angleDimension',
    'radiusDimension',
    // Shapes
    'cuboid',
    'cylinder',
    // Base 2D Elements
    'door2D',
    'doubleDoor2D',
    'doubleWindow2D',
    'stair2D',
    // Drafting Elements
    'paperFrame',
    'board'
];

const BASE_URL = 'http://localhost:5555/thumbnail-generator.html'; // Assuming default Vite port
const OUTPUT_DIR = path.join(__dirname, '../public/thumbnails');

async function ensureDirectoryExistence(filePath) {
    if (fs.existsSync(filePath)) {
        return true;
    }
    fs.mkdirSync(filePath, { recursive: true });
}

async function run() {
    await ensureDirectoryExistence(OUTPUT_DIR);

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 800, height: 800, deviceScaleFactor: 2 } // 1600x1600 effective resolution
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`FAILED RESPONSE: ${response.status()} ${response.url()}`);
        }
    });

    console.log(`Starting thumbnail generation for ${elements.length} elements...`);

    for (const element of elements) {
        console.log(`Processing ${element}...`);

        try {
            await page.goto(`${BASE_URL}?element=${element}`);

            // Wait for the specific signal that the scene is ready
            await page.waitForSelector('body[data-ready="true"]', { timeout: 5000 });

            // Allow a tiny bit of extra time for any rendering to settle
            await new Promise(r => setTimeout(r, 100));

            const outputPath = path.join(OUTPUT_DIR, `${element}.png`);

            await page.screenshot({
                path: outputPath,
                omitBackground: true // Transparent background
            });

            console.log(`Saved ${element}.png`);
        } catch (error) {
            console.error(`Failed to generate thumbnail for ${element}:`, error.message);
        }
    }

    await browser.close();
    console.log('Thumbnail generation complete!');
}

run();
