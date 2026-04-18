/**
 * Patches @huggingface/transformers/src/utils/image.js to stub out the static
 * `import sharp from 'sharp'` line. The file already guards all sharp usage
 * behind `if (sharp)` checks, so setting it to null is safe for audio-only
 * pipelines. This avoids DLL resolution errors on Windows where sharp is
 * rebuilt for Electron but its companion libvips DLLs are not restored.
 *
 * Run automatically via postinstall.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const imagePath = join(
  __dirname,
  "..",
  "node_modules",
  "@huggingface",
  "transformers",
  "src",
  "utils",
  "image.js",
);

const PATCHES = [
  {
    original: `import sharp from 'sharp';`,
    stub: `const sharp = null; // stubbed — not needed for audio-only pipelines`,
    label: "sharp import",
  },
  {
    original: `    throw new Error('Unable to load image processing library.');`,
    stub: `    // no image processing library — audio-only mode, image ops will be unavailable`,
    label: "image library throw",
  },
];

let content = readFileSync(imagePath, "utf-8");
let changed = false;

for (const { original, stub, label } of PATCHES) {
  if (content.includes(stub)) {
    console.log(`patch-transformers: ${label} already patched, skipping.`);
  } else if (content.includes(original)) {
    content = content.replace(original, stub);
    changed = true;
    console.log(`patch-transformers: patched ${label} ✓`);
  } else {
    console.warn(`patch-transformers: could not find ${label} — skipping.`);
  }
}

if (changed) {
  writeFileSync(imagePath, content, "utf-8");
  console.log("patch-transformers: wrote patched image.js");
}
