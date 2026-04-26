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
  onActiveApp: (cb: (processName: string) => void) => {
    ipcRenderer.on("keybinds:active-app", (_event, processName: string) =>
      cb(processName),
    );
  },
  removeActiveAppListener: () => {
    ipcRenderer.removeAllListeners("keybinds:active-app");
  },
};

contextBridge.exposeInMainWorld("keybindsApi", keybindsApi);

export type KeybindsAPI = typeof keybindsApi;
