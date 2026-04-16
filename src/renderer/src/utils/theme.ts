import type { Appearance } from "../types";

export function applyTheme(appearance: Appearance): void {
  const root = document.documentElement;
  root.style.setProperty("--overlay-bg", appearance.bgColor);
  root.style.setProperty("--overlay-header", appearance.headerColor);
  root.style.setProperty("--overlay-accent", appearance.accentColor);
  root.style.setProperty("--overlay-text", appearance.textColor);
  root.style.setProperty("--overlay-note", appearance.noteColor);
  root.style.setProperty("--overlay-font-size", `${appearance.fontSize}px`);
}