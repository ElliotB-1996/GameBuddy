import { describe, it, expect, beforeEach, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  loadNotes,
  saveNotes,
  DEFAULT_APP_DATA,
  DEFAULT_APPEARANCE,
} from "../../src/main/store/notes-store";
import type { AppData } from "../../src/renderer/src/types";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "notes-test-"));
});

describe("loadNotes", () => {
  it("returns default data when file does not exist", () => {
    const result = loadNotes(join(tempDir, "nonexistent.json"));
    expect(result.data).toEqual(DEFAULT_APP_DATA);
    expect(result.error).toBeNull();
  });

  it("returns parsed data when file exists and is valid", () => {
    const filePath = join(tempDir, "notes.json");
    const data: AppData = {
      ...DEFAULT_APP_DATA,
      sections: [{ id: "1", name: "TestGame", notes: [] }],
    };
    writeFileSync(filePath, JSON.stringify(data), "utf-8");
    const result = loadNotes(filePath);
    expect(result.data).toEqual(data);
    expect(result.error).toBeNull();
  });

  it("returns default data and error message when file is corrupted", () => {
    const filePath = join(tempDir, "notes.json");
    writeFileSync(filePath, "not-valid-json", "utf-8");
    const result = loadNotes(filePath);
    expect(result.data).toEqual(DEFAULT_APP_DATA);
    expect(result.error).toMatch(/corrupted/);
  });
});

describe("saveNotes", () => {
  it("writes JSON to the given path", () => {
    const filePath = join(tempDir, "notes.json");
    saveNotes(filePath, DEFAULT_APP_DATA);
    const result = loadNotes(filePath);
    expect(result.data).toEqual(DEFAULT_APP_DATA);
  });
});

describe("loadNotes appearance migration", () => {
  it("fills in missing appearance with defaults for files saved without appearance field", () => {
    const filePath = join(tempDir, "old-notes.json");
    const oldData = { settings: DEFAULT_APP_DATA.settings, sections: [] };
    writeFileSync(filePath, JSON.stringify(oldData), "utf-8");
    const result = loadNotes(filePath);
    expect(result.data.appearance).toEqual(DEFAULT_APPEARANCE);
    expect(result.error).toBeNull();
  });

  it("merges partial appearance, preserving overridden fields and filling missing ones", () => {
    const filePath = join(tempDir, "partial.json");
    const partial = {
      ...DEFAULT_APP_DATA,
      appearance: { ...DEFAULT_APPEARANCE, bgColor: "#ff0000" },
    };
    writeFileSync(filePath, JSON.stringify(partial), "utf-8");
    const result = loadNotes(filePath);
    expect(result.data.appearance.bgColor).toBe("#ff0000");
    expect(result.data.appearance.textColor).toBe(DEFAULT_APPEARANCE.textColor);
  });
});
