import { ipcMain, globalShortcut, BrowserWindow } from "electron";
import type { Hotkeys } from "../../renderer/src/types";

/** Returns the accelerator string (identity function, exists for testability and future transforms) */
export function buildAccelerator(hotkey: string): string {
  return hotkey;
}

const VALID_MODIFIERS = new Set([
  "ctrl",
  "control",
  "alt",
  "shift",
  "meta",
  "super",
  "command",
  "cmdorctrl",
]);

const VALID_KEY_PATTERN =
  /^([a-z0-9]|f[1-9]|f1[0-9]|f2[0-4]|space|tab|enter|return|escape|esc|backspace|delete|insert|home|end|pageup|pagedown|up|down|left|right|plus|minus|equal|numdec|numadd|numsub|nummult|numdiv)$/i;

/**
 * Validates an Electron accelerator string.
 * Must be one or more modifiers followed by a single key, joined with "+".
 * Returns an error message if invalid, or null if valid.
 */
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
  win: BrowserWindow,
  hotkeys: Hotkeys,
): void {
  unregisterGlobalHotkeys();

  const register = (key: string, fn: () => void): boolean => {
    if (!key) return false;
    if (validateAccelerator(key) !== null) return false;
    return globalShortcut.register(buildAccelerator(key), fn);
  };

  register(hotkeys.toggleVisibility, () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
    }
  });

  register(hotkeys.toggleEditMode, () => {
    win.webContents.send("hotkey:toggleEditMode");
  });

  register(hotkeys.startVoiceNote, () => {
    win.webContents.send("hotkey:startVoiceNote");
  });
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll();
}

export function registerHotkeyHandlers(win: BrowserWindow): void {
  ipcMain.handle("hotkeys:update", (_event, hotkeys: Hotkeys) => {
    const errors: Partial<Record<keyof Hotkeys, string>> = {};
    for (const [k, v] of Object.entries(hotkeys) as [keyof Hotkeys, string][]) {
      const err = validateAccelerator(v);
      if (err) errors[k] = err;
    }
    if (Object.keys(errors).length > 0) return { errors };
    registerGlobalHotkeys(win, hotkeys);
    return { errors: {} };
  });
}
