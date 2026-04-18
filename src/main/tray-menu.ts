import type { MenuItemConstructorOptions } from "electron";

export type TrayMode = "view" | "edit";

export function buildTrayMenuItems(
  isVisible: boolean,
  mode: TrayMode,
  onToggleVisibility: () => void,
  onToggleMode: () => void,
  onQuit: () => void,
): MenuItemConstructorOptions[] {
  return [
    {
      label: isVisible ? "Hide Overlay" : "Show Overlay",
      click: onToggleVisibility,
    },
    {
      label: mode === "view" ? "Switch to Edit Mode" : "Switch to View Mode",
      click: onToggleMode,
    },
    { type: "separator" },
    { label: "Quit", click: onQuit },
  ];
}
