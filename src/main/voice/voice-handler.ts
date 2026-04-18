import { ipcMain, BrowserWindow } from "electron";
import { Worker } from "worker_threads";
import { join } from "path";

export const MAX_AUDIO_SAMPLES = 60 * 16_000; // 60 seconds at 16 kHz

export function validateAudioBuffer(buffer: number[]): string | null {
  if (buffer.length === 0) return "Audio buffer is empty.";
  if (buffer.length > MAX_AUDIO_SAMPLES)
    return "Recording exceeds the 60-second maximum.";
  return null;
}

export function registerVoiceHandlers(
  win: BrowserWindow,
  modelPath: string,
): void {
  if (process.env.E2E_MOCK_VOICE === "1") {
    ipcMain.handle("voice:transcribe", async (_event, audioBuffer: Float32Array) => {
      const bufferArray = Array.from(audioBuffer);
      const validationError = validateAudioBuffer(bufferArray);
      if (validationError) throw new Error(validationError);
      win.webContents.send("voice:result", "E2E mock transcription");
    });
    return;
  }

  ipcMain.handle(
    "voice:transcribe",
    async (_event, audioBuffer: Float32Array) => {
      const bufferArray = Array.from(audioBuffer);
      const validationError = validateAudioBuffer(bufferArray);
      if (validationError) {
        throw new Error(validationError);
      }

      const workerPath = join(__dirname, "whisper-worker.js");

      return new Promise<void>((resolve) => {
        const worker = new Worker(workerPath, {
          workerData: { audioBuffer: bufferArray, modelPath },
        });
        worker.on(
          "message",
          (msg: { type: string; text?: string; message?: string }) => {
            if (msg.type === "result") {
              win.webContents.send("voice:result", msg.text);
              resolve();
            } else if (msg.type === "error") {
              console.error("[voice] worker error:", msg.message);
              win.webContents.send("voice:result", null, msg.message);
              resolve();
            }
          },
        );

        worker.on("error", (err) => {
          console.error("[voice] worker threw:", err);
          win.webContents.send("voice:result", null, err.message);
          resolve();
        });
      });
    },
  );
}
