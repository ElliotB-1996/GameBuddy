import {
  app,
  shell,
  BrowserWindow,
  session,
  Tray,
  Menu,
  ipcMain,
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
import {
  startActiveAppWatcher,
  stopActiveAppWatcher,
} from "./active-app-watcher";
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
    show: false,
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
    win.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/keybinds/index.html");
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
        (details as Electron.MediaAccessPermissionRequest).mediaTypes?.includes(
          "audio",
        )
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
  startActiveAppWatcher(keybindsWindow);

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
  }

  const modelPath = is.dev
    ? join(__dirname, "../../resources/models")
    : join(process.resourcesPath, "models");

  const { initialData, loadError } = registerNotesHandlers();
  const { initialProfiles } = registerKeybindsHandlers();

  registerWindowHandlers(notesWindow);
  registerHotkeyHandlers(notesWindow, keybindsWindow);
  registerVoiceHandlers(notesWindow, modelPath);

  notesWindow.webContents.on("did-finish-load", () => {
    notesWindow!.webContents.send("notes:load", initialData, loadError);
  });

  keybindsWindow.webContents.on("did-finish-load", () => {
    keybindsWindow!.webContents.send("keybinds:load", initialProfiles);
  });

  registerGlobalHotkeys(
    notesWindow,
    keybindsWindow,
    initialData.settings.hotkeys,
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      notesWindow = createNotesWindow();
      keybindsWindow = createKeybindsWindow();
    }
  });
});

app.on("window-all-closed", () => {
  unregisterGlobalHotkeys();
  stopActiveAppWatcher();
  if (process.platform !== "darwin") app.quit();
});
