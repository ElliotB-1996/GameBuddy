import { ipcMain, app } from "electron";
import { join } from "path";
import { loadProfiles, saveProfiles } from "../store/profiles-store";
import type { Profile } from "../../renderer/keybinds/src/data/types";

export function registerKeybindsHandlers(): {
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
    saveProfiles(
      PROFILES_PATH,
      current.filter((p) => p.id !== id),
    );
  });

  return { initialProfiles: data };
}
