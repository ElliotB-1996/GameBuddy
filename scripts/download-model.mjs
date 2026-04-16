/**
 * Downloads the Xenova/whisper-tiny model into resources/models/ so it can be
 * bundled with the app. Run once before building:
 *
 *   npm run download-model
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, createWriteStream, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const modelDir = join(__dirname, "..", "resources", "models");

// Files required by @xenova/transformers for Xenova/whisper-tiny ASR
const MODEL_ID = "Xenova/whisper-tiny";
const BASE_URL = `https://huggingface.co/${MODEL_ID}/resolve/main`;

const FILES = [
  "config.json",
  "generation_config.json",
  "preprocessor_config.json",
  "tokenizer_config.json",
  "tokenizer.json",
  "vocab.json",
  "merges.txt",
  "special_tokens_map.json",
  "onnx/encoder_model_quantized.onnx",
  "onnx/decoder_model_merged_quantized.onnx",
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  const total = Number(res.headers.get("content-length") ?? 0);
  let received = 0;

  const dir = dirname(dest);
  mkdirSync(dir, { recursive: true });

  const out = createWriteStream(dest);
  const reader = res.body.getReader();

  await new Promise((resolve, reject) => {
    out.on("error", reject);

    function pump() {
      reader.read().then(({ done, value }) => {
        if (done) {
          out.end(resolve);
          return;
        }
        received += value.length;
        if (total) {
          process.stdout.write(
            `\r  ${Math.round((received / total) * 100)}%   `,
          );
        }
        out.write(value, pump);
      }, reject);
    }
    pump();
  });

  process.stdout.write("\n");
}

const destRoot = join(modelDir, ...MODEL_ID.split("/"));

console.log(`Downloading ${MODEL_ID} to ${destRoot} ...\n`);

for (const file of FILES) {
  const dest = join(destRoot, file);
  if (existsSync(dest)) {
    console.log(`  skipping ${file} (already exists)`);
    continue;
  }
  process.stdout.write(`  ${file} `);
  await download(`${BASE_URL}/${file}`, dest);
}

console.log("\nDone. Model is ready in resources/models/");
