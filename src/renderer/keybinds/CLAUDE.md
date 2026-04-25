# CLAUDE.md — Keybinds Renderer

Guidance for working in `src/renderer/keybinds/src/`.

## Architecture

React + TypeScript SPA that renders Azeron Cyborg and Cyro keybind profiles. Profile data comes from the Electron main process over IPC (not IndexedDB) — `db.ts` uses `window.keybindsApi`. Built-in profiles are loaded at build time via `import.meta.glob` in `data/profiles.ts`; imported reWASD profiles are persisted to `userData/profiles.json` via IPC.

## Data model (`src/data/types.ts`)

- `Profile` — one device's keybind layout. Has `layers.default` (required) and optionally `layers.shift`. `pairId` links a Cyborg and Cyro profile from the same reWASD file.
- `Layer` — `Record<string, Button>` where keys are **Azeron button numbers** (not reWASD button IDs).
- `Button` — `{ zone, label, bindings: { single?, long?, double? } }`
- `Zone` — `'app' | 'terminal' | 'edit' | 'nav' | 'git' | 'mouse' | 'system' | 'thumb' | 'unzoned'`
- `RadialMenu` / `RadialAction` — nested radial menu structure

## Layout (`src/data/layout.ts`)

`CYBORG_GRID` and `CYRO_GRID` define physical button positions as 2D arrays of Azeron button number strings. Button IDs in `Layer` objects must match these strings exactly for buttons to appear in the grid.

## reWASD parser (`src/importers/parseRewasd.ts`)

Handles two mapping styles from `.rewasd` files:

- **Description-based** (e.g. VSCode profiles): `"Cyborg #N - Label KeyCombo"` — regex extracts device, button number, label, binding directly.
- **Mask-based** (e.g. WoW profiles): button identity from `masks[].set[].{deviceId, buttonId}`, binding from `macros[].keyboard.description` (DIK_ key names).

**Critical:** reWASD uses different button numbering from Azeron. `CYBORG_BTN` and `CYRO_BTN` lookup tables in the parser translate reWASD `buttonId` → Azeron button number. See the Obsidian skill at `references/button-id-mapping.md` for the full table.

## IPC (`src/db.ts`)

Replaces idb. Three functions backed by `window.keybindsApi`:
- `loadImportedProfiles()` — resolves when main sends `keybinds:load`
- `saveProfile(profile)` — upserts via `keybinds:save`
- `deleteProfile(id)` — removes via `keybinds:delete`

The `window.keybindsApi` type is declared in `src/env.d.ts` and backed by `src/preload/keybinds.ts`.
