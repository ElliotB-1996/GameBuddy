import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { AppData, Appearance } from "../../renderer/src/types";

export const DEFAULT_APPEARANCE: Appearance = {
  bgColor: "#0a0c10",
  headerColor: "#0a0c10",
  accentColor: "#4ade80",
  textColor: "#e2e8f0",
  noteColor: "#181c24",
  fontSize: 13,
  viewOpacity: 0.82,
  editOpacity: 1.0,
};

export const DEFAULT_APP_DATA: AppData = {
  settings: {
    hotkeys: {
      toggleVisibility: "Alt+Shift+N",
      toggleEditMode: "Alt+Shift+E",
      startVoiceNote: "Alt+Shift+V",
    },
    audioDeviceId: "",
  },
  appearance: DEFAULT_APPEARANCE,
  sections: [],
};

export function loadNotes(filePath: string): {
  data: AppData;
  error: string | null;
} {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const data: AppData = {
      ...DEFAULT_APP_DATA,
      ...parsed,
      settings: {
        ...DEFAULT_APP_DATA.settings,
        ...parsed.settings,
        hotkeys: {
          ...DEFAULT_APP_DATA.settings.hotkeys,
          ...(parsed.settings?.hotkeys ?? {}),
        },
      },
      appearance: { ...DEFAULT_APPEARANCE, ...(parsed.appearance ?? {}) },
    };
    return { data, error: null };
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return { data: structuredClone(DEFAULT_APP_DATA), error: null };
    }
    return {
      data: structuredClone(DEFAULT_APP_DATA),
      error: "Notes file is corrupted. Starting with empty state.",
    };
  }
}

export function saveNotes(filePath: string, data: AppData): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
