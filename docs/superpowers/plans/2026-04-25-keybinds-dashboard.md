# Keybinds Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second always-on-top Electron window that hosts the peripherals-map keybinds dashboard alongside the existing notes overlay.

**Architecture:** A second `BrowserWindow` (1100×700, always-on-top, frameless) is created in main alongside the existing notes window. The keybinds renderer lives at `src/renderer/keybinds/` as a second electron-vite entry. Profile persistence is handled by a file-based `profiles-store.ts` in main (replacing idb), accessed over IPC via a dedicated preload. A fourth hotkey `Alt+Shift+K` and a new tray entry toggle the keybinds window's visibility.

**Tech Stack:** Electron 39, electron-vite 5, React 19, TypeScript, Vitest, electron-builder

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/main/tray-menu.ts` | Add keybindsVisible + onToggleKeybinds params |
| Modify | `tests/main/tray-menu.test.ts` | Update tests for new signature |
| Modify | `src/renderer/src/types.ts` | Add `toggleKeybinds` to Hotkeys |
| Modify | `src/main/store/notes-store.ts` | Add `toggleKeybinds` default |
| Modify | `src/main/ipc/hotkeys-handler.ts` | Register toggleKeybinds hotkey, accept keybindsWin |
| Modify | `src/renderer/src/components/SettingsPanel.tsx` | Add toggleKeybinds hotkey field |
| Modify | `tests/renderer/SettingsPanel.test.tsx` | Update fixture + assertions |
| Modify | `tests/main/notes-store.test.ts` | Add toggleKeybinds to fixtures |
| Modify | `electron.vite.config.ts` | Add second renderer + preload entries |
| Copy   | `src/renderer/keybinds/src/` | peripherals-map `app/src/` contents |
| Create | `src/renderer/keybinds/index.html` | Keybinds renderer entry HTML |
| Create | `src/renderer/keybinds/src/main.tsx` | React root for keybinds window |
| Create | `src/main/store/profiles-store.ts` | File-based profile persistence |
| Create | `tests/main/profiles-store.test.ts` | profiles-store unit tests |
| Create | `src/main/ipc/keybinds-handler.ts` | IPC handlers for profiles load/save/delete |
| Create | `src/preload/keybinds.ts` | contextBridge for keybinds IPC |
| Modify | `src/renderer/keybinds/src/db.ts` | Replace idb with IPC calls |
| Modify | `src/main/index.ts` | Create keybindsWindow, wire all handlers |
| Create | `CLAUDE.md` | Root — Electron architecture and dev commands |
| Create | `src/renderer/keybinds/CLAUDE.md` | Keybinds renderer — profile format and parser |

---

## Task 1: Update tray-menu to include keybinds window toggle

**Files:**
- Modify: `src/main/tray-menu.ts`
- Modify: `tests/main/tray-menu.test.ts`

- [ ] **Step 1: Write failing tests for the new tray signature**

Replace `tests/main/tray-menu.test.ts` with:

```typescript
import { describe, it, expect, vi } from "vitest";
import { buildTrayMenuItems } from "../../src/main/tray-menu";

function build(
  notesVisible = true,
  keybindsVisible = false,
  mode: "view" | "edit" = "view",
) {
  return buildTrayMenuItems(
    notesVisible,
    mode,
    keybindsVisible,
    vi.fn(),
    vi.fn(),
    vi.fn(),
    vi.fn(),
  );
}

describe("buildTrayMenuItems — notes overlay", () => {
  it('shows "Hide Overlay" when notes window is visible', () => {
    expect(build(true).find(i => i.label?.includes("Overlay"))?.label).toBe("Hide Overlay");
  });

  it('shows "Show Overlay" when notes window is hidden', () => {
    expect(build(false).find(i => i.label?.includes("Overlay"))?.label).toBe("Show Overlay");
  });

  it('shows "Switch to Edit Mode" in view mode', () => {
    expect(build(true, false, "view").find(i => i.label?.includes("Mode"))?.label).toBe("Switch to Edit Mode");
  });

  it('shows "Switch to View Mode" in edit mode', () => {
    expect(build(true, false, "edit").find(i => i.label?.includes("Mode"))?.label).toBe("Switch to View Mode");
  });
});

describe("buildTrayMenuItems — keybinds window", () => {
  it('shows "Hide Keybinds" when keybinds window is visible', () => {
    expect(build(true, true).find(i => i.label?.includes("Keybinds"))?.label).toBe("Hide Keybinds");
  });

  it('shows "Show Keybinds" when keybinds window is hidden', () => {
    expect(build(true, false).find(i => i.label?.includes("Keybinds"))?.label).toBe("Show Keybinds");
  });

  it("calls onToggleKeybinds when keybinds item is clicked", () => {
    const onToggleKeybinds = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, vi.fn(), vi.fn(), onToggleKeybinds, vi.fn());
    const item = items.find(i => i.label?.includes("Keybinds"))!;
    (item.click as () => void)();
    expect(onToggleKeybinds).toHaveBeenCalledOnce();
  });
});

describe("buildTrayMenuItems — callbacks", () => {
  it("calls onToggleVisibility when overlay item is clicked", () => {
    const onToggleVisibility = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, onToggleVisibility, vi.fn(), vi.fn(), vi.fn());
    const item = items.find(i => i.label?.includes("Overlay"))!;
    (item.click as () => void)();
    expect(onToggleVisibility).toHaveBeenCalledOnce();
  });

  it("calls onToggleMode when mode item is clicked", () => {
    const onToggleMode = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, vi.fn(), onToggleMode, vi.fn(), vi.fn());
    const item = items.find(i => i.label?.includes("Mode"))!;
    (item.click as () => void)();
    expect(onToggleMode).toHaveBeenCalledOnce();
  });

  it("calls onQuit when Quit item is clicked", () => {
    const onQuit = vi.fn();
    const items = buildTrayMenuItems(true, "view", false, vi.fn(), vi.fn(), vi.fn(), onQuit);
    (items.find(i => i.label === "Quit")!.click as () => void)();
    expect(onQuit).toHaveBeenCalledOnce();
  });

  it("includes separators between sections", () => {
    const items = build();
    expect(items.filter(i => i.type === "separator")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/main/tray-menu.test.ts
```

Expected: failures due to wrong argument count.

- [ ] **Step 3: Update tray-menu.ts**

Replace `src/main/tray-menu.ts` with:

```typescript
import type { MenuItemConstructorOptions } from "electron";

export type TrayMode = "view" | "edit";

export function buildTrayMenuItems(
  notesVisible: boolean,
  mode: TrayMode,
  keybindsVisible: boolean,
  onToggleVisibility: () => void,
  onToggleMode: () => void,
  onToggleKeybinds: () => void,
  onQuit: () => void,
): MenuItemConstructorOptions[] {
  return [
    {
      label: notesVisible ? "Hide Overlay" : "Show Overlay",
      click: onToggleVisibility,
    },
    {
      label: mode === "view" ? "Switch to Edit Mode" : "Switch to View Mode",
      click: onToggleMode,
    },
    { type: "separator" },
    {
      label: keybindsVisible ? "Hide Keybinds" : "Show Keybinds",
      click: onToggleKeybinds,
    },
    { type: "separator" },
    { label: "Quit", click: onQuit },
  ];
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- tests/main/tray-menu.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add src/main/tray-menu.ts tests/main/tray-menu.test.ts
git commit -m "feat: add keybinds window toggle to tray menu"
```

---

## Task 2: Add toggleKeybinds hotkey

**Files:**
- Modify: `src/renderer/src/types.ts`
- Modify: `src/main/store/notes-store.ts`
- Modify: `src/main/ipc/hotkeys-handler.ts`
- Modify: `src/renderer/src/components/SettingsPanel.tsx`
- Modify: `tests/renderer/SettingsPanel.test.tsx`
- Modify: `tests/main/notes-store.test.ts`

- [ ] **Step 1: Add toggleKeybinds to Hotkeys type**

In `src/renderer/src/types.ts`, update the `Hotkeys` interface:

```typescript
export interface Hotkeys {
  toggleVisibility: string;
  toggleEditMode: string;
  startVoiceNote: string;
  toggleKeybinds: string;
}
```

- [ ] **Step 2: Add default to notes-store**

In `src/main/store/notes-store.ts`, update `DEFAULT_APP_DATA`:

```typescript
export const DEFAULT_APP_DATA: AppData = {
  settings: {
    hotkeys: {
      toggleVisibility: "Alt+Shift+N",
      toggleEditMode: "Alt+Shift+E",
      startVoiceNote: "Alt+Shift+V",
      toggleKeybinds: "Alt+Shift+K",
    },
    audioDeviceId: "",
  },
  appearance: DEFAULT_APPEARANCE,
  sections: [],
};
```

- [ ] **Step 3: Update notes-store tests to include toggleKeybinds**

In `tests/main/notes-store.test.ts`, update the `data` fixture inside "round-trips collapsed field on notes" (line ~107) and the partial hotkeys fixture (line ~88) to include `toggleKeybinds`:

For the partial hotkeys test (around line 85), update the assertion to also check `toggleKeybinds`:
```typescript
expect(result.data.settings.hotkeys.toggleKeybinds).toBe(
  DEFAULT_APP_DATA.settings.hotkeys.toggleKeybinds,
);
```

For the round-trip test data fixture (around line 107), add `toggleKeybinds: "Alt+K"` to the `hotkeys` object:
```typescript
settings: { hotkeys: { toggleVisibility: "Alt+H", toggleEditMode: "Alt+E", startVoiceNote: "Alt+V", toggleKeybinds: "Alt+K" } },
```

- [ ] **Step 4: Run notes-store tests**

```
npm test -- tests/main/notes-store.test.ts
```

Expected: all pass.

- [ ] **Step 5: Update hotkeys-handler to accept keybindsWin and register the new hotkey**

Replace `src/main/ipc/hotkeys-handler.ts` with:

```typescript
import { ipcMain, globalShortcut, BrowserWindow } from "electron";
import type { Hotkeys } from "../../renderer/src/types";

export function buildAccelerator(hotkey: string): string {
  return hotkey;
}

const VALID_MODIFIERS = new Set([
  "ctrl", "control", "alt", "shift", "meta", "super", "command", "cmdorctrl",
]);

const VALID_KEY_PATTERN =
  /^([a-z0-9]|f[1-9]|f1[0-9]|f2[0-4]|space|tab|enter|return|escape|esc|backspace|delete|insert|home|end|pageup|pagedown|up|down|left|right|plus|minus|equal|numdec|numadd|numsub|nummult|numdiv)$/i;

export function validateAccelerator(accelerator: string): string | null {
  if (!accelerator || typeof accelerator !== "string") {
    return "Hotkey must be a non-empty string.";
  }
  const parts = accelerator.split("+").map((p) => p.trim());
  if (parts.length < 2) {
    return `"${accelerator}" is not a valid hotkey — must include at least one modifier (e.g. Alt+Shift+N).`;
  }
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);
  if (!VALID_KEY_PATTERN.test(key)) {
    return `"${key}" is not a recognised key.`;
  }
  for (const mod of modifiers) {
    if (!VALID_MODIFIERS.has(mod.toLowerCase())) {
      return `"${mod}" is not a recognised modifier.`;
    }
  }
  return null;
}

export function registerGlobalHotkeys(
  notesWin: BrowserWindow,
  keybindsWin: BrowserWindow,
  hotkeys: Hotkeys,
): void {
  unregisterGlobalHotkeys();

  const register = (key: string, fn: () => void): boolean => {
    if (!key) return false;
    if (validateAccelerator(key) !== null) return false;
    return globalShortcut.register(buildAccelerator(key), fn);
  };

  register(hotkeys.toggleVisibility, () => {
    if (notesWin.isVisible()) notesWin.hide();
    else notesWin.show();
  });

  register(hotkeys.toggleEditMode, () => {
    notesWin.webContents.send("hotkey:toggleEditMode");
  });

  register(hotkeys.startVoiceNote, () => {
    notesWin.webContents.send("hotkey:startVoiceNote");
  });

  register(hotkeys.toggleKeybinds, () => {
    if (keybindsWin.isVisible()) keybindsWin.hide();
    else keybindsWin.show();
  });
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll();
}

export function registerHotkeyHandlers(
  notesWin: BrowserWindow,
  keybindsWin: BrowserWindow,
): void {
  ipcMain.handle("hotkeys:update", (_event, hotkeys: Hotkeys) => {
    const errors: Partial<Record<keyof Hotkeys, string>> = {};
    for (const [k, v] of Object.entries(hotkeys) as [keyof Hotkeys, string][]) {
      const err = validateAccelerator(v);
      if (err) errors[k] = err;
    }
    if (Object.keys(errors).length > 0) return { errors };
    registerGlobalHotkeys(notesWin, keybindsWin, hotkeys);
    return { errors: {} };
  });
}
```

- [ ] **Step 6: Update SettingsPanel.tsx to show the new hotkey field**

In `src/renderer/src/components/SettingsPanel.tsx`, update the `LABELS` constant:

```typescript
const LABELS: Record<HotkeyKey, string> = {
  toggleVisibility: "Show / Hide Overlay",
  toggleEditMode: "Toggle Edit Mode",
  startVoiceNote: "Start Voice Note",
  toggleKeybinds: "Show / Hide Keybinds",
};
```

- [ ] **Step 7: Update SettingsPanel tests**

In `tests/renderer/SettingsPanel.test.tsx`:

Update the `hotkeys` fixture at the top to include `toggleKeybinds`:
```typescript
const hotkeys: Hotkeys = {
  toggleVisibility: "Alt+Shift+N",
  toggleEditMode: "Alt+Shift+E",
  startVoiceNote: "Alt+Shift+V",
  toggleKeybinds: "Alt+Shift+K",
};
```

Update the "renders all three hotkey fields" test to expect four fields:
```typescript
it("renders all four hotkey fields", () => {
  renderPanel();
  expect(screen.getByText("Show / Hide Overlay")).toBeInTheDocument();
  expect(screen.getByText("Toggle Edit Mode")).toBeInTheDocument();
  expect(screen.getByText("Start Voice Note")).toBeInTheDocument();
  expect(screen.getByText("Show / Hide Keybinds")).toBeInTheDocument();
});
```

- [ ] **Step 8: Run all tests**

```
npm test
```

Expected: all pass.

- [ ] **Step 9: Commit**

```
git add src/renderer/src/types.ts src/main/store/notes-store.ts src/main/ipc/hotkeys-handler.ts src/renderer/src/components/SettingsPanel.tsx tests/renderer/SettingsPanel.test.tsx tests/main/notes-store.test.ts
git commit -m "feat: add toggleKeybinds hotkey"
```

---

## Task 3: Configure electron-vite for two renderer entries

**Files:**
- Modify: `electron.vite.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Update electron.vite.config.ts**

Replace `electron.vite.config.ts` with:

```typescript
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: [] })],
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/main/index.ts"),
          "whisper-worker": resolve("src/main/voice/whisper-worker.ts"),
        },
        external: ["@huggingface/transformers"],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/preload/index.ts"),
          keybinds: resolve("src/preload/keybinds.ts"),
        },
      },
    },
  },
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@keybinds": resolve("src/renderer/keybinds/src"),
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: {
          index: resolve("src/renderer/index.html"),
          keybinds: resolve("src/renderer/keybinds/index.html"),
        },
      },
    },
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```
npm run typecheck
```

Expected: no errors (the keybinds renderer source doesn't exist yet — this will error on the rollup input path, which is expected at this stage).

- [ ] **Step 3: Commit**

```
git add electron.vite.config.ts
git commit -m "chore: configure electron-vite for two renderer entries"
```

---

## Task 4: Copy peripherals-map source into keybinds renderer

**Files:**
- Create: `src/renderer/keybinds/index.html`
- Create: `src/renderer/keybinds/src/` (copy from peripherals-map)
- Create: `src/renderer/keybinds/src/main.tsx`

- [ ] **Step 1: Create the keybinds renderer directory and copy source**

From the repo root, copy the peripherals-map app source:

```
xcopy /E /I "C:\Users\ellio\Documents\peripherals-map\app\src" "src\renderer\keybinds\src"
```

This copies all components, data, importers, CSS, and types.

- [ ] **Step 2: Create index.html**

Create `src/renderer/keybinds/index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Keybinds</title>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    />
    <style>
      html, body, #root { height: 100%; margin: 0; background: transparent; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create main.tsx**

Create `src/renderer/keybinds/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

- [ ] **Step 4: Remove idb import from db.ts**

Open `src/renderer/keybinds/src/db.ts` and delete the file contents — it will be replaced in Task 7. For now, replace with a stub so TypeScript doesn't error:

```typescript
import type { Profile } from './data/types'

export async function loadImportedProfiles(): Promise<Profile[]> { return [] }
export async function saveProfile(_profile: Profile): Promise<void> {}
export async function deleteProfile(_id: string): Promise<void> {}
```

- [ ] **Step 5: Run typecheck**

```
npm run typecheck
```

Expected: no errors. If there are import errors for `idb`, confirm `db.ts` was replaced correctly.

- [ ] **Step 6: Run dev server**

```
npm run dev
```

Expected: Electron opens. The notes overlay appears as before. The keybinds window does not appear yet (not wired in main). No console errors.

- [ ] **Step 7: Commit**

```
git add src/renderer/keybinds/
git commit -m "feat: add keybinds renderer source"
```

---

## Task 5: profiles-store.ts

**Files:**
- Create: `src/main/store/profiles-store.ts`
- Create: `tests/main/profiles-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/main/profiles-store.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```
npm test -- tests/main/profiles-store.test.ts
```

Expected: FAIL — `Cannot find module '../../src/main/store/profiles-store'`.

- [ ] **Step 3: Implement profiles-store.ts**

Create `src/main/store/profiles-store.ts`:

```typescript
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import type { Profile } from "../../renderer/keybinds/src/data/types";

export function loadProfiles(filePath: string): {
  data: Profile[];
  error: string | null;
} {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { data: [], error: "Profiles file is corrupted. Starting with empty state." };
    }
    return { data: parsed as Profile[], error: null };
  } catch (err: unknown) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return { data: [], error: null };
    }
    return { data: [], error: "Profiles file is corrupted. Starting with empty state." };
  }
}

export function saveProfiles(filePath: string, profiles: Profile[]): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(profiles, null, 2), "utf-8");
}
```

- [ ] **Step 4: Run tests to verify they pass**

```
npm test -- tests/main/profiles-store.test.ts
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```
git add src/main/store/profiles-store.ts tests/main/profiles-store.test.ts
git commit -m "feat: add file-based profiles store"
```

---

## Task 6: keybinds-handler.ts and preload/keybinds.ts

**Files:**
- Create: `src/main/ipc/keybinds-handler.ts`
- Create: `src/preload/keybinds.ts`

- [ ] **Step 1: Create keybinds-handler.ts**

Create `src/main/ipc/keybinds-handler.ts`:

```typescript
import { ipcMain, app, BrowserWindow } from "electron";
import { join } from "path";
import { loadProfiles, saveProfiles } from "../store/profiles-store";
import type { Profile } from "../../renderer/keybinds/src/data/types";

export function registerKeybindsHandlers(win: BrowserWindow): {
  initialProfiles: Profile[];
} {
  const PROFILES_PATH = join(app.getPath("userData"), "profiles.json");
  const { data, error } = loadProfiles(PROFILES_PATH);

  if (error) console.error("[keybinds-handler] Load error:", error);

  ipcMain.handle("keybinds:save", (_event, profile: Profile) => {
    const { data: current } = loadProfiles(PROFILES_PATH);
    const idx = current.findIndex((p) => p.id === profile.id);
    if (idx >= 0) current[idx] = profile;
    else current.push(profile);
    saveProfiles(PROFILES_PATH, current);
  });

  ipcMain.handle("keybinds:delete", (_event, id: string) => {
    const { data: current } = loadProfiles(PROFILES_PATH);
    saveProfiles(PROFILES_PATH, current.filter((p) => p.id !== id));
  });

  return { initialProfiles: data };
}
```

- [ ] **Step 2: Create preload/keybinds.ts**

Create `src/preload/keybinds.ts`:

```typescript
import { contextBridge, ipcRenderer } from "electron";
import type { Profile } from "../renderer/keybinds/src/data/types";

const keybindsApi = {
  onProfilesLoad: (cb: (profiles: Profile[]) => void) => {
    ipcRenderer.once("keybinds:load", (_event, profiles) => cb(profiles));
  },
  removeProfilesLoadListener: () => {
    ipcRenderer.removeAllListeners("keybinds:load");
  },
  saveProfile: (profile: Profile): Promise<void> =>
    ipcRenderer.invoke("keybinds:save", profile),
  deleteProfile: (id: string): Promise<void> =>
    ipcRenderer.invoke("keybinds:delete", id),
};

contextBridge.exposeInMainWorld("keybindsApi", keybindsApi);

export type KeybindsAPI = typeof keybindsApi;
```

- [ ] **Step 3: Add keybindsApi type declaration to the keybinds renderer**

Create `src/renderer/keybinds/src/env.d.ts`:

```typescript
import type { KeybindsAPI } from '../../../preload/keybinds'

declare global {
  interface Window {
    keybindsApi: KeybindsAPI
  }
}
```

- [ ] **Step 4: Run typecheck**

```
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```
git add src/main/ipc/keybinds-handler.ts src/preload/keybinds.ts src/renderer/keybinds/src/env.d.ts
git commit -m "feat: add keybinds IPC handler and preload"
```

---

## Task 7: Replace db.ts with IPC calls

**Files:**
- Modify: `src/renderer/keybinds/src/db.ts`

- [ ] **Step 1: Replace db.ts**

Replace the contents of `src/renderer/keybinds/src/db.ts` with:

```typescript
import type { Profile } from './data/types'

export function loadImportedProfiles(): Promise<Profile[]> {
  return new Promise((resolve) => {
    window.keybindsApi.onProfilesLoad(resolve)
  })
}

export async function saveProfile(profile: Profile): Promise<void> {
  return window.keybindsApi.saveProfile(profile)
}

export async function deleteProfile(id: string): Promise<void> {
  return window.keybindsApi.deleteProfile(id)
}
```

- [ ] **Step 2: Run typecheck**

```
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/renderer/keybinds/src/db.ts
git commit -m "feat: replace idb with IPC in keybinds db layer"
```

---

## Task 8: Create keybindsWindow in main/index.ts

**Files:**
- Modify: `src/main/index.ts`

- [ ] **Step 1: Replace src/main/index.ts**

Replace `src/main/index.ts` with:

```typescript
import {
  app, shell, BrowserWindow, session, Tray, Menu, ipcMain,
} from "electron";

if (process.env.E2E_USER_DATA_DIR) {
  app.setPath("userData", process.env.E2E_USER_DATA_DIR);
}

import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { registerNotesHandlers } from "./ipc/notes-handler";
import { registerWindowHandlers } from "./ipc/window-handler";
import {
  registerHotkeyHandlers,
  registerGlobalHotkeys,
  unregisterGlobalHotkeys,
} from "./ipc/hotkeys-handler";
import { registerKeybindsHandlers } from "./ipc/keybinds-handler";
import { registerVoiceHandlers } from "./voice/voice-handler";
import { buildTrayMenuItems, type TrayMode } from "./tray-menu";

let notesWindow: BrowserWindow | null = null;
let keybindsWindow: BrowserWindow | null = null;

function createNotesWindow(): BrowserWindow {
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

  win.setAlwaysOnTop(true, "screen-saver");
  win.setIgnoreMouseEvents(true, { forward: true });

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

function createKeybindsWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/keybinds.js"),
      sandbox: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/keybinds.html");
  } else {
    win.loadFile(join(__dirname, "../renderer/keybinds.html"));
  }

  return win;
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.gameoverlay.notes");

  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback, details) => {
      if (
        permission === "media" &&
        (details as Electron.MediaAccessPermissionRequest).mediaTypes?.includes("audio")
      ) {
        callback(true);
      } else {
        callback(false);
      }
    },
  );

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  notesWindow = createNotesWindow();
  keybindsWindow = createKeybindsWindow();

  // Tray setup
  if (!process.env.E2E_NO_TRAY) {
    let currentMode: TrayMode = "view";
    const trayIconPath = is.dev
      ? join(__dirname, "../../resources/tray-icon.png")
      : join(process.resourcesPath, "tray-icon.png");
    const tray = new Tray(trayIconPath);

    function rebuildTrayMenu(): void {
      tray.setToolTip(
        `Overlay — ${currentMode === "view" ? "View" : "Edit"} Mode`,
      );
      tray.setContextMenu(
        Menu.buildFromTemplate(
          buildTrayMenuItems(
            notesWindow!.isVisible(),
            currentMode,
            keybindsWindow!.isVisible(),
            () => {
              if (notesWindow!.isVisible()) notesWindow!.hide();
              else notesWindow!.show();
              rebuildTrayMenu();
            },
            () => {
              notesWindow!.webContents.send("hotkey:toggleEditMode");
            },
            () => {
              if (keybindsWindow!.isVisible()) keybindsWindow!.hide();
              else keybindsWindow!.show();
              rebuildTrayMenu();
            },
            () => { app.quit(); },
          ),
        ),
      );
    }

    rebuildTrayMenu();

    ipcMain.on("window:notifyModeChanged", (_event, mode: TrayMode) => {
      currentMode = mode;
      rebuildTrayMenu();
    });
  }

  const modelPath = is.dev
    ? join(__dirname, "../../resources/models")
    : join(process.resourcesPath, "models");

  const { initialData, loadError } = registerNotesHandlers();
  const { initialProfiles } = registerKeybindsHandlers(keybindsWindow);

  registerWindowHandlers(notesWindow);
  registerHotkeyHandlers(notesWindow, keybindsWindow);
  registerVoiceHandlers(notesWindow, modelPath);

  notesWindow.webContents.on("did-finish-load", () => {
    notesWindow!.webContents.send("notes:load", initialData, loadError);
  });

  keybindsWindow.webContents.on("did-finish-load", () => {
    keybindsWindow!.webContents.send("keybinds:load", initialProfiles);
  });

  registerGlobalHotkeys(notesWindow, keybindsWindow, initialData.settings.hotkeys);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      notesWindow = createNotesWindow();
      keybindsWindow = createKeybindsWindow();
    }
  });
});

app.on("window-all-closed", () => {
  unregisterGlobalHotkeys();
  if (process.platform !== "darwin") app.quit();
});
```

- [ ] **Step 2: Run typecheck**

```
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify both windows**

```
npm run dev
```

Expected:
- Notes overlay appears as before (420×680)
- Keybinds window does not appear on startup (starts hidden)
- Press `Alt+Shift+K` — keybinds dashboard appears (1100×700) showing the peripherals-map UI with all profile tabs
- Press `Alt+Shift+K` again — keybinds window hides
- Tray menu shows both "Show/Hide Overlay" and "Show/Hide Keybinds" entries
- Importing a `.rewasd` file in the keybinds window persists across restarts

- [ ] **Step 4: Run full test suite**

```
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```
git add src/main/index.ts
git commit -m "feat: create keybinds window and wire all handlers"
```

---

## Task 9: CLAUDE.md files

**Files:**
- Create: `CLAUDE.md`
- Create: `src/renderer/keybinds/CLAUDE.md`

- [ ] **Step 1: Create root CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start Electron app in dev mode (HMR)
npm run build        # typecheck + build all targets
npm run typecheck    # TypeScript check (main + renderer)
npm test             # Vitest unit tests
npm run test:e2e     # Playwright end-to-end tests (requires build first)
npm run lint         # ESLint
```

## Architecture

This is an Electron app using electron-vite with two always-on-top overlay windows: a notes overlay and a keybinds dashboard.

### Process structure

- `src/main/` — Electron main process. Owns window lifecycle, IPC handlers, file I/O, global hotkeys, tray, voice transcription.
- `src/preload/index.ts` — contextBridge for notes window. Exposed as `window.api`.
- `src/preload/keybinds.ts` — contextBridge for keybinds window. Exposed as `window.keybindsApi`.
- `src/renderer/src/` — Notes overlay React app (420×680).
- `src/renderer/keybinds/src/` — Keybinds dashboard React app (1100×700).

### Windows

Both windows are frameless, transparent, always-on-top, skipTaskbar. Notes window starts visible; keybinds window starts hidden. Both are toggled via global hotkeys and tray menu entries. Hotkeys are stored in `userData/notes.json` and registered/unregistered as a unit via `registerGlobalHotkeys(notesWin, keybindsWin, hotkeys)`.

### IPC patterns

All IPC follows the same pattern established by notes: main loads data from a file store at startup, sends it to the renderer via a `channel:load` event after `did-finish-load`, and handles save/delete via `ipcMain.handle`. See `src/main/ipc/notes-handler.ts` and `src/main/ipc/keybinds-handler.ts`.

### File stores

- `src/main/store/notes-store.ts` — reads/writes `userData/notes.json` (full AppData)
- `src/main/store/profiles-store.ts` — reads/writes `userData/profiles.json` (Profile[])

Both use `fs.readFileSync` / `fs.writeFileSync` directly. No ORM, no async I/O.

### Tray

`src/main/tray-menu.ts` exports `buildTrayMenuItems(notesVisible, mode, keybindsVisible, onToggleVisibility, onToggleMode, onToggleKeybinds, onQuit)`. The tray is rebuilt in `index.ts` whenever window visibility or mode changes.

### Testing

Unit tests in `tests/main/` and `tests/renderer/`. E2E tests in `tests/e2e/` via Playwright. Run `npm test` for unit tests only.
```

- [ ] **Step 2: Create keybinds renderer CLAUDE.md**

Create `src/renderer/keybinds/CLAUDE.md`:

```markdown
# CLAUDE.md — Keybinds Renderer

Guidance for working in the keybinds dashboard renderer (`src/renderer/keybinds/src/`).

## Architecture

React + TypeScript SPA that renders Azeron Cyborg and Cyro keybind profiles. Profile data comes from the Electron main process over IPC (not from IndexedDB — `db.ts` uses `window.keybindsApi`). Built-in profiles are loaded at build time via `import.meta.glob` in `data/profiles.ts`; imported reWASD profiles are persisted to `userData/profiles.json` via IPC.

## Data model (`src/data/types.ts`)

- `Profile` — one device's keybind layout. Has `layers.default` (required) and optionally `layers.shift`. `pairId` links a Cyborg and Cyro profile from the same reWASD file.
- `Layer` — `Record<string, Button>` where keys are **Azeron button numbers** (not reWASD button IDs).
- `Button` — `{ zone, label, bindings: { single?, long?, double? } }`
- `Zone` — `'app' | 'terminal' | 'edit' | 'nav' | 'git' | 'mouse' | 'system' | 'thumb' | 'unzoned'`
- `RadialMenu` / `RadialAction` — nested radial menu structure

## Layout (`src/data/layout.ts`)

`CYBORG_GRID` and `CYRO_GRID` define physical button positions as 2D arrays of Azeron button number strings. Button IDs in `Layer` objects must match these strings exactly for buttons to appear in the grid.

## reWASD parser (`src/importers/parseRewasd.ts`)

Handles two mapping styles from `.rewasd` files:

- **Description-based** (e.g. VSCode profiles): `"Cyborg #N - Label KeyCombo"` — regex extracts device, button number, label, binding directly.
- **Mask-based** (e.g. WoW profiles): button identity from `masks[].set[].{deviceId, buttonId}`, binding from `macros[].keyboard.description` (DIK_ key names).

**Critical:** reWASD uses different button numbering from Azeron. `CYBORG_BTN` and `CYRO_BTN` lookup tables in the parser translate reWASD `buttonId` → Azeron button number. See `references/button-id-mapping.md` in the Obsidian skill for the full table.

## IPC (`src/db.ts`)

Replaces idb. Three functions backed by `window.keybindsApi`:
- `loadImportedProfiles()` — resolves when main sends `keybinds:load`
- `saveProfile(profile)` — upserts via `keybinds:save`
- `deleteProfile(id)` — removes via `keybinds:delete`
```

- [ ] **Step 3: Commit**

```
git add CLAUDE.md src/renderer/keybinds/CLAUDE.md
git commit -m "docs: add CLAUDE.md files for root and keybinds renderer"
```

---

## Task 10: Smoke test

- [ ] **Step 1: Run full test suite**

```
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run dev and verify end-to-end**

```
npm run dev
```

Verify:
1. Notes overlay opens at startup, behaves as before
2. `Alt+Shift+K` shows the keybinds dashboard
3. All built-in profile tabs are visible (Mac Default, Windows Default, VS Code, Browser, Terminal, Discord, Obsidian, Spotify)
4. Import a `.rewasd` file — profile appears as a tab
5. Restart the app — imported profile is still present (persisted to `userData/profiles.json`)
6. Delete the imported tab — profile is removed
7. Tray menu shows "Show Keybinds" / "Hide Keybinds" correctly
8. Configuring `toggleKeybinds` hotkey in settings panel works
9. `Alt+Shift+N` still toggles notes overlay

- [ ] **Step 3: Run production build**

```
npm run build
```

Expected: no TypeScript errors, no build errors.
