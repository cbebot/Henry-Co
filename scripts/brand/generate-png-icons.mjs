// Generate PNG icon set for every HenryCo app from the canonical monogram SVG.
// Outputs (per app, written to apps/<app>/public/brand/):
//   apple-touch-icon.png      180×180  · solid #050816 background · monogram at 75% scale
//   icon-192.png              192×192  · transparent background  · monogram with 4px inset
//   icon-512.png              512×512  · transparent background  · monogram with 4px inset
//   icon-512-maskable.png     512×512  · solid #050816 background · monogram at 80% (10% safe zone)
//
// Source of truth: packages/ui/src/brand/static/icon.svg
// Rasteriser: sharp (already present transitively via next 16.x; declared as devDep at root)

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceSvgPath = path.join(
  repoRoot,
  "packages",
  "ui",
  "src",
  "brand",
  "static",
  "icon.svg",
);

const APPS = [
  "hub",
  "account",
  "care",
  "marketplace",
  "property",
  "logistics",
  "jobs",
  "learn",
  "studio",
];

const BG_HEX = "#050816";
const BG_RGB = { r: 0x05, g: 0x08, b: 0x16, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

function buildTasks(canvas) {
  return canvas;
}

async function rasteriseMonogram(svg, size) {
  return sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
}

async function compose({ canvas, background, monogramSize, svg, outPath }) {
  const monogramBuf = await rasteriseMonogram(svg, monogramSize);
  const offset = Math.floor((canvas - monogramSize) / 2);
  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background,
    },
  })
    .composite([{ input: monogramBuf, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toBuffer()
    .then((buf) => fs.writeFile(outPath, buf));
}

async function main() {
  const sourceSvg = await fs.readFile(sourceSvgPath, "utf8");

  // Two SVG variants: the default dark fill (#0F0F12) is invisible against
  // the brand's #050816 surface, so for any rendered context the monogram
  // needs the light cream fill (#F5F4EE) which is what dark-mode users
  // already see via the SVG's prefers-color-scheme rule. We also strip the
  // @media block so librsvg never picks the dark fill at rasterisation time.
  const lightSvg = sourceSvg
    .replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^}]*\}/gi, "")
    .replace(/fill:\s*#0F0F12/gi, "fill: #F5F4EE");

  const failures = [];
  const written = [];

  for (const app of APPS) {
    const outDir = path.join(repoRoot, "apps", app, "public", "brand");
    await fs.mkdir(outDir, { recursive: true });

    const recipes = [
      {
        name: "apple-touch-icon.png",
        canvas: 180,
        background: BG_RGB,
        monogramSize: Math.round(180 * 0.75),
      },
      {
        name: "icon-192.png",
        canvas: 192,
        background: TRANSPARENT,
        monogramSize: 192 - 2 * 4,
      },
      {
        name: "icon-512.png",
        canvas: 512,
        background: TRANSPARENT,
        monogramSize: 512 - 2 * 4,
      },
      {
        name: "icon-512-maskable.png",
        canvas: 512,
        background: BG_RGB,
        monogramSize: Math.round(512 * 0.80),
      },
    ];

    for (const recipe of recipes) {
      const outPath = path.join(outDir, recipe.name);
      try {
        await compose({
          canvas: recipe.canvas,
          background: recipe.background,
          monogramSize: recipe.monogramSize,
          svg: lightSvg,
          outPath,
        });
        const rel = path.relative(repoRoot, outPath).replace(/\\/g, "/");
        console.log(`  + ${rel}  (${recipe.canvas}x${recipe.canvas})`);
        written.push(rel);
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        failures.push(`${app}/${recipe.name}: ${msg}`);
        console.error(`  ! ${app}/${recipe.name}: ${msg}`);
      }
    }
  }

  console.log("");
  console.log(
    `Wrote ${written.length} PNG file(s) across ${APPS.length} apps.`,
  );

  if (failures.length > 0) {
    console.error("");
    console.error(`${failures.length} failure(s):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
