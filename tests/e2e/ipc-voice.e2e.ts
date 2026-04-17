import { test, expect } from "@playwright/test";
import { launchApp, teardown } from "./helpers/launch";

test.describe("voice IPC (mocked worker)", () => {
  test("voice:transcribe triggers voice:result with mock text", async () => {
    const handle = await launchApp();

    const resultText = await handle.page.evaluate(async () => {
      return new Promise<string>((resolve) => {
        window.api.onVoiceResult((text) => {
          resolve(text ?? "null");
        });
        const buf = new Float32Array(1000).fill(0.1);
        window.api.transcribeAudio(buf);
      });
    });

    expect(resultText).toBe("E2E mock transcription");
    await teardown(handle);
  });

  test("voice:transcribe rejects with error for empty buffer", async () => {
    const handle = await launchApp();

    const errorMsg = await handle.page.evaluate(async () => {
      try {
        await window.api.transcribeAudio(new Float32Array(0));
        return "no-error";
      } catch (e: unknown) {
        return (e as Error).message;
      }
    });

    expect(errorMsg).toMatch(/empty/i);
    await teardown(handle);
  });
});
