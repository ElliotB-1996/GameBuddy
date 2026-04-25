# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Run lint as you go and fix any warnings immediately

Write unit tests for each task as you implement it, but only run the full test suite at the end of a feature (not after every task)

Always create todo lists to track progress

Run `npm audit` before merging any branch that adds or updates dependencies. If vulnerabilities are found, investigate whether a non-breaking fix exists before reaching for `--force`.

## Project Overview

**Game Overlay Notes** — An Electron + React + TypeScript desktop app providing two always-on-top transparent overlay windows: a notes overlay for taking notes while gaming, and a keybinds dashboard displaying Azeron keypad profiles. Key features: voice-to-text (Whisper via `@huggingface/transformers`), view/edit modes, global hotkeys, system tray integration, and persistent local JSON storage.

## Commands

```bash
npm run dev          # Start dev server (electron-vite)
npm run build        # Typecheck + build
npm run build:win    # Build Windows installer

npm run lint         # ESLint with cache
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # Run both typecheck:node and typecheck:web

npm test             # Run all tests once (vitest run)
npm run test:watch   # Run tests in watch mode

# Run a single test file:
npx vitest run tests/main/hotkeys-handler.test.ts

npm run download-model   # Download Whisper model to resources/models/
```

## Architecture

The app follows the standard Electron 3-process model with strict IPC boundaries.

### Windows

Two always-on-top, frameless, transparent, skipTaskbar windows:
- **Notes window** (420×680) — starts visible, notes overlay
- **Keybinds window** (1100×700) — starts hidden, Azeron keypad reference dashboard

Each window has its own preload:
- `src/preload/index.ts` → exposes `window.api` to the notes renderer
- `src/preload/keybinds.ts` → exposes `window.keybindsApi` to the keybinds renderer

**Main process** (`src/main/`): Window creation, system tray, global hotkeys, file I/O, voice transcription in a Worker thread. IPC handlers live in `src/main/ipc/` (notes, window, hotkeys, keybinds, voice).

**Renderer — notes** (`src/renderer/src/`): React app. `App.tsx` owns top-level state. `useNotes` hook manages all note/section/settings state. `useAudio` hook manages MediaRecorder → PCM pipeline for voice.

**Renderer — keybinds** (`src/renderer/keybinds/src/`): Peripherals-map React app. Displays Azeron Cyborg and Cyro keybind profiles from built-in JSON data and imported `.rewasd` files. See `src/renderer/keybinds/CLAUDE.md` for details.

### Data flow

- **Startup**: Main loads `userData/notes.json` → sends to renderer via `notes:load` event
- **Saves**: React state → 500ms debounced `window.api.saveNotes()` → main writes disk
- **Voice**: `useAudio` records WebM → decodes to PCM Float32Array at 16kHz → `window.api.transcribeAudio()` → Worker thread runs Whisper → `voice:result` event → note added
- **Mode toggle**: UI/hotkey → `window.api.setMode()` → main updates `setIgnoreMouseEvents` + opacity → tray updates

### IPC patterns

Both windows follow the same pattern:
1. Main loads data from file at startup
2. After `did-finish-load`, main sends data via `channel:load`
3. Renderer receives via `ipcRenderer.once` (preload wraps this)
4. Save/delete go via `ipcMain.handle`

| Channel | Direction | Description |
|---------|-----------|-------------|
| `notes:load` | Main → Notes renderer | Sends initial `AppData` |
| `notes:save` | Notes renderer → Main | Persists full `AppData` |
| `keybinds:load` | Main → Keybinds renderer | Sends initial `Profile[]` |
| `keybinds:save` | Keybinds renderer → Main | Upserts one `Profile` |
| `keybinds:delete` | Keybinds renderer → Main | Removes one profile by id |

### File stores

- `src/main/store/notes-store.ts` — reads/writes `userData/notes.json` (full `AppData`)
- `src/main/store/profiles-store.ts` — reads/writes `userData/profiles.json` (`Profile[]`)

Both use synchronous `fs.readFileSync` / `fs.writeFileSync`.

### Key files

| File | Purpose |
|------|---------|
| `src/renderer/src/types.ts` | Single source of truth for all TypeScript interfaces (`AppData`, `Section`, `Note`, `Hotkeys`, `Appearance`) |
| `src/main/store/notes-store.ts` | Loads/saves `notes.json`, merges with defaults for forward-compat |
| `src/main/store/profiles-store.ts` | Loads/saves `profiles.json` (imported reWASD profiles) |
| `src/main/voice/whisper-worker.ts` | Worker thread running Whisper; stubs `sharp` to avoid Windows DLL issues |
| `src/main/ipc/hotkeys-handler.ts` | Validates accelerator strings, registers `globalShortcut` for both windows |
| `src/main/ipc/window-handler.ts` | View mode = `setIgnoreMouseEvents(true)` (clicks pass through to game); Edit mode = normal |
| `src/main/ipc/keybinds-handler.ts` | IPC handlers for keybinds profile load/save/delete |

## Testing

Tests live in `tests/` mirroring the `src/` structure:
- `tests/main/` — main process unit tests (Vitest, mocked electron)
- `tests/renderer/` — React component and hook tests (Vitest + React Testing Library, jsdom)
- Setup file: `tests/renderer/setup.ts`

Electron modules are mocked in tests; do not import real `electron` in renderer code.

## Important Constraints

- `@huggingface/transformers` is marked external in `electron.vite.config.ts` and loaded at runtime, not bundled. The `postinstall` script patches it for Windows compatibility (see memory for details).
- Whisper model files live in `resources/models/Xenova/whisper-small/` and are unpacked to disk by `electron-builder` (configured in `electron-builder.yml`). The model path is passed from main to the worker thread.
- Two separate `tsconfig` files: `tsconfig.node.json` (main/preload, Node target) and `tsconfig.web.json` (renderer, browser target). Run the matching typecheck when editing each side.
- ESLint uses flat config (`eslint.config.mjs`). The `tests/` directory is excluded from linting.
