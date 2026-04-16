import { contextBridge, ipcRenderer } from "electron";
import type { AppData, Hotkeys, WindowMode } from "../renderer/src/types";

const api = {
  // Main → Renderer events
  onNotesLoad: (cb: (data: AppData, loadError: string | null) => void) => {
    ipcRenderer.once("notes:load", (_event, data, loadError) =>
      cb(data, loadError),
    );
  },
  removeNotesLoadListener: () => {
    ipcRenderer.removeAllListeners("notes:load");
  },
  onVoiceResult: (cb: (text: string | null, error?: string) => void) => {
    ipcRenderer.on("voice:result", (_event, text, error) => cb(text, error));
  },
  onHotkeyToggleEditMode: (cb: () => void) => {
    ipcRenderer.on("hotkey:toggleEditMode", () => cb());
  },
  onHotkeyStartVoiceNote: (cb: () => void) => {
    ipcRenderer.on("hotkey:startVoiceNote", () => cb());
  },

  // Renderer → Main invocations
  saveNotes: (data: AppData): Promise<void> =>
    ipcRenderer.invoke("notes:save", data),
  setMode: (mode: WindowMode): Promise<void> =>
    ipcRenderer.invoke("window:setMode", mode),
  transcribeAudio: (audioBuffer: Float32Array): Promise<void> =>
    ipcRenderer.invoke("voice:transcribe", audioBuffer),
  updateHotkeys: (hotkeys: Hotkeys): Promise<void> =>
    ipcRenderer.invoke("hotkeys:update", hotkeys),

  // Cleanup — removes only the listeners registered by this API
  removeVoiceAndHotkeyListeners: () => {
    ipcRenderer.removeAllListeners("voice:result");
    ipcRenderer.removeAllListeners("hotkey:toggleEditMode");
    ipcRenderer.removeAllListeners("hotkey:startVoiceNote");
  },
};

contextBridge.exposeInMainWorld("api", api);

export type ElectronAPI = typeof api;
