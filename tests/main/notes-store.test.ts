import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  loadNotes,
  saveNotes,
  DEFAULT_APP_DATA,
  DEFAULT_APPEARANCE,
} from "../../src/main/store/notes-store";
import type { AppData } from "../../src/renderer/notes/src/types";

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), "notes-test-"));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
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

describe("loadNotes settings migration", () => {
  it("fills in missing hotkeys with defaults for files with partial hotkeys", () => {
    const filePath = join(tempDir, "partial-hotkeys.json");
    const partial = {
      ...DEFAULT_APP_DATA,
      settings: {
        ...DEFAULT_APP_DATA.settings,
        hotkeys: { toggleVisibility: "Ctrl+H" },
      },
    };
    writeFileSync(filePath, JSON.stringify(partial), "utf-8");
    const result = loadNotes(filePath);
    expect(result.data.settings.hotkeys.toggleVisibility).toBe("Ctrl+H");
    expect(result.data.settings.hotkeys.toggleEditMode).toBe(
      DEFAULT_APP_DATA.settings.hotkeys.toggleEditMode,
    );
    expect(result.data.settings.hotkeys.startVoiceNote).toBe(
      DEFAULT_APP_DATA.settings.hotkeys.startVoiceNote,
    );
    expect(result.data.settings.hotkeys.toggleKeybinds).toBe(
      DEFAULT_APP_DATA.settings.hotkeys.toggleKeybinds,
    );
  });
});

describe("saveNotes and loadNotes round-trip", () => {
  it("round-trips collapsed field on notes", () => {
    const filePath = join(tempDir, "collapsed-test.json");
    const data: AppData = {
      settings: { hotkeys: { toggleVisibility: "Alt+H", toggleEditMode: "Alt+E", startVoiceNote: "Alt+V", toggleKeybinds: "Alt+K" } },
      appearance: {
        bgColor: "#0f172a", headerColor: "#1e293b", accentColor: "#6366f1",
        textColor: "#e2e8f0", noteColor: "#1e293b", fontSize: 13,
        viewOpacity: 0.85, editOpacity: 1,
      },
      sections: [{
        id: "s1",
        name: "Test",
        notes: [{
          id: "n1",
          type: "text",
          content: "hello",
          collapsed: false,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }],
      }],
    };
    saveNotes(filePath, data);
    const loaded = loadNotes(filePath);
    expect(loaded.data.sections[0].notes[0]).toMatchObject({ collapsed: false });
  });
});
