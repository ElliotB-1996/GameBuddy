import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadProfiles, saveProfiles } from "../../src/main/store/profiles-store";
import type { Profile } from "../../src/renderer/keybinds/src/data/types";

let tempDir: string;

const PROFILE: Profile = {
  id: "test-1",
  label: "World of Warcraft",
  platform: "windows",
  type: "rewasd",
  device: "cyborg",
  pairId: "pair-1",
  layers: { default: {} },
  imported: true,
};

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "profiles-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

describe("loadProfiles", () => {
  it("returns empty array when file does not exist", () => {
    const result = loadProfiles(join(tempDir, "nonexistent.json"));
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it("returns parsed profiles when file exists and is valid", () => {
    const filePath = join(tempDir, "profiles.json");
    writeFileSync(filePath, JSON.stringify([PROFILE]), "utf-8");
    const result = loadProfiles(filePath);
    expect(result.data).toEqual([PROFILE]);
    expect(result.error).toBeNull();
  });

  it("returns empty array and error when file is corrupted", () => {
    const filePath = join(tempDir, "profiles.json");
    writeFileSync(filePath, "not-valid-json", "utf-8");
    const result = loadProfiles(filePath);
    expect(result.data).toEqual([]);
    expect(result.error).toMatch(/corrupted/);
  });
});

describe("saveProfiles", () => {
  it("writes profiles to file and round-trips correctly", () => {
    const filePath = join(tempDir, "profiles.json");
    saveProfiles(filePath, [PROFILE]);
    const result = loadProfiles(filePath);
    expect(result.data).toEqual([PROFILE]);
  });

  it("creates parent directories if they do not exist", () => {
    const filePath = join(tempDir, "nested", "dir", "profiles.json");
    expect(() => saveProfiles(filePath, [])).not.toThrow();
  });
});
