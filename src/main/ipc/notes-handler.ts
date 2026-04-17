import { ipcMain, app } from "electron";
import { join } from "path";
import { loadNotes, saveNotes } from "../store/notes-store";
import type { AppData } from "../../renderer/src/types";

export function registerNotesHandlers(): {
  initialData: AppData;
  loadError: string | null;
} {
  const NOTES_PATH = join(app.getPath("userData"), "notes.json");
  const { data, error } = loadNotes(NOTES_PATH);

  ipcMain.handle("notes:save", (_event, appData: AppData) => {
    saveNotes(NOTES_PATH, appData);
  });

  return { initialData: data, loadError: error };
}
