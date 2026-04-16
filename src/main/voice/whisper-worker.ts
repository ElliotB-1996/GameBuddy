import { workerData, parentPort } from "worker_threads";
import Module from "module";

// @xenova/transformers statically imports `sharp` for image processing.
// We only use it for audio (ASR), so stub it out to avoid DLL resolution
// errors on Windows. The transformers image.js is also patched via
// scripts/patch-transformers.mjs (run in postinstall) to remove the
// companion throw when no image library is available.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _originalLoad = (Module as any)._load.bind(Module);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._load = function (request: string, ...args: unknown[]) {
  if (request === "sharp") return {};
  return _originalLoad(request, ...args);
};

async function run(): Promise<void> {
  try {
    const { pipeline, env } = await import("@xenova/transformers");

    env.localModelPath = workerData.modelPath;
    env.allowLocalModels = true;
    env.allowRemoteModels = false;

    const transcriber = await pipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-tiny",
    );

    const audioData = Float32Array.from(
      Object.values(workerData.audioBuffer as Record<string, number>),
    );
    const result = (await transcriber(audioData, {
      language: "english",
      task: "transcribe",
    })) as { text: string };

    parentPort?.postMessage({ type: "result", text: result.text.trim() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    parentPort?.postMessage({ type: "error", message });
  }
}

run();
