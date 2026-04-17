import type { ElectronAPI } from "../../src/preload/index";

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
