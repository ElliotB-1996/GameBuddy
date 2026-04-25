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
