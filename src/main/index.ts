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
import { registerVoiceHandlers } from "./voice/voice-handler";
import { buildTrayMenuItems, type TrayMode } from "./tray-menu";

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
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

  mainWindow = createWindow();

  // Tray setup
  if (!process.env.E2E_NO_TRAY) {
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
  }

  const modelPath = is.dev
    ? join(__dirname, "../../resources/models")
    : join(process.resourcesPath, "models");

  const { initialData, loadError } = registerNotesHandlers();
  registerWindowHandlers(mainWindow);
  registerHotkeyHandlers(mainWindow);
  registerVoiceHandlers(mainWindow, modelPath);

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow!.webContents.send("notes:load", initialData, loadError);
  });

  registerGlobalHotkeys(mainWindow, initialData.settings.hotkeys);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  unregisterGlobalHotkeys();
  if (process.platform !== "darwin") app.quit();
});
