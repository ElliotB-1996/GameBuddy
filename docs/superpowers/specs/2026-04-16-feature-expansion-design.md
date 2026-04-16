# Feature Expansion Design

**Date:** 2026-04-16
**Project:** game-overlay-notes

## Overview

Three features are added to the game overlay notes app:

1. Appearance settings — granular UI theming via CSS custom properties
2. Voice note in view mode — hotkey-triggered recording with a pulsing indicator
3. System tray icon — show/hide, edit mode toggle, and quit

---

## 1. Appearance Settings

### Data Model

A new `Appearance` interface is added to `src/renderer/src/types.ts` and included in `AppData`:

```ts
export interface Appearance {
  bgColor: string;          // hex, e.g. "#1e2330"
  headerColor: string;      // hex
  accentColor: string;      // hex
  textColor: string;        // hex
  noteColor: string;        // hex, note card background
  fontSize: number;         // px, range 10–20
  viewOpacity: number;      // 0.2–1.0
  editOpacity: number;      // 0.5–1.0
}

export interface AppData {
  settings: Settings;
  appearance: Appearance;
  sections: Section[];
}
```

Defaults match the current dark theme so existing users see no change on first load.

### CSS Custom Properties

A `applyTheme(appearance: Appearance)` utility function in `src/renderer/src/utils/theme.ts` writes values to `document.documentElement`:

```
--overlay-bg        → appearance.bgColor
--overlay-header    → appearance.headerColor
--overlay-accent    → appearance.accentColor
--overlay-text      → appearance.textColor
--overlay-note      → appearance.noteColor
--overlay-font-size → appearance.fontSize + "px"
```

Opacity is applied separately to the Electron window via `win.setOpacity()` through IPC — the renderer sends the appropriate value (`viewOpacity` or `editOpacity`) when mode changes and on initial load.

All hardcoded colours in component inline styles are migrated to `var(--overlay-*)` references. The `overlay.css` file defines the same values as fallbacks.

`applyTheme()` is called:
- On initial load (after `AppData` is received)
- On every appearance change in the settings panel (live preview)

### SettingsPanel — Appearance Tab

The existing `SettingsPanel` gains a tab bar with three tabs: **Hotkeys**, **Audio**, **Appearance**.

The Appearance tab contains:

| Control | Type | Range/Notes |
|---|---|---|
| Background colour | `<input type="color">` | hex |
| Header colour | `<input type="color">` | hex |
| Accent colour | `<input type="color">` | hex |
| Text colour | `<input type="color">` | hex |
| Note card colour | `<input type="color">` | hex |
| Font size | number input | 10–20 px |
| Opacity (view mode) | slider | 0.2–1.0 |
| Opacity (edit mode) | slider | 0.5–1.0 |

Changes apply live with no explicit save button, using the existing debounced-save pattern.

---

## 2. Voice Note in View Mode

### Change

The `onHotkeyStartVoiceNote` handler in `App.tsx` currently fires `voiceToggleRef.current()` unconditionally — but `handleVoiceToggle` has an implicit guard: when `audioState === "idle"`, it checks `sectionId` before calling `startRecording`. This is sufficient; no mode guard needs to be added or removed.

The `VoiceButton` component continues to render only in edit mode — no visual change in view mode.

### Recording Indicator

A pulsing red dot is rendered in the overlay header when `audioState === "recording"`, regardless of mode. It sits on the right side of the header alongside the settings gear and mode indicator.

Implementation: a small `<span>` with a CSS `@keyframes` pulse animation (opacity or scale). It is conditionally rendered: `{audioState === "recording" && <RecordingDot />}`.

This gives the user clear feedback that recording is active even when no `VoiceButton` is visible.

---

## 3. System Tray Icon

### Main Process

A `Tray` instance is created in `src/main/index.ts` after the main window is ready. The tray icon image is a 16×16 (or 32×32) PNG at `resources/tray-icon.png`. In dev it is resolved relative to the project root; in production it is resolved via `process.resourcesPath`. The `electron-builder` config in `package.json` gains a second `extraResources` entry to copy `resources/tray-icon.png` → `tray-icon.png` alongside the existing models entry.

### Context Menu

```
[ Show / Hide ]         — win.show() / win.hide()
[ Edit Mode / View Mode ] — label reflects current state; sends IPC to renderer
[ Quit ]                — app.quit()
```

### Show / Hide

`win.hide()` removes the window from the taskbar and screen entirely. `win.show()` restores it. The tray icon persists while the app is running regardless of window visibility.

### Edit Mode Toggle

The tray menu item calls `win.webContents.send('hotkey-toggle-edit-mode')`, reusing the existing hotkey IPC channel already handled in the renderer. When the renderer's mode changes (via any mechanism — hotkey, button, or tray), it sends `ipcRenderer.send('mode-changed', newMode)` back to main so the tray menu label stays in sync.

### Tooltip

The tray icon tooltip shows the current mode: `"Overlay — View Mode"` or `"Overlay — Edit Mode"`.

### IPC Channels Added

| Channel | Direction | Payload | Purpose |
|---|---|---|---|
| `mode-changed` | renderer → main | `'view' \| 'edit'` | Sync tray label and window opacity |
| `set-opacity` | renderer → main | `number` | Set `win.setOpacity()` |

---

## Testing

- Unit tests for `applyTheme()` — verify correct CSS variable assignment for given `Appearance` values
- Unit tests for `useNotes` — verify `appearance` field is included in `getAppData()` output
- Unit test for tray menu construction — verify menu items and labels given mode state
- Integration: voice hotkey fires in view mode and a toast + recording dot appear

---

## Files Changed

| File | Change |
|---|---|
| `src/renderer/src/types.ts` | Add `Appearance` interface, add to `AppData` |
| `src/renderer/src/utils/theme.ts` | New — `applyTheme()` utility |
| `src/renderer/src/components/SettingsPanel.tsx` | Add tabs, add Appearance tab UI |
| `src/renderer/src/components/RecordingDot.tsx` | New — pulsing indicator |
| `src/renderer/src/App.tsx` | Render `RecordingDot`, send `mode-changed` / `set-opacity` IPC, pass appearance to `useNotes` |
| `src/renderer/src/hooks/useNotes.ts` | Store and expose `appearance`, include in `getAppData()` |
| `src/renderer/src/styles/overlay.css` | Add CSS variable defaults |
| `src/main/index.ts` | Create `Tray`, handle `mode-changed` and `set-opacity` IPC |
| `src/preload/index.ts` + `index.d.ts` | Expose new IPC channels |
| `resources/tray-icon.png` | New — tray icon asset |
