# Keybinds Dashboard Integration Design

**Date:** 2026-04-25
**Status:** Approved

## Overview

Add a second always-on-top overlay window to the app — a keybinds reference dashboard that surfaces the full peripherals-map UI (Azeron Cyborg + Cyro profile tabs, device grids, radial menus, reWASD import). The existing notes overlay is unchanged. The new window is toggled independently via a global hotkey and a tray menu entry.

## Architecture

Two `BrowserWindow` instances in the main process:

- **`notesWindow`** — existing, 420×680, unchanged
- **`keybindsWindow`** — new, 1100×700, always-on-top, frameless, transparent, same window style as notes

electron-vite supports multiple renderer entries. The notes renderer stays at `src/renderer/` untouched. The keybinds renderer is a second entry at `src/renderer/keybinds/`, with its own `index.html`, React root, and preload script.

`idb` is dropped from the keybinds renderer. Profile persistence follows the existing notes pattern: a `profiles-store.ts` in main reads/writes `userData/profiles.json` via `fs`, and the renderer communicates with it over IPC. This is consistent with `notes-store.ts` and requires no browser storage APIs.

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `electron.vite.config.ts` | Add second renderer entry + preload entry for keybinds window |
| Modify | `package.json` (build section) | Include keybinds renderer output in electron-builder bundle |
| Create | `src/renderer/keybinds/index.html` | Entry HTML for keybinds window |
| Create | `src/renderer/keybinds/src/` | peripherals-map `app/src/` copied here |
| Modify | `src/renderer/keybinds/src/db.ts` | Replace idb calls with `window.keybindsApi.*` IPC calls |
| Create | `src/preload/keybinds.ts` | Exposes `profiles:load/save/delete` IPC to keybinds renderer via contextBridge |
| Create | `src/main/store/profiles-store.ts` | `loadProfiles` / `saveProfiles` — file-based, same pattern as `notes-store.ts` |
| Create | `src/main/ipc/keybinds-handler.ts` | Registers `profiles:load`, `profiles:save`, `profiles:delete` IPC handlers |
| Modify | `src/main/ipc/hotkeys-handler.ts` | Add `toggleKeybinds` hotkey that shows/hides `keybindsWindow` |
| Modify | `src/main/index.ts` | Create `keybindsWindow`, register keybinds handlers, update tray |
| Modify | `src/main/tray-menu.ts` | Add "Show/Hide Keybinds" entry |
| Modify | `src/renderer/src/types.ts` | Add `toggleKeybinds: string` to `Hotkeys` interface |
| Modify | `src/main/store/notes-store.ts` | Add `toggleKeybinds` default (`"Alt+Shift+K"`) to `DEFAULT_APP_DATA` |
| Modify | `src/renderer/src/components/SettingsPanel.tsx` | Add `toggleKeybinds` hotkey field |
| Create | `CLAUDE.md` | Root — covers Electron architecture, IPC patterns, window management, tray |
| Create | `src/renderer/keybinds/CLAUDE.md` | Keybinds renderer — covers profile format, button ID mapping, zone system, parser |

## IPC Channels

### Keybinds window (new)

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `keybinds:load` | Main → Renderer | `Profile[]` | Sent after window finishes loading |
| `keybinds:save` | Renderer → Main | `Profile` | Upserts one profile to profiles.json |
| `keybinds:delete` | Renderer → Main | `string` (id) | Removes one profile from profiles.json |

### Notes window (existing, unchanged)

No changes to existing IPC channels.

## Profile Store

`src/main/store/profiles-store.ts` follows the `notes-store` pattern exactly:

```typescript
// userData/profiles.json — array of imported Profile objects
export function loadProfiles(filePath: string): { data: Profile[]; error: string | null }
export function saveProfiles(filePath: string, profiles: Profile[]): void
```

`keybinds-handler.ts` loads profiles at startup and registers handlers:

```typescript
export function registerKeybindsHandlers(win: BrowserWindow): { initialProfiles: Profile[] }
```

After `win` finishes loading, main sends `keybinds:load` with `initialProfiles`. The renderer's `db.ts` replacement listens for this event and populates state — same pattern as `notes:load`.

## Hotkeys

`toggleKeybinds` is added to the existing `Hotkeys` interface and configured in the notes settings panel alongside the other three hotkeys. Default: `"Alt+Shift+K"`.

`registerGlobalHotkeys` signature expands to `(notesWin: BrowserWindow, keybindsWin: BrowserWindow, hotkeys: Hotkeys)` and registers the fourth shortcut to show/hide `keybindsWin`.

## Tray

`buildTrayMenuItems` gains a `keybindsVisible` boolean parameter and a `onToggleKeybinds` callback. The tray menu gains a "Show Keybinds" / "Hide Keybinds" entry below the existing "Show Overlay" / "Hide Overlay" entry.

## electron-vite Config

electron-vite's multi-window support uses multiple `rollupOptions.input` entries in a single renderer config, not an array of renderer configs:

```typescript
renderer: {
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@keybinds': resolve('src/renderer/keybinds/src'),
    },
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve('src/renderer/index.html'),
        keybinds: resolve('src/renderer/keybinds/index.html'),
      },
    },
  },
},
```

Preload gains a second entry (currently uses the default single-entry convention, needs explicit input map):

```typescript
preload: {
  plugins: [externalizeDepsPlugin()],
  build: {
    rollupOptions: {
      input: {
        index: resolve('src/preload/index.ts'),
        keybinds: resolve('src/preload/keybinds.ts'),
      },
    },
  },
},
```

`keybindsWindow` in main specifies its own preload:

```typescript
webPreferences: {
  preload: join(__dirname, '../preload/keybinds.js'),
  sandbox: false,
}
```

## CLAUDE.md Strategy

Two files:

- **`CLAUDE.md`** (root) — Electron architecture, IPC patterns, window lifecycle, tray, hotkeys, voice, notes store, build/dev commands
- **`src/renderer/keybinds/CLAUDE.md`** — Profile data model, reWASD parser (description-based vs mask-based), button ID translation tables, zone system, layout grid, component responsibilities

## Out of Scope

- Active window detection / auto profile switching (deferred — separate feature)
- Sharing state between notes and keybinds windows at runtime
- Keybinds window opacity/appearance settings (uses its own CSS, not the notes theme system)
