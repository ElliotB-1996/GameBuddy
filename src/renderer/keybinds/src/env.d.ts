import type { KeybindsAPI } from "../../../preload/keybinds";

declare global {
  interface Window {
    keybindsApi: KeybindsAPI;
  }
}
