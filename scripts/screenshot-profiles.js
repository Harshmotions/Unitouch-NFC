/* One-off script — captures high-DPI mobile screenshots of both demo
   profile pages for sharing/reference. Not part of the app build.
   Run with: npx --yes -p playwright node scripts/screenshot-profiles.js */

const { chromium } = require("playwright");
const path = require("path");

// iPhone 17 Pro logical CSS viewport (402x874 @ 3x) — Apple hasn't
// published exact numbers as of writing; this follows the Pro line's
// established sizing pattern (393x852 on the 15/16 Pro at 6.1").
const VIEWPORT = { width: 402, height: 874 };
const DEVICE_SCALE_FACTOR = 3;

const PAGES = [
  { url: "http://localhost:3001/u/rohan", out: "rohan-profile-iphone17pro.png" },
  { url: "http://localhost:3001/u/priya", out: "priya-profile-iphone17pro.png" },
];

async function main() {
  const browser = await chromium.launch();
  for (const { url, out } of PAGES) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const outPath = path.join(__dirname, "..", "public", out);
    await page.screenshot({ path: outPath });
    console.log(`Saved ${outPath}`);
    await context.close();
  }
  await browser.close();
}

main();
