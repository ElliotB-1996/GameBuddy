# Game Overlay Notes App — Design Spec

**Date:** 2026-04-15
**Stack:** Electron + Vite + React + TypeScript

---

## Overview

A desktop overlay application for gamers that provides always-on-top note-taking while playing. The overlay is toggled via global hotkeys and supports a click-through view mode so it never interferes with gameplay. Notes are organized into per-game sections, persist across sessions, and can be created via keyboard/mouse or voice transcription (local Whisper model, fully offline).

---

## Architecture

### Process Structure

- **Main process** — owns window lifecycle, global hotkey registration, file I/O, and Whisper transcription (in a worker thread)
- **Renderer process** — React/Vite UI, handles all display and user interaction
- **Preload script** — exposes a typed `contextBridge` API; renderer never accesses Node APIs directly

### IPC Channels (typed)

| Channel | Direction | Purpose |
|---|---|---|
| `notes:load` | main → renderer | Send full notes state on startup |
| `notes:save` | renderer → main | Persist updated notes/settings to disk |
| `window:setMode` | renderer → main | Switch between view/edit mode |
| `voice:transcribe` | renderer → main | Send finished audio buffer for transcription |
| `voice:result` | main → renderer | Return transcribed text |
| `voice:progress` | main → renderer | Model download progress (first run) |
| `hotkeys:update` | renderer → main | Re-register global shortcuts after settings change |

---

## Window Behaviour

- Frameless, always-on-top, semi-transparent background
- **View mode** — `setIgnoreMouseEvents(true, { forward: true })`, overlay visible but all clicks pass through to the game
- **Edit mode** — `setIgnoreMouseEvents(false)`, fully interactive
- Mode indicator in the UI shows current state at a glance (`● VIEW` / `● EDIT`)

---

## Global Hotkeys

Three configurable hotkeys, stored in `settings.hotkeys`. Re-registered via `globalShortcut` whenever changed.

| Action | Default |
|---|---|
| Show / hide overlay | `Alt+Shift+N` |
| Toggle view / edit mode | `Alt+Shift+E` |
| Start / stop voice note | `Alt+Shift+V` |

---

## Data Model

Stored at `app.getPath('userData')/notes.json`.

```json
{
  "settings": {
    "hotkeys": {
      "toggleVisibility": "Alt+Shift+N",
      "toggleEditMode": "Alt+Shift+E",
      "startVoiceNote": "Alt+Shift+V"
    }
  },
  "sections": [
    {
      "id": "uuid",
      "name": "Game Name",
      "notes": [
        {
          "id": "uuid",
          "type": "text" | "checklist",
          "content": "string (text) | { items: { id, text, checked }[] } (checklist)",
          "createdAt": "ISO 8601",
          "updatedAt": "ISO 8601"
        }
      ]
    }
  ]
}
```

- Notes within a section are displayed sorted by `updatedAt` descending (most recently edited first)
- Sections and notes use UUIDs so renames never break references

---

## UI Layout

```
┌─────────────────────────────────────────┐
│ [Section A] [Section B] [+]  ⚙  [●EDIT] │  ← tab bar + settings icon + mode indicator
├─────────────────────────────────────────┤
│ [+ Add note]              [🎤 Record]   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Note content / preview...           │ │  ← most recent first
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ☐ Checklist item 1                  │ │
│ │ ☑ Checklist item 2                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

- **Tab bar** — click to switch sections; `[+]` opens inline input to add a new section; double-click a tab to rename it
- **Settings panel** (gear icon) — rebind hotkeys by clicking a field and pressing the new combination
- **Note cards** — editable in-place when in edit mode; read-only in view mode
- **Voice button / hotkey** — toggles recording; transcribed text creates a new text note in the active section

---

## Voice Transcription

- Library: `@xenova/transformers` (ONNX runtime, no Python or system dependencies)
- Model: Whisper `tiny` (~75 MB), downloaded to `userData` on first use with a progress indicator
- Transcription runs in a **Node.js worker thread** to keep the UI responsive
- Audio captured via Web Audio API in the renderer, sent as a buffer over IPC to the main process
- On failure (no mic, transcription error) a non-blocking toast is shown; the note is not created

---

## Settings Panel

Accessible via the gear icon. Supports:
- Rebinding all three hotkeys (click field → press combo → save)
- Adding and renaming sections (also available inline from the tab bar)

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `notes.json` missing on startup | Create with empty sections and default hotkeys |
| `notes.json` corrupted | Show error toast, fall back to empty state (do not overwrite until user makes a change) |
| Hotkey already registered by OS/another app | Show warning in settings, keep previous binding |
| Microphone permission denied | Toast error, voice button disabled until permission granted |
| Whisper download fails | Toast error with retry button |
| Transcription fails | Toast error, no note created |
