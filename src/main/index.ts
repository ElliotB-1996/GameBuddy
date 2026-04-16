import { app, shell, BrowserWindow, session } from "electron";
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

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 680,
    frame: false,
    transparent: true,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  if (is.dev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
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
