import { describe, it, expect } from "vitest";
import {
  validateAudioBuffer,
  MAX_AUDIO_SAMPLES,
} from "../../src/main/voice/voice-handler";

describe("validateAudioBuffer", () => {
  it("returns an error for an empty buffer", () => {
    expect(validateAudioBuffer([])).toMatch(/empty/i);
  });

  it("returns null for a buffer within the limit", () => {
    const buffer = new Array(1000).fill(0);
    expect(validateAudioBuffer(buffer)).toBeNull();
  });

  it("returns null for a buffer exactly at the limit", () => {
    const buffer = new Array(MAX_AUDIO_SAMPLES).fill(0);
    expect(validateAudioBuffer(buffer)).toBeNull();
  });

  it("returns an error for a buffer one sample over the limit", () => {
    const buffer = new Array(MAX_AUDIO_SAMPLES + 1).fill(0);
    expect(validateAudioBuffer(buffer)).toMatch(/60.second/i);
  });

  it("returns an error for a very large buffer", () => {
    const buffer = new Array(MAX_AUDIO_SAMPLES * 2).fill(0);
    expect(validateAudioBuffer(buffer)).not.toBeNull();
  });
});
