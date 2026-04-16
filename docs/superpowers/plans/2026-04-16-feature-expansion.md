# Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add appearance settings (tabbed SettingsPanel with CSS custom properties and window opacity), a recording indicator in view mode, and a system tray icon with show/hide, mode toggle, and quit.

**Architecture:** Appearance is driven by CSS custom properties written to `:root` by a `applyTheme()` utility; values are stored as a new `Appearance` field in `AppData` and persisted with the existing debounced-save pattern. Window opacity is set via `win.setOpacity()` through a new IPC channel. The tray icon uses a pure `buildTrayMenuItems()` function (testable without Electron imports) wired into the main process after the window is ready.

**Tech Stack:** Electron 39, React 19, TypeScript 5, electron-vite, Vitest + @testing-library/react

---

## File Map

### New files
- `src/renderer/src/utils/theme.ts` — `applyTheme(appearance)` writes CSS variables to `:root`
- `src/renderer/src/components/RecordingDot.tsx` — pulsing red dot shown while recording
- `src/main/tray-menu.ts` — pure `buildTrayMenuItems()` (no Electron imports, fully testable)
- `resources/tray-icon.png` — 16×16 placeholder icon (generated via sharp)
- `tests/renderer/theme.test.ts`
- `tests/renderer/RecordingDot.test.tsx`
- `tests/main/tray-menu.test.ts`

### Modified files
- `src/renderer/src/types.ts` — add `Appearance` interface; add to `AppData`
- `src/main/store/notes-store.ts` — add `DEFAULT_APPEARANCE`, update `DEFAULT_APP_DATA`, merge appearance on load
- `src/renderer/src/hooks/useNotes.ts` — add `appearance` state, `updateAppearance`, include in `getAppData()`
- `src/renderer/src/styles/overlay.css` — add `:root` CSS variable defaults; apply to `.overlay-root` and `.overlay-header`; add `@keyframes recording-pulse`
- `src/renderer/src/components/NoteCard.tsx` — use `var(--overlay-note)` for card background
- `src/renderer/src/components/SettingsPanel.tsx` — tabbed (Hotkeys / Audio / Appearance) with live appearance controls
- `src/renderer/src/App.tsx` — render RecordingDot in header; call `applyTheme`; send `setOpacity` + `notifyModeChanged` on mode change; pass appearance props to SettingsPanel; add `notes.appearance` to save effect deps
- `src/preload/index.ts` — add `setOpacity` (invoke) and `notifyModeChanged` (send)
- `src/main/ipc/window-handler.ts` — handle `window:setOpacity`
- `src/main/index.ts` — create Tray, handle `window:notifyModeChanged`, set `skipTaskbar: true`
- `package.json` — add tray-icon to `extraResources`
- `tests/renderer/useNotes.test.ts` — add `appearance` to `baseData`; add appearance tests
- `tests/renderer/SettingsPanel.test.tsx` — add `appearance` and `onAppearanceChange` props; add tab tests
- `tests/main/notes-store.test.ts` — add appearance migration tests

---

## Task 1: Appearance types, defaults, and useNotes extension

**Files:**
- Modify: `src/renderer/src/types.ts`
- Modify: `src/main/store/notes-store.ts`
- Modify: `src/renderer/src/hooks/useNotes.ts`
- Modify: `tests/renderer/useNotes.test.ts`
- Modify: `tests/main/notes-store.test.ts`

- [ ] **Step 1: Add `Appearance` interface and update `AppData` in types.ts**

In `src/renderer/src/types.ts`, add after the `Settings` interface:

```ts
export interface Appearance {
  bgColor: string;
  headerColor: string;
  accentColor: string;
  textColor: string;
  noteColor: string;
  fontSize: number;
  viewOpacity: number;
  editOpacity: number;
}
```

Replace the `AppData` interface:

```ts
export interface AppData {
  settings: Settings;
  appearance: Appearance;
  sections: Section[];
}
```

- [ ] **Step 2: Add `DEFAULT_APPEARANCE` and update `DEFAULT_APP_DATA` in notes-store.ts**

In `src/main/store/notes-store.ts`, replace the import and add the new constant. Full new file content:

```ts
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
      settings: { ...DEFAULT_APP_DATA.settings, ...parsed.settings },
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
```

- [ ] **Step 3: Write failing tests for appearance migration**

Add to the imports and add a new describe block in `tests/main/notes-store.test.ts`:

```ts
import {
  loadNotes,
  saveNotes,
  DEFAULT_APP_DATA,
  DEFAULT_APPEARANCE,
} from "../../src/main/store/notes-store";
```

Add these tests at the end of the file:

```ts
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
```

- [ ] **Step 4: Run notes-store tests to verify migration tests pass**

```
npm test -- tests/main/notes-store.test.ts
```

Expected: all PASS (including the two new migration tests)

- [ ] **Step 5: Update `useNotes` to add appearance state**

Replace `src/renderer/src/hooks/useNotes.ts` in full:

```ts
import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  AppData,
  Section,
  Note,
  Settings,
  ChecklistItem,
  Appearance,
} from "../types";

export interface UseNotesReturn {
  sections: Section[];
  settings: Settings;
  appearance: Appearance;
  addSection: (name: string) => void;
  renameSection: (sectionId: string, name: string) => void;
  deleteSection: (sectionId: string) => void;
  addTextNote: (sectionId: string, content: string) => void;
  addChecklistNote: (sectionId: string) => void;
  updateNote: (
    sectionId: string,
    noteId: string,
    content: Note["content"],
  ) => void;
  deleteNote: (sectionId: string, noteId: string) => void;
  updateSettings: (settings: Settings) => void;
  updateAppearance: (appearance: Appearance) => void;
  getAppData: () => AppData;
}

export function useNotes(initialData: AppData): UseNotesReturn {
  const [sections, setSections] = useState<Section[]>(initialData.sections);
  const [settings, setSettings] = useState<Settings>(initialData.settings);
  const [appearance, setAppearance] = useState<Appearance>(
    initialData.appearance,
  );

  const now = (): string => new Date().toISOString();

  const addSection = useCallback((name: string) => {
    setSections((prev) => [...prev, { id: uuidv4(), name, notes: [] }]);
  }, []);

  const renameSection = useCallback((sectionId: string, name: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, name } : s)),
    );
  }, []);

  const deleteSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }, []);

  const addTextNote = useCallback((sectionId: string, content: string) => {
    const note: Note = {
      id: uuidv4(),
      type: "text",
      content,
      createdAt: now(),
      updatedAt: now(),
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, notes: [note, ...s.notes] } : s,
      ),
    );
  }, []);

  const addChecklistNote = useCallback((sectionId: string) => {
    const item: ChecklistItem = { id: uuidv4(), text: "", checked: false };
    const note: Note = {
      id: uuidv4(),
      type: "checklist",
      content: [item],
      createdAt: now(),
      updatedAt: now(),
    };
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, notes: [note, ...s.notes] } : s,
      ),
    );
  }, []);

  const updateNote = useCallback(
    (sectionId: string, noteId: string, content: Note["content"]) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            notes: s.notes.map((n) =>
              n.id === noteId
                ? ({ ...n, content, updatedAt: now() } as Note)
                : n,
            ),
          };
        }),
      );
    },
    [],
  );

  const deleteNote = useCallback((sectionId: string, noteId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, notes: s.notes.filter((n) => n.id !== noteId) };
      }),
    );
  }, []);

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
  }, []);

  const updateAppearance = useCallback((newAppearance: Appearance) => {
    setAppearance(newAppearance);
  }, []);

  const getAppData = useCallback(
    (): AppData => ({ settings, appearance, sections }),
    [settings, appearance, sections],
  );

  return {
    sections,
    settings,
    appearance,
    addSection,
    renameSection,
    deleteSection,
    addTextNote,
    addChecklistNote,
    updateNote,
    deleteNote,
    updateSettings,
    updateAppearance,
    getAppData,
  };
}
```

- [ ] **Step 6: Update useNotes tests — add appearance to baseData and new tests**

In `tests/renderer/useNotes.test.ts`, replace `baseData` and add tests:

```ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNotes } from "@renderer/hooks/useNotes";
import type { AppData } from "@renderer/types";

const baseData: AppData = {
  settings: {
    hotkeys: {
      toggleVisibility: "Alt+Shift+N",
      toggleEditMode: "Alt+Shift+E",
      startVoiceNote: "Alt+Shift+V",
    },
  },
  appearance: {
    bgColor: "#0a0c10",
    headerColor: "#0a0c10",
    accentColor: "#4ade80",
    textColor: "#e2e8f0",
    noteColor: "#181c24",
    fontSize: 13,
    viewOpacity: 0.82,
    editOpacity: 1.0,
  },
  sections: [{ id: "s1", name: "Game A", notes: [] }],
};

describe("useNotes", () => {
  it("initializes with provided AppData", () => {
    const { result } = renderHook(() => useNotes(baseData));
    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].name).toBe("Game A");
  });

  it("addSection adds a new section", () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() => result.current.addSection("Game B"));
    expect(result.current.sections).toHaveLength(2);
    expect(result.current.sections[1].name).toBe("Game B");
  });

  it("renameSection updates the section name", () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() => result.current.renameSection("s1", "Renamed"));
    expect(result.current.sections[0].name).toBe("Renamed");
  });

  it("addTextNote adds a note to the correct section", () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() => result.current.addTextNote("s1", "hello world"));
    expect(result.current.sections[0].notes).toHaveLength(1);
    expect((result.current.sections[0].notes[0] as any).content).toBe(
      "hello world",
    );
  });

  it("updateNote updates note content and bumps updatedAt", async () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() => result.current.addTextNote("s1", "original"));
    const noteId = result.current.sections[0].notes[0].id;
    const originalUpdatedAt = result.current.sections[0].notes[0].updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    act(() => result.current.updateNote("s1", noteId, "updated"));
    const updated = result.current.sections[0].notes[0];
    expect((updated as any).content).toBe("updated");
    expect(updated.updatedAt).not.toBe(originalUpdatedAt);
  });

  it("deleteNote removes the note", () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() => result.current.addTextNote("s1", "to delete"));
    const noteId = result.current.sections[0].notes[0].id;
    act(() => result.current.deleteNote("s1", noteId));
    expect(result.current.sections[0].notes).toHaveLength(0);
  });

  it("initializes with provided appearance", () => {
    const { result } = renderHook(() => useNotes(baseData));
    expect(result.current.appearance.bgColor).toBe("#0a0c10");
  });

  it("updateAppearance updates the appearance state", () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() =>
      result.current.updateAppearance({
        ...baseData.appearance,
        bgColor: "#ff0000",
      }),
    );
    expect(result.current.appearance.bgColor).toBe("#ff0000");
  });

  it("getAppData includes current appearance", () => {
    const { result } = renderHook(() => useNotes(baseData));
    act(() =>
      result.current.updateAppearance({
        ...baseData.appearance,
        fontSize: 16,
      }),
    );
    expect(result.current.getAppData().appearance.fontSize).toBe(16);
  });
});
```

- [ ] **Step 7: Run useNotes tests**

```
npm test -- tests/renderer/useNotes.test.ts
```

Expected: all 9 PASS

- [ ] **Step 8: Run all tests to check for regressions**

```
npm test
```

Expected: all PASS

- [ ] **Step 9: Commit**

```
git add src/renderer/src/types.ts src/main/store/notes-store.ts src/renderer/src/hooks/useNotes.ts tests/renderer/useNotes.test.ts tests/main/notes-store.test.ts
git commit -m "feat: add Appearance type, defaults, migration, and useNotes extension"
```

---

## Task 2: applyTheme utility

**Files:**
- Create: `src/renderer/src/utils/theme.ts`
- Create: `tests/renderer/theme.test.ts`

- [ ] **Step 1: Write failing tests for applyTheme**

Create `tests/renderer/theme.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme } from "@renderer/utils/theme";
import type { Appearance } from "@renderer/types";

const appearance: Appearance = {
  bgColor: "#ff0000",
  headerColor: "#00ff00",
  accentColor: "#0000ff",
  textColor: "#ffffff",
  noteColor: "#123456",
  fontSize: 15,
  viewOpacity: 0.7,
  editOpacity: 0.9,
};

beforeEach(() => {
  document.documentElement.style.cssText = "";
});

describe("applyTheme", () => {
  it("sets --overlay-bg to bgColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-bg"),
    ).toBe("#ff0000");
  });

  it("sets --overlay-header to headerColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-header"),
    ).toBe("#00ff00");
  });

  it("sets --overlay-accent to accentColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-accent"),
    ).toBe("#0000ff");
  });

  it("sets --overlay-text to textColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-text"),
    ).toBe("#ffffff");
  });

  it("sets --overlay-note to noteColor", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-note"),
    ).toBe("#123456");
  });

  it("sets --overlay-font-size with px suffix", () => {
    applyTheme(appearance);
    expect(
      document.documentElement.style.getPropertyValue("--overlay-font-size"),
    ).toBe("15px");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- tests/renderer/theme.test.ts
```

Expected: FAIL — `applyTheme` not found

- [ ] **Step 3: Create src/renderer/src/utils/theme.ts**

```ts
import type { Appearance } from "../types";

export function applyTheme(appearance: Appearance): void {
  const root = document.documentElement;
  root.style.setProperty("--overlay-bg", appearance.bgColor);
  root.style.setProperty("--overlay-header", appearance.headerColor);
  root.style.setProperty("--overlay-accent", appearance.accentColor);
  root.style.setProperty("--overlay-text", appearance.textColor);
  root.style.setProperty("--overlay-note", appearance.noteColor);
  root.style.setProperty("--overlay-font-size", `${appearance.fontSize}px`);
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npm test -- tests/renderer/theme.test.ts
```

Expected: all 6 PASS

- [ ] **Step 5: Commit**

```
git add src/renderer/src/utils/theme.ts tests/renderer/theme.test.ts
git commit -m "feat: add applyTheme CSS custom properties utility"
```

---

## Task 3: CSS variable defaults and NoteCard migration

**Files:**
- Modify: `src/renderer/src/styles/overlay.css`
- Modify: `src/renderer/src/components/NoteCard.tsx`

- [ ] **Step 1: Update overlay.css**

Replace the full content of `src/renderer/src/styles/overlay.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

:root {
  --overlay-bg: #0a0c10;
  --overlay-header: #0a0c10;
  --overlay-accent: #4ade80;
  --overlay-text: #e2e8f0;
  --overlay-note: #181c24;
  --overlay-font-size: 13px;
}

@keyframes recording-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

body {
  background: transparent;
  margin: 0;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
}

.overlay-root {
  background: var(--overlay-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: var(--overlay-text);
  display: flex;
  flex-direction: column;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-size: var(--overlay-font-size);
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.overlay-header {
  align-items: center;
  background: var(--overlay-header);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  min-height: 36px;
  -webkit-app-region: drag;
}

.overlay-header button,
.overlay-header input {
  -webkit-app-region: no-drag;
}

.overlay-actions {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
}

.overlay-notes {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
  scrollbar-width: thin;
}

.overlay-notes textarea,
.overlay-notes input[type="text"] {
  -webkit-user-select: text;
  user-select: text;
}
```

- [ ] **Step 2: Update NoteCard.tsx to use --overlay-note**

In `src/renderer/src/components/NoteCard.tsx`, change the container `background`:

```tsx
<div
  style={{
    background: "var(--overlay-note)",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "8px 10px",
    position: "relative",
  }}
>
```

- [ ] **Step 3: Run all tests to check for regressions**

```
npm test
```

Expected: all PASS

- [ ] **Step 4: Commit**

```
git add src/renderer/src/styles/overlay.css src/renderer/src/components/NoteCard.tsx
git commit -m "feat: add CSS variable defaults and migrate key colours"
```

---

## Task 4: RecordingDot component

**Files:**
- Create: `src/renderer/src/components/RecordingDot.tsx`
- Create: `tests/renderer/RecordingDot.test.tsx`
- Modify: `src/renderer/src/App.tsx` (header only)

- [ ] **Step 1: Write failing tests for RecordingDot**

Create `tests/renderer/RecordingDot.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecordingDot } from "@renderer/components/RecordingDot";

describe("RecordingDot", () => {
  it("renders a span with title 'Recording…'", () => {
    render(<RecordingDot />);
    expect(screen.getByTitle("Recording…")).toBeInTheDocument();
  });

  it("applies recording-pulse animation", () => {
    render(<RecordingDot />);
    const el = screen.getByTitle("Recording…");
    expect(el.style.animation).toContain("recording-pulse");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```
npm test -- tests/renderer/RecordingDot.test.tsx
```

Expected: FAIL — `RecordingDot` not found

- [ ] **Step 3: Create RecordingDot.tsx**

Create `src/renderer/src/components/RecordingDot.tsx`:

```tsx
import { JSX } from "react";

export function RecordingDot(): JSX.Element {
  return (
    <span
      title="Recording…"
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#ef4444",
        display: "inline-block",
        flexShrink: 0,
        animation: "recording-pulse 1s ease-in-out infinite",
      }}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npm test -- tests/renderer/RecordingDot.test.tsx
```

Expected: 2 PASS

- [ ] **Step 5: Add RecordingDot to App.tsx header**

In `src/renderer/src/App.tsx`, add the import alongside the other component imports:

```ts
import { RecordingDot } from "./components/RecordingDot";
```

In the header's right-side `<div>` (the one with `display: "flex", alignItems: "center", gap: 6, paddingRight: 8`), add `RecordingDot` before the settings gear button:

```tsx
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  }}
>
  {audioState === "recording" && <RecordingDot />}
  <button
    onClick={() => setShowSettings((s) => !s)}
    title="Settings"
    style={{ ... }}
  >
    ⚙
  </button>
  <ModeIndicator mode={mode} onToggle={handleToggleMode} />
</div>
```

- [ ] **Step 6: Run all tests**

```
npm test
```

Expected: all PASS

- [ ] **Step 7: Commit**

```
git add src/renderer/src/components/RecordingDot.tsx tests/renderer/RecordingDot.test.tsx src/renderer/src/App.tsx
git commit -m "feat: add RecordingDot pulsing indicator for voice recording"
```

---

## Task 5: IPC channels for opacity and mode notification

**Files:**
- Modify: `src/preload/index.ts`
- Modify: `src/main/ipc/window-handler.ts`

- [ ] **Step 1: Add setOpacity and notifyModeChanged to preload**

In `src/preload/index.ts`, add to the `api` object after `updateHotkeys`:

```ts
setOpacity: (opacity: number): Promise<void> =>
  ipcRenderer.invoke("window:setOpacity", opacity),
notifyModeChanged: (mode: WindowMode): void => {
  ipcRenderer.send("window:notifyModeChanged", mode);
},
```

- [ ] **Step 2: Add window:setOpacity handler to window-handler.ts**

In `src/main/ipc/window-handler.ts`, add after the existing `window:setMode` handler:

```ts
ipcMain.handle("window:setOpacity", (_event, opacity: number) => {
  win.setOpacity(Math.max(0, Math.min(1, opacity)));
});
```

- [ ] **Step 3: Run typecheck**

```
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Run all tests**

```
npm test
```

Expected: all PASS

- [ ] **Step 5: Commit**

```
git add src/preload/index.ts src/main/ipc/window-handler.ts
git commit -m "feat: add set-opacity and mode-notification IPC channels"
```

---

## Task 6: SettingsPanel tabs and Appearance tab

**Files:**
- Modify: `src/renderer/src/components/SettingsPanel.tsx`
- Modify: `tests/renderer/SettingsPanel.test.tsx`

- [ ] **Step 1: Update SettingsPanel tests**

Replace the full content of `tests/renderer/SettingsPanel.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPanel } from "@renderer/components/SettingsPanel";
import type { Hotkeys, Appearance } from "@renderer/types";

const hotkeys: Hotkeys = {
  toggleVisibility: "Alt+Shift+N",
  toggleEditMode: "Alt+Shift+E",
  startVoiceNote: "Alt+Shift+V",
};

const appearance: Appearance = {
  bgColor: "#0a0c10",
  headerColor: "#0a0c10",
  accentColor: "#4ade80",
  textColor: "#e2e8f0",
  noteColor: "#181c24",
  fontSize: 13,
  viewOpacity: 0.82,
  editOpacity: 1.0,
};

beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    writable: true,
    value: {
      enumerateDevices: vi.fn().mockResolvedValue([
        {
          kind: "audioinput",
          deviceId: "device-1",
          label: "Built-in Microphone",
        },
        { kind: "audioinput", deviceId: "device-2", label: "USB Headset" },
        { kind: "videoinput", deviceId: "cam-1", label: "Camera" },
      ]),
    },
  });
});

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof SettingsPanel>> = {},
) {
  return render(
    <SettingsPanel
      hotkeys={hotkeys}
      audioDeviceId=""
      appearance={appearance}
      onSave={vi.fn()}
      onAppearanceChange={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />,
  );
}

describe("SettingsPanel — Hotkeys tab (default)", () => {
  it("renders all three hotkey fields", () => {
    renderPanel();
    expect(screen.getByText("Show / Hide Overlay")).toBeInTheDocument();
    expect(screen.getByText("Toggle Edit Mode")).toBeInTheDocument();
    expect(screen.getByText("Start Voice Note")).toBeInTheDocument();
  });

  it("calls onSave with current hotkeys and audioDeviceId when Save clicked", async () => {
    const onSave = vi.fn();
    renderPanel({ onSave });
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(hotkeys, "");
  });

  it("calls onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    renderPanel({ onClose });
    await userEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("SettingsPanel — Audio tab", () => {
  it("renders microphone dropdown when Audio tab is active", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    expect(screen.getByText("Microphone")).toBeInTheDocument();
  });

  it("populates dropdown with enumerated audioinput devices only", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await waitFor(() => {
      expect(screen.getByText("Built-in Microphone")).toBeInTheDocument();
      expect(screen.getByText("USB Headset")).toBeInTheDocument();
    });
    expect(screen.queryByText("Camera")).not.toBeInTheDocument();
  });

  it("includes System Default as the first option", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await waitFor(() => {
      expect(screen.getByText("System Default")).toBeInTheDocument();
    });
  });

  it("calls onSave with selected audioDeviceId", async () => {
    const onSave = vi.fn();
    renderPanel({ onSave });
    await userEvent.click(screen.getByRole("button", { name: "Audio" }));
    await waitFor(() => screen.getByText("Built-in Microphone"));
    await userEvent.selectOptions(screen.getByRole("combobox"), "device-1");
    await userEvent.click(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith(hotkeys, "device-1");
  });
});

describe("SettingsPanel — Appearance tab", () => {
  it("renders colour controls when Appearance tab is active", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Appearance" }));
    expect(screen.getByText("Background")).toBeInTheDocument();
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Note Card")).toBeInTheDocument();
    expect(screen.getByText("Font size")).toBeInTheDocument();
    expect(screen.getByText(/Opacity \(view mode\)/)).toBeInTheDocument();
    expect(screen.getByText(/Opacity \(edit mode\)/)).toBeInTheDocument();
  });

  it("calls onAppearanceChange when a colour input changes", async () => {
    const onAppearanceChange = vi.fn();
    renderPanel({ onAppearanceChange });
    await userEvent.click(screen.getByRole("button", { name: "Appearance" }));
    const bgInput = screen.getByTitle("Background") as HTMLInputElement;
    // Simulate a change event directly since color inputs don't accept typed values
    bgInput.value = "#ff0000";
    bgInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onAppearanceChange).toHaveBeenCalled();
  });

  it("does not render Save/Cancel on the Appearance tab", async () => {
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Appearance" }));
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/renderer/SettingsPanel.test.tsx
```

Expected: FAIL (missing props, no tabs)

- [ ] **Step 3: Replace SettingsPanel.tsx**

Replace the full content of `src/renderer/src/components/SettingsPanel.tsx`:

```tsx
import { useState, useEffect, useCallback, JSX } from "react";
import type { Hotkeys, Appearance } from "../types";

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface Props {
  hotkeys: Hotkeys;
  audioDeviceId: string;
  appearance: Appearance;
  onSave: (hotkeys: Hotkeys, audioDeviceId: string) => void;
  onAppearanceChange: (appearance: Appearance) => void;
  onClose: () => void;
}

type HotkeyKey = keyof Hotkeys;
type Tab = "hotkeys" | "audio" | "appearance";

const LABELS: Record<HotkeyKey, string> = {
  toggleVisibility: "Show / Hide Overlay",
  toggleEditMode: "Toggle Edit Mode",
  startVoiceNote: "Start Voice Note",
};

const TAB_LABELS: Record<Tab, string> = {
  hotkeys: "Hotkeys",
  audio: "Audio",
  appearance: "Appearance",
};

const COLOR_FIELDS: [keyof Appearance, string][] = [
  ["bgColor", "Background"],
  ["headerColor", "Header"],
  ["accentColor", "Accent"],
  ["textColor", "Text"],
  ["noteColor", "Note Card"],
];

export function SettingsPanel({
  hotkeys,
  audioDeviceId,
  appearance,
  onSave,
  onAppearanceChange,
  onClose,
}: Props): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>("hotkeys");
  const [draft, setDraft] = useState<Hotkeys>({ ...hotkeys });
  const [draftDeviceId, setDraftDeviceId] = useState(audioDeviceId);
  const [capturing, setCapturing] = useState<HotkeyKey | null>(null);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const inputs = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${i + 1}`,
          }));
        setAudioDevices(inputs);
      })
      .catch(() => {});
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, key: HotkeyKey) => {
      e.preventDefault();
      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");
      if (e.metaKey) parts.push("Meta");
      const main = e.key;
      if (!["Control", "Alt", "Shift", "Meta"].includes(main)) {
        parts.push(main.length === 1 ? main.toUpperCase() : main);
        setDraft((prev) => ({ ...prev, [key]: parts.join("+") }));
        setCapturing(null);
      }
    },
    [],
  );

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "rgba(255,255,255,0.1)" : "none",
    border: "none",
    borderRadius: 4,
    color: active ? "#e2e8f0" : "#94a3b8",
    cursor: "pointer",
    flex: 1,
    fontSize: 11,
    padding: "4px 0",
  });

  return (
    <div
      style={{
        background: "rgba(15,15,15,0.95)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: 8,
        color: "#e2e8f0",
        padding: 16,
        position: "absolute",
        right: 8,
        top: 40,
        width: 280,
        zIndex: 100,
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
        Settings
      </h3>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 12,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 4,
          padding: 2,
        }}
      >
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={tabBtnStyle(activeTab === tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Hotkeys tab */}
      {activeTab === "hotkeys" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(Object.keys(LABELS) as HotkeyKey[]).map((key) => (
            <div key={key}>
              <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
                {LABELS[key]}
              </div>
              <div
                onKeyDown={
                  capturing === key ? (e) => handleKeyDown(e, key) : undefined
                }
                onClick={() => setCapturing(key)}
                tabIndex={0}
                style={{
                  background:
                    capturing === key
                      ? "rgba(74,222,128,0.1)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${capturing === key ? "#4ade80" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 4,
                  color: "#e2e8f0",
                  cursor: "pointer",
                  fontSize: 12,
                  padding: "4px 8px",
                }}
              >
                {capturing === key ? "Press keys…" : draft[key]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio tab */}
      {activeTab === "audio" && (
        <div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
            Microphone
          </div>
          <select
            value={draftDeviceId}
            onChange={(e) => setDraftDeviceId(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 4,
              color: "#e2e8f0",
              fontSize: 12,
              padding: "4px 8px",
              width: "100%",
            }}
          >
            <option value="">System Default</option>
            {audioDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Appearance tab */}
      {activeTab === "appearance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COLOR_FIELDS.map(([key, label]) => (
            <div
              key={key}
              style={{
                alignItems: "center",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{label}</span>
              <input
                title={label}
                type="color"
                value={appearance[key] as string}
                onChange={(e) =>
                  onAppearanceChange({ ...appearance, [key]: e.target.value })
                }
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 3,
                  cursor: "pointer",
                  height: 24,
                  padding: 1,
                  width: 36,
                }}
              />
            </div>
          ))}

          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: 11 }}>Font size</span>
            <input
              type="number"
              min={10}
              max={20}
              value={appearance.fontSize}
              onChange={(e) =>
                onAppearanceChange({
                  ...appearance,
                  fontSize: Math.max(10, Math.min(20, Number(e.target.value))),
                })
              }
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#e2e8f0",
                fontSize: 12,
                padding: "3px 6px",
                width: 52,
              }}
            />
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
              Opacity (view mode) — {appearance.viewOpacity.toFixed(2)}
            </div>
            <input
              type="range"
              min={0.2}
              max={1.0}
              step={0.01}
              value={appearance.viewOpacity}
              onChange={(e) =>
                onAppearanceChange({
                  ...appearance,
                  viewOpacity: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 3 }}>
              Opacity (edit mode) — {appearance.editOpacity.toFixed(2)}
            </div>
            <input
              type="range"
              min={0.5}
              max={1.0}
              step={0.01}
              value={appearance.editOpacity}
              onChange={(e) =>
                onAppearanceChange({
                  ...appearance,
                  editOpacity: Number(e.target.value),
                })
              }
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}

      {/* Save/Cancel — hidden on Appearance tab (changes are live) */}
      {activeTab !== "appearance" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 14,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 12px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft, draftDeviceId);
              onClose();
            }}
            style={{
              background: "rgba(74,222,128,0.15)",
              border: "1px solid #4ade80",
              borderRadius: 4,
              color: "#4ade80",
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 12px",
            }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run SettingsPanel tests to verify they pass**

```
npm test -- tests/renderer/SettingsPanel.test.tsx
```

Expected: all PASS

- [ ] **Step 5: Run all tests**

```
npm test
```

Expected: all PASS

- [ ] **Step 6: Commit**

```
git add src/renderer/src/components/SettingsPanel.tsx tests/renderer/SettingsPanel.test.tsx
git commit -m "feat: add tabbed SettingsPanel with Appearance tab"
```

---

## Task 7: Wire App.tsx

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Add applyTheme import to App.tsx**

Add this import to `src/renderer/src/App.tsx` alongside the other imports:

```ts
import { applyTheme } from "./utils/theme";
```

- [ ] **Step 2: Add applyTheme effect in NotesApp**

In `NotesApp`, after the `notes` and audio state declarations, add:

```ts
useEffect(() => {
  applyTheme(notes.appearance);
}, [notes.appearance]);
```

- [ ] **Step 3: Add opacity + mode notification effect in NotesApp**

Add after the applyTheme effect:

```ts
useEffect(() => {
  const opacity =
    mode === "edit"
      ? notes.appearance.editOpacity
      : notes.appearance.viewOpacity;
  window.api.setOpacity(opacity);
  window.api.notifyModeChanged(mode);
}, [mode, notes.appearance.editOpacity, notes.appearance.viewOpacity]);
```

- [ ] **Step 4: Update SettingsPanel render to pass new props**

Replace the existing `{showSettings && <SettingsPanel ... />}` block:

```tsx
{showSettings && (
  <SettingsPanel
    hotkeys={notes.settings.hotkeys}
    audioDeviceId={notes.settings.audioDeviceId ?? ""}
    appearance={notes.appearance}
    onSave={handleSaveSettings}
    onAppearanceChange={notes.updateAppearance}
    onClose={() => setShowSettings(false)}
  />
)}
```

- [ ] **Step 5: Add notes.appearance to the save effect dependency array**

Update the save effect's dependency array comment:

```ts
}, [notes.sections, notes.settings, notes.appearance]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 6: Run typecheck**

```
npm run typecheck
```

Expected: no errors

- [ ] **Step 7: Run all tests**

```
npm test
```

Expected: all PASS

- [ ] **Step 8: Commit**

```
git add src/renderer/src/App.tsx
git commit -m "feat: wire applyTheme, opacity IPC, and appearance props in App"
```

---

## Task 8: Tray icon

**Files:**
- Create: `resources/tray-icon.png`
- Create: `src/main/tray-menu.ts`
- Create: `tests/main/tray-menu.test.ts`
- Modify: `src/main/index.ts`
- Modify: `package.json`

- [ ] **Step 1: Generate a placeholder tray icon using sharp (already installed)**

```
node -e "require('sharp')({ create: { width: 16, height: 16, channels: 4, background: { r: 74, g: 222, b: 128, alpha: 1 } } }).png().toFile('resources/tray-icon.png', (err) => { if (err) throw err; console.log('tray-icon.png created'); })"
```

Expected output: `tray-icon.png created`

- [ ] **Step 2: Update package.json extraResources**

In `package.json`, update the `build` section to add the tray icon entry:

```json
"build": {
  "extraResources": [
    {
      "from": "resources/models",
      "to": "models",
      "filter": ["**/*"]
    },
    {
      "from": "resources/tray-icon.png",
      "to": "tray-icon.png"
    }
  ]
}
```

- [ ] **Step 3: Write failing tests for buildTrayMenuItems**

Create `tests/main/tray-menu.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { buildTrayMenuItems } from "../../src/main/tray-menu";

describe("buildTrayMenuItems", () => {
  it('shows "Hide Overlay" when window is visible', () => {
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[0].label).toBe("Hide Overlay");
  });

  it('shows "Show Overlay" when window is hidden', () => {
    const items = buildTrayMenuItems(false, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[0].label).toBe("Show Overlay");
  });

  it('shows "Switch to Edit Mode" in view mode', () => {
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[1].label).toBe("Switch to Edit Mode");
  });

  it('shows "Switch to View Mode" in edit mode', () => {
    const items = buildTrayMenuItems(true, "edit", vi.fn(), vi.fn(), vi.fn());
    expect(items[1].label).toBe("Switch to View Mode");
  });

  it("calls onToggleVisibility when first item is clicked", () => {
    const onToggleVisibility = vi.fn();
    const items = buildTrayMenuItems(
      true,
      "view",
      onToggleVisibility,
      vi.fn(),
      vi.fn(),
    );
    (items[0].click as () => void)();
    expect(onToggleVisibility).toHaveBeenCalledOnce();
  });

  it("calls onToggleMode when second item is clicked", () => {
    const onToggleMode = vi.fn();
    const items = buildTrayMenuItems(
      true,
      "view",
      vi.fn(),
      onToggleMode,
      vi.fn(),
    );
    (items[1].click as () => void)();
    expect(onToggleMode).toHaveBeenCalledOnce();
  });

  it("calls onQuit when Quit item is clicked", () => {
    const onQuit = vi.fn();
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), onQuit);
    const quitItem = items.find((i) => i.label === "Quit")!;
    (quitItem.click as () => void)();
    expect(onQuit).toHaveBeenCalledOnce();
  });

  it("includes a separator between mode toggle and Quit", () => {
    const items = buildTrayMenuItems(true, "view", vi.fn(), vi.fn(), vi.fn());
    expect(items[2].type).toBe("separator");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

```
npm test -- tests/main/tray-menu.test.ts
```

Expected: FAIL — `buildTrayMenuItems` not found

- [ ] **Step 5: Create src/main/tray-menu.ts**

```ts
import type { MenuItemConstructorOptions } from "electron";

export type TrayMode = "view" | "edit";

export function buildTrayMenuItems(
  isVisible: boolean,
  mode: TrayMode,
  onToggleVisibility: () => void,
  onToggleMode: () => void,
  onQuit: () => void,
): MenuItemConstructorOptions[] {
  return [
    {
      label: isVisible ? "Hide Overlay" : "Show Overlay",
      click: onToggleVisibility,
    },
    {
      label:
        mode === "view" ? "Switch to Edit Mode" : "Switch to View Mode",
      click: onToggleMode,
    },
    { type: "separator" },
    { label: "Quit", click: onQuit },
  ];
}
```

- [ ] **Step 6: Run tests to verify they pass**

```
npm test -- tests/main/tray-menu.test.ts
```

Expected: all 8 PASS

- [ ] **Step 7: Add tray setup to src/main/index.ts**

Update the imports in `src/main/index.ts`:

```ts
import { app, shell, BrowserWindow, session, Tray, Menu, ipcMain } from "electron";
import { buildTrayMenuItems, type TrayMode } from "./tray-menu";
```

Change `skipTaskbar: false` to `skipTaskbar: true` in `createWindow`:

```ts
const win = new BrowserWindow({
  width: 420,
  height: 680,
  frame: false,
  transparent: true,
  skipTaskbar: true,
  resizable: true,
  webPreferences: {
    preload: join(__dirname, "../preload/index.js"),
    sandbox: false,
  },
});
```

After `mainWindow = createWindow();` in `app.whenReady()`, add the tray setup:

```ts
// Tray setup
let currentMode: TrayMode = "view";
const trayIconPath = is.dev
  ? join(__dirname, "../../resources/tray-icon.png")
  : join(process.resourcesPath, "tray-icon.png");
const tray = new Tray(trayIconPath);
tray.setToolTip("Overlay — View Mode");

function rebuildTrayMenu(): void {
  tray.setToolTip(
    `Overlay — ${currentMode === "view" ? "View" : "Edit"} Mode`,
  );
  tray.setContextMenu(
    Menu.buildFromTemplate(
      buildTrayMenuItems(
        mainWindow!.isVisible(),
        currentMode,
        () => {
          if (mainWindow!.isVisible()) {
            mainWindow!.hide();
          } else {
            mainWindow!.show();
          }
          rebuildTrayMenu();
        },
        () => {
          mainWindow!.webContents.send("hotkey:toggleEditMode");
        },
        () => {
          app.quit();
        },
      ),
    ),
  );
}

rebuildTrayMenu();

ipcMain.on("window:notifyModeChanged", (_event, mode: TrayMode) => {
  currentMode = mode;
  rebuildTrayMenu();
});
```

- [ ] **Step 8: Run all tests**

```
npm test
```

Expected: all PASS

- [ ] **Step 9: Run typecheck**

```
npm run typecheck
```

Expected: no errors

- [ ] **Step 10: Commit**

```
git add resources/tray-icon.png src/main/tray-menu.ts tests/main/tray-menu.test.ts src/main/index.ts package.json
git commit -m "feat: add system tray icon with show/hide, mode toggle, and quit"
```
