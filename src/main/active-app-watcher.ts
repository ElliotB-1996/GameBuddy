import { basename } from "path";
import type { BrowserWindow } from "electron";
import activeWindow from "active-win";

const selfName = basename(process.execPath).toLowerCase();

let stopFn: (() => void) | null = null;

export function startActiveAppWatcher(keybindsWindow: BrowserWindow): void {
  let lastProcessName = "";
  let running = false;

  const id = setInterval(async () => {
    if (!keybindsWindow.isVisible() || running) return;
    running = true;
    try {
      const win = await activeWindow();
      if (!win) return;
      const name = basename(win.owner.path);
      if (name.toLowerCase() === selfName || name === lastProcessName) return;
      lastProcessName = name;
      keybindsWindow.webContents.send("keybinds:active-app", name);
    } catch {
      // ignore
    } finally {
      running = false;
    }
  }, 1000);

  stopFn = () => clearInterval(id);
}

export function stopActiveAppWatcher(): void {
  stopFn?.();
  stopFn = null;
}
