# Game Overlay Notes App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an always-on-top Electron overlay app for gamers to take text/checklist notes organized by game section, with hotkey show/hide, click-through view mode, and offline voice transcription via a local Whisper model.

**Architecture:** Single frameless Electron window (always-on-top) with view mode (click-through via `setIgnoreMouseEvents`) and edit mode (interactive), toggled by a global hotkey. Main process owns file I/O, hotkey registration, and Whisper transcription (worker thread). React renderer owns all UI. Communication via typed IPC channels through a contextBridge preload script.

**Tech Stack:** Electron 28+, electron-vite, React 18, TypeScript, @xenova/transformers (Whisper tiny), uuid, Vitest, @testing-library/react, jsdom

---

## File Structure

```
src/
  main/
    index.ts                    # BrowserWindow creation, app lifecycle, IPC wiring
    ipc/
      notes-handler.ts          # notes:load + notes:save IPC handlers
      window-handler.ts         # window:setMode IPC handler
      hotkeys-handler.ts        # hotkeys:update + globalShortcut management
    store/
      notes-store.ts            # JSON read/write, default state, error recovery
    voice/
      voice-handler.ts          # voice:transcribe IPC handler, spawns worker
      whisper-worker.ts         # Worker thread: runs @xenova/transformers
  preload/
    index.ts                    # Typed contextBridge API
  renderer/
    index.html
    src/
      main.tsx                  # React entry point
      App.tsx                   # Root: layout, IPC wiring, app state
      types.ts                  # Shared TS types
      hooks/
        useNotes.ts             # Notes/section CRUD state
        useAudio.ts             # Web Audio API recording
      components/
        TabBar.tsx
        NoteList.tsx
        NoteCard.tsx
        TextNote.tsx
        ChecklistNote.tsx
        VoiceButton.tsx
        ModeIndicator.tsx
        SettingsPanel.tsx
        Toast.tsx
      styles/
        overlay.css             # Semi-transparent overlay styles
tests/
  main/
    notes-store.test.ts
    hotkeys-handler.test.ts
  renderer/
    setup.ts
    useNotes.test.ts
    TabBar.test.tsx
    NoteCard.test.tsx
    SettingsPanel.test.tsx
electron.vite.config.ts
vitest.config.ts
electron-builder.yml
```

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `electron.vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `electron-builder.yml`

- [ ] **Step 1: Scaffold with electron-vite**

```bash
cd /mnt/c/Users/ellio/Documents/ClaudeTesting
npm create @quick-start/electron@latest . -- --template react-ts
```

When prompted about the existing directory, choose to proceed. This creates the standard electron-vite project structure.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install uuid @xenova/transformers
npm install --save-dev @types/uuid vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Update `electron.vite.config.ts` to externalize @xenova/transformers and configure renderer**

Replace the entire file with:

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: [] })],
    build: {
      rollupOptions: {
        external: ['@xenova/transformers']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/renderer/setup.ts'],
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  }
})
```

- [ ] **Step 5: Create `tests/renderer/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

In the `"scripts"` section of `package.json`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify the scaffold builds**

```bash
npm run dev
```

Expected: Electron window opens with the default react-ts template UI. Close it.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold electron-vite react-ts project with dependencies"
```

---

## Task 2: Shared TypeScript types

**Files:**
- Create: `src/renderer/src/types.ts`

- [ ] **Step 1: Create `src/renderer/src/types.ts`**

```typescript
export interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export interface TextNote {
  id: string
  type: 'text'
  content: string
  createdAt: string
  updatedAt: string
}

export interface ChecklistNote {
  id: string
  type: 'checklist'
  content: ChecklistItem[]
  createdAt: string
  updatedAt: string
}

export type Note = TextNote | ChecklistNote

export interface Section {
  id: string
  name: string
  notes: Note[]
}

export interface Hotkeys {
  toggleVisibility: string
  toggleEditMode: string
  startVoiceNote: string
}

export interface Settings {
  hotkeys: Hotkeys
}

export interface AppData {
  settings: Settings
  sections: Section[]
}

export type WindowMode = 'view' | 'edit'

export interface ToastMessage {
  id: string
  type: 'error' | 'info' | 'success'
  message: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Notes store (JSON persistence)

**Files:**
- Create: `src/main/store/notes-store.ts`
- Create: `tests/main/notes-store.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/main/notes-store.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { loadNotes, saveNotes, DEFAULT_APP_DATA } from '../../src/main/store/notes-store'
import type { AppData } from '../../src/renderer/src/types'

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'notes-test-'))
})

describe('loadNotes', () => {
  it('returns default data when file does not exist', () => {
    const result = loadNotes(join(tempDir, 'nonexistent.json'))
    expect(result.data).toEqual(DEFAULT_APP_DATA)
    expect(result.error).toBeNull()
  })

  it('returns parsed data when file exists and is valid', () => {
    const filePath = join(tempDir, 'notes.json')
    const data: AppData = {
      ...DEFAULT_APP_DATA,
      sections: [{ id: '1', name: 'TestGame', notes: [] }]
    }
    writeFileSync(filePath, JSON.stringify(data), 'utf-8')
    const result = loadNotes(filePath)
    expect(result.data).toEqual(data)
    expect(result.error).toBeNull()
  })

  it('returns default data and error message when file is corrupted', () => {
    const filePath = join(tempDir, 'notes.json')
    writeFileSync(filePath, 'not-valid-json', 'utf-8')
    const result = loadNotes(filePath)
    expect(result.data).toEqual(DEFAULT_APP_DATA)
    expect(result.error).toMatch(/corrupted/)
  })
})

describe('saveNotes', () => {
  it('writes JSON to the given path', () => {
    const filePath = join(tempDir, 'notes.json')
    saveNotes(filePath, DEFAULT_APP_DATA)
    const result = loadNotes(filePath)
    expect(result.data).toEqual(DEFAULT_APP_DATA)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: FAIL — cannot find module `../../src/main/store/notes-store`

- [ ] **Step 3: Create `src/main/store/notes-store.ts`**

```typescript
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { AppData } from '../../renderer/src/types'

export const DEFAULT_APP_DATA: AppData = {
  settings: {
    hotkeys: {
      toggleVisibility: 'Alt+Shift+N',
      toggleEditMode: 'Alt+Shift+E',
      startVoiceNote: 'Alt+Shift+V'
    }
  },
  sections: []
}

export function loadNotes(filePath: string): { data: AppData; error: string | null } {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as AppData
    return { data, error: null }
  } catch (err: unknown) {
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { data: structuredClone(DEFAULT_APP_DATA), error: null }
    }
    return {
      data: structuredClone(DEFAULT_APP_DATA),
      error: 'Notes file is corrupted. Starting with empty state.'
    }
  }
}

export function saveNotes(filePath: string, data: AppData): void {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: PASS — all 4 tests green

- [ ] **Step 5: Commit**

```bash
git add src/main/store/notes-store.ts tests/main/notes-store.test.ts
git commit -m "feat: add notes store with JSON persistence and error recovery"
```

---

## Task 4: Main process entry point and IPC handlers

**Files:**
- Modify: `src/main/index.ts`
- Create: `src/main/ipc/notes-handler.ts`
- Create: `src/main/ipc/window-handler.ts`

- [ ] **Step 1: Create `src/main/ipc/notes-handler.ts`**

```typescript
import { ipcMain, app } from 'electron'
import { join } from 'path'
import { loadNotes, saveNotes } from '../store/notes-store'
import type { AppData } from '../../renderer/src/types'

const NOTES_PATH = join(app.getPath('userData'), 'notes.json')

export function registerNotesHandlers(): { initialData: AppData; loadError: string | null } {
  const { data, error } = loadNotes(NOTES_PATH)

  ipcMain.handle('notes:save', (_event, appData: AppData) => {
    saveNotes(NOTES_PATH, appData)
  })

  return { initialData: data, loadError: error }
}
```

- [ ] **Step 2: Create `src/main/ipc/window-handler.ts`**

```typescript
import { ipcMain, BrowserWindow } from 'electron'

export function registerWindowHandlers(win: BrowserWindow): void {
  ipcMain.handle('window:setMode', (_event, mode: 'view' | 'edit') => {
    if (mode === 'view') {
      win.setIgnoreMouseEvents(true, { forward: true })
    } else {
      win.setIgnoreMouseEvents(false)
    }
  })
}
```

- [ ] **Step 3: Replace `src/main/index.ts` with the full main process**

```typescript
import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerNotesHandlers } from './ipc/notes-handler'
import { registerWindowHandlers } from './ipc/window-handler'
import { registerHotkeyHandlers, registerGlobalHotkeys, unregisterGlobalHotkeys } from './ipc/hotkeys-handler'

let mainWindow: BrowserWindow | null = null

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 420,
    height: 680,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.setIgnoreMouseEvents(true, { forward: true })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.gameoverlay.notes')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = createWindow()

  const { initialData, loadError } = registerNotesHandlers()
  registerWindowHandlers(mainWindow)
  registerHotkeyHandlers(mainWindow)

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow!.webContents.send('notes:load', initialData, loadError)
  })

  registerGlobalHotkeys(mainWindow, initialData.settings.hotkeys)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  unregisterGlobalHotkeys()
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 4: Verify the app still launches**

```bash
npm run dev
```

Expected: Electron app opens (may be transparent/invisible since overlay CSS not yet applied). No console errors in main process. Close it.

- [ ] **Step 5: Commit**

```bash
git add src/main/index.ts src/main/ipc/notes-handler.ts src/main/ipc/window-handler.ts
git commit -m "feat: add main process window setup and notes/window IPC handlers"
```

---

## Task 5: Hotkey handler

**Files:**
- Create: `src/main/ipc/hotkeys-handler.ts`
- Create: `tests/main/hotkeys-handler.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/main/hotkeys-handler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAccelerator } from '../../src/main/ipc/hotkeys-handler'

describe('buildAccelerator', () => {
  it('returns the accelerator string as-is', () => {
    expect(buildAccelerator('Alt+Shift+N')).toBe('Alt+Shift+N')
  })

  it('handles single key accelerators', () => {
    expect(buildAccelerator('F1')).toBe('F1')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: FAIL — cannot find module `../../src/main/ipc/hotkeys-handler`

- [ ] **Step 3: Create `src/main/ipc/hotkeys-handler.ts`**

```typescript
import { ipcMain, globalShortcut, BrowserWindow } from 'electron'
import type { Hotkeys } from '../../renderer/src/types'

/** Returns the accelerator string (identity function, exists for testability and future transforms) */
export function buildAccelerator(hotkey: string): string {
  return hotkey
}

export function registerGlobalHotkeys(win: BrowserWindow, hotkeys: Hotkeys): void {
  unregisterGlobalHotkeys()

  const register = (key: string, fn: () => void): boolean => {
    if (!key) return false
    return globalShortcut.register(buildAccelerator(key), fn)
  }

  register(hotkeys.toggleVisibility, () => {
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
    }
  })

  register(hotkeys.toggleEditMode, () => {
    win.webContents.send('hotkey:toggleEditMode')
  })

  register(hotkeys.startVoiceNote, () => {
    win.webContents.send('hotkey:startVoiceNote')
  })
}

export function unregisterGlobalHotkeys(): void {
  globalShortcut.unregisterAll()
}

export function registerHotkeyHandlers(win: BrowserWindow): void {
  ipcMain.handle('hotkeys:update', (_event, hotkeys: Hotkeys) => {
    registerGlobalHotkeys(win, hotkeys)
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: PASS — 2 tests green

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc/hotkeys-handler.ts tests/main/hotkeys-handler.test.ts
git commit -m "feat: add global hotkey registration and IPC handler"
```

---

## Task 6: Preload script

**Files:**
- Modify: `src/preload/index.ts`

- [ ] **Step 1: Replace `src/preload/index.ts` with the full contextBridge API**

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import type { AppData, Hotkeys, WindowMode } from '../renderer/src/types'

const api = {
  // Main → Renderer events
  onNotesLoad: (cb: (data: AppData, loadError: string | null) => void) => {
    ipcRenderer.on('notes:load', (_event, data, loadError) => cb(data, loadError))
  },
  onVoiceResult: (cb: (text: string | null) => void) => {
    ipcRenderer.on('voice:result', (_event, text) => cb(text))
  },
  onVoiceProgress: (cb: (progress: number) => void) => {
    ipcRenderer.on('voice:progress', (_event, progress) => cb(progress))
  },
  onHotkeyToggleEditMode: (cb: () => void) => {
    ipcRenderer.on('hotkey:toggleEditMode', () => cb())
  },
  onHotkeyStartVoiceNote: (cb: () => void) => {
    ipcRenderer.on('hotkey:startVoiceNote', () => cb())
  },

  // Renderer → Main invocations
  saveNotes: (data: AppData): Promise<void> => ipcRenderer.invoke('notes:save', data),
  setMode: (mode: WindowMode): Promise<void> => ipcRenderer.invoke('window:setMode', mode),
  transcribeAudio: (audioBuffer: Float32Array): Promise<void> =>
    ipcRenderer.invoke('voice:transcribe', audioBuffer),
  updateHotkeys: (hotkeys: Hotkeys): Promise<void> => ipcRenderer.invoke('hotkeys:update', hotkeys),

  // Cleanup
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
```

- [ ] **Step 2: Add global type declaration so renderer TypeScript knows about `window.api`**

Create `src/renderer/src/env.d.ts`:

```typescript
import type { ElectronAPI } from '../../preload'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
```

- [ ] **Step 3: Verify the project compiles**

```bash
npm run typecheck
```

Expected: No TypeScript errors (or only pre-existing template errors)

- [ ] **Step 4: Commit**

```bash
git add src/preload/index.ts src/renderer/src/env.d.ts
git commit -m "feat: add typed contextBridge preload API"
```

---

## Task 7: useNotes hook

**Files:**
- Create: `src/renderer/src/hooks/useNotes.ts`
- Create: `tests/renderer/useNotes.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/useNotes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotes } from '@renderer/hooks/useNotes'
import type { AppData } from '@renderer/types'

const baseData: AppData = {
  settings: { hotkeys: { toggleVisibility: 'Alt+Shift+N', toggleEditMode: 'Alt+Shift+E', startVoiceNote: 'Alt+Shift+V' } },
  sections: [{ id: 's1', name: 'Game A', notes: [] }]
}

describe('useNotes', () => {
  it('initializes with provided AppData', () => {
    const { result } = renderHook(() => useNotes(baseData))
    expect(result.current.sections).toHaveLength(1)
    expect(result.current.sections[0].name).toBe('Game A')
  })

  it('addSection adds a new section', () => {
    const { result } = renderHook(() => useNotes(baseData))
    act(() => result.current.addSection('Game B'))
    expect(result.current.sections).toHaveLength(2)
    expect(result.current.sections[1].name).toBe('Game B')
  })

  it('renameSection updates the section name', () => {
    const { result } = renderHook(() => useNotes(baseData))
    act(() => result.current.renameSection('s1', 'Renamed'))
    expect(result.current.sections[0].name).toBe('Renamed')
  })

  it('addTextNote adds a note to the correct section', () => {
    const { result } = renderHook(() => useNotes(baseData))
    act(() => result.current.addTextNote('s1', 'hello world'))
    expect(result.current.sections[0].notes).toHaveLength(1)
    expect((result.current.sections[0].notes[0] as any).content).toBe('hello world')
  })

  it('updateNote updates note content and bumps updatedAt', () => {
    const { result } = renderHook(() => useNotes(baseData))
    act(() => result.current.addTextNote('s1', 'original'))
    const noteId = result.current.sections[0].notes[0].id
    const originalUpdatedAt = result.current.sections[0].notes[0].updatedAt
    act(() => result.current.updateNote('s1', noteId, 'updated'))
    const updated = result.current.sections[0].notes[0]
    expect((updated as any).content).toBe('updated')
    expect(updated.updatedAt).not.toBe(originalUpdatedAt)
  })

  it('deleteNote removes the note', () => {
    const { result } = renderHook(() => useNotes(baseData))
    act(() => result.current.addTextNote('s1', 'to delete'))
    const noteId = result.current.sections[0].notes[0].id
    act(() => result.current.deleteNote('s1', noteId))
    expect(result.current.sections[0].notes).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: FAIL — cannot find module `@renderer/hooks/useNotes`

- [ ] **Step 3: Create `src/renderer/src/hooks/useNotes.ts`**

```typescript
import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppData, Section, Note, Settings, ChecklistItem } from '../types'

export interface UseNotesReturn {
  sections: Section[]
  settings: Settings
  addSection: (name: string) => void
  renameSection: (sectionId: string, name: string) => void
  deleteSection: (sectionId: string) => void
  addTextNote: (sectionId: string, content: string) => void
  addChecklistNote: (sectionId: string) => void
  updateNote: (sectionId: string, noteId: string, content: Note['content']) => void
  deleteNote: (sectionId: string, noteId: string) => void
  updateSettings: (settings: Settings) => void
  getAppData: () => AppData
}

export function useNotes(initialData: AppData): UseNotesReturn {
  const [sections, setSections] = useState<Section[]>(initialData.sections)
  const [settings, setSettings] = useState<Settings>(initialData.settings)

  const now = () => new Date().toISOString()

  const addSection = useCallback((name: string) => {
    setSections(prev => [...prev, { id: uuidv4(), name, notes: [] }])
  }, [])

  const renameSection = useCallback((sectionId: string, name: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name } : s))
  }, [])

  const deleteSection = useCallback((sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId))
  }, [])

  const addTextNote = useCallback((sectionId: string, content: string) => {
    const note: Note = { id: uuidv4(), type: 'text', content, createdAt: now(), updatedAt: now() }
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, notes: [note, ...s.notes] } : s))
  }, [])

  const addChecklistNote = useCallback((sectionId: string) => {
    const item: ChecklistItem = { id: uuidv4(), text: '', checked: false }
    const note: Note = { id: uuidv4(), type: 'checklist', content: [item], createdAt: now(), updatedAt: now() }
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, notes: [note, ...s.notes] } : s))
  }, [])

  const updateNote = useCallback((sectionId: string, noteId: string, content: Note['content']) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      return {
        ...s,
        notes: s.notes.map(n => n.id === noteId ? { ...n, content, updatedAt: now() } as Note : n)
      }
    }))
  }, [])

  const deleteNote = useCallback((sectionId: string, noteId: string) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s
      return { ...s, notes: s.notes.filter(n => n.id !== noteId) }
    }))
  }, [])

  const updateSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings)
  }, [])

  const getAppData = useCallback((): AppData => ({ settings, sections }), [settings, sections])

  return { sections, settings, addSection, renameSection, deleteSection, addTextNote, addChecklistNote, updateNote, deleteNote, updateSettings, getAppData }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: PASS — all 6 tests green

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/hooks/useNotes.ts tests/renderer/useNotes.test.ts
git commit -m "feat: add useNotes hook with full CRUD for sections and notes"
```

---

## Task 8: ModeIndicator component

**Files:**
- Create: `src/renderer/src/components/ModeIndicator.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/ModeIndicator.tsx`**

```tsx
import type { WindowMode } from '../types'

interface Props {
  mode: WindowMode
  onToggle: () => void
}

export function ModeIndicator({ mode, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={mode === 'view' ? 'Click or use hotkey to enter edit mode' : 'Click or use hotkey to enter view mode'}
      style={{
        background: 'none',
        border: '1px solid rgba(255,255,255,0.3)',
        borderRadius: 4,
        color: mode === 'edit' ? '#4ade80' : '#94a3b8',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
        padding: '2px 8px',
        whiteSpace: 'nowrap'
      }}
    >
      ● {mode.toUpperCase()}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/ModeIndicator.tsx
git commit -m "feat: add ModeIndicator component"
```

---

## Task 9: TabBar component

**Files:**
- Create: `src/renderer/src/components/TabBar.tsx`
- Create: `tests/renderer/TabBar.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/TabBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TabBar } from '@renderer/components/TabBar'
import type { Section } from '@renderer/types'

const sections: Section[] = [
  { id: 's1', name: 'Game A', notes: [] },
  { id: 's2', name: 'Game B', notes: [] }
]

const noop = () => {}

describe('TabBar', () => {
  it('renders all section tabs', () => {
    render(<TabBar sections={sections} activeSectionId="s1" onSelect={noop} onAdd={noop} onRename={noop} isEditMode={true} />)
    expect(screen.getByText('Game A')).toBeInTheDocument()
    expect(screen.getByText('Game B')).toBeInTheDocument()
  })

  it('calls onSelect when a tab is clicked', async () => {
    const onSelect = vi.fn()
    render(<TabBar sections={sections} activeSectionId="s1" onSelect={onSelect} onAdd={noop} onRename={noop} isEditMode={true} />)
    await userEvent.click(screen.getByText('Game B'))
    expect(onSelect).toHaveBeenCalledWith('s2')
  })

  it('calls onAdd when + button is clicked and edit mode is active', async () => {
    const onAdd = vi.fn()
    render(<TabBar sections={sections} activeSectionId="s1" onSelect={noop} onAdd={onAdd} onRename={noop} isEditMode={true} />)
    await userEvent.click(screen.getByTitle('Add section'))
    expect(onAdd).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: FAIL — cannot find module `@renderer/components/TabBar`

- [ ] **Step 3: Create `src/renderer/src/components/TabBar.tsx`**

```tsx
import { useState } from 'react'
import type { Section } from '../types'

interface Props {
  sections: Section[]
  activeSectionId: string | null
  onSelect: (id: string) => void
  onAdd: (name: string) => void
  onRename: (id: string, name: string) => void
  isEditMode: boolean
}

export function TabBar({ sections, activeSectionId, onSelect, onAdd, onRename, isEditMode }: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [newName, setNewName] = useState('')

  const handleRenameStart = (id: string, currentName: string) => {
    if (!isEditMode) return
    setRenamingId(id)
    setRenameValue(currentName)
  }

  const handleRenameCommit = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const handleAddCommit = () => {
    if (newName.trim()) onAdd(newName.trim())
    setAddingNew(false)
    setNewName('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', padding: '4px 8px' }}>
      {sections.map(s => (
        <div key={s.id}>
          {renamingId === s.id ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameCommit}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameCommit(); if (e.key === 'Escape') setRenamingId(null) }}
              style={{ width: 80, fontSize: 12, borderRadius: 4, border: '1px solid #4ade80', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px' }}
            />
          ) : (
            <button
              onClick={() => onSelect(s.id)}
              onDoubleClick={() => handleRenameStart(s.id, s.name)}
              title={isEditMode ? 'Double-click to rename' : undefined}
              style={{
                background: s.id === activeSectionId ? 'rgba(255,255,255,0.15)' : 'none',
                border: 'none',
                borderRadius: 4,
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 12,
                padding: '3px 10px',
                whiteSpace: 'nowrap'
              }}
            >
              {s.name}
            </button>
          )}
        </div>
      ))}

      {addingNew ? (
        <input
          autoFocus
          value={newName}
          placeholder="Section name"
          onChange={e => setNewName(e.target.value)}
          onBlur={handleAddCommit}
          onKeyDown={e => { if (e.key === 'Enter') handleAddCommit(); if (e.key === 'Escape') { setAddingNew(false); setNewName('') } }}
          style={{ width: 100, fontSize: 12, borderRadius: 4, border: '1px solid #4ade80', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 6px' }}
        />
      ) : isEditMode && (
        <button
          onClick={() => setAddingNew(true)}
          title="Add section"
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px' }}
        >
          +
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: PASS — all 3 tests green

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/TabBar.tsx tests/renderer/TabBar.test.tsx
git commit -m "feat: add TabBar component with add/rename section support"
```

---

## Task 10: TextNote and ChecklistNote components

**Files:**
- Create: `src/renderer/src/components/TextNote.tsx`
- Create: `src/renderer/src/components/ChecklistNote.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/TextNote.tsx`**

```tsx
interface Props {
  content: string
  isEditMode: boolean
  onChange: (content: string) => void
}

export function TextNote({ content, isEditMode, onChange }: Props) {
  if (!isEditMode) {
    return (
      <p style={{ margin: 0, color: '#e2e8f0', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {content || <span style={{ color: '#64748b' }}>Empty note</span>}
      </p>
    )
  }
  return (
    <textarea
      value={content}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your note..."
      style={{
        background: 'transparent',
        border: 'none',
        color: '#e2e8f0',
        fontSize: 13,
        outline: 'none',
        resize: 'none',
        width: '100%',
        minHeight: 60,
        fontFamily: 'inherit'
      }}
    />
  )
}
```

- [ ] **Step 2: Create `src/renderer/src/components/ChecklistNote.tsx`**

```tsx
import { v4 as uuidv4 } from 'uuid'
import type { ChecklistItem } from '../types'

interface Props {
  items: ChecklistItem[]
  isEditMode: boolean
  onChange: (items: ChecklistItem[]) => void
}

export function ChecklistNote({ items, isEditMode, onChange }: Props) {
  const toggle = (id: string) => onChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  const updateText = (id: string, text: string) => onChange(items.map(i => i.id === id ? { ...i, text } : i))
  const addItem = () => onChange([...items, { id: uuidv4(), text: '', checked: false }])
  const removeItem = (id: string) => onChange(items.filter(i => i.id !== id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggle(item.id)}
            style={{ accentColor: '#4ade80', cursor: 'pointer' }}
          />
          {isEditMode ? (
            <>
              <input
                value={item.text}
                onChange={e => updateText(item.id, e.target.value)}
                placeholder="Item..."
                style={{ background: 'transparent', border: 'none', color: item.checked ? '#64748b' : '#e2e8f0', fontSize: 13, flex: 1, outline: 'none', textDecoration: item.checked ? 'line-through' : 'none', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => removeItem(item.id)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}
              >
                ✕
              </button>
            </>
          ) : (
            <span style={{ color: item.checked ? '#64748b' : '#e2e8f0', fontSize: 13, textDecoration: item.checked ? 'line-through' : 'none' }}>
              {item.text || <span style={{ color: '#475569' }}>—</span>}
            </span>
          )}
        </div>
      ))}
      {isEditMode && (
        <button
          onClick={addItem}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 12, padding: '2px 0' }}
        >
          + Add item
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/TextNote.tsx src/renderer/src/components/ChecklistNote.tsx
git commit -m "feat: add TextNote and ChecklistNote components"
```

---

## Task 11: NoteCard and NoteList components

**Files:**
- Create: `src/renderer/src/components/NoteCard.tsx`
- Create: `src/renderer/src/components/NoteList.tsx`
- Create: `tests/renderer/NoteCard.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/NoteCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NoteCard } from '@renderer/components/NoteCard'
import type { Note } from '@renderer/types'

const textNote: Note = { id: 'n1', type: 'text', content: 'Hello note', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
const checklistNote: Note = { id: 'n2', type: 'checklist', content: [{ id: 'i1', text: 'Item 1', checked: false }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }
const noop = () => {}

describe('NoteCard', () => {
  it('renders text note content', () => {
    render(<NoteCard note={textNote} isEditMode={false} onUpdate={noop} onDelete={noop} />)
    expect(screen.getByText('Hello note')).toBeInTheDocument()
  })

  it('renders checklist item text', () => {
    render(<NoteCard note={checklistNote} isEditMode={false} onUpdate={noop} onDelete={noop} />)
    expect(screen.getByText('Item 1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: FAIL — cannot find module `@renderer/components/NoteCard`

- [ ] **Step 3: Create `src/renderer/src/components/NoteCard.tsx`**

```tsx
import { TextNote } from './TextNote'
import { ChecklistNote } from './ChecklistNote'
import type { Note, ChecklistItem } from '../types'

interface Props {
  note: Note
  isEditMode: boolean
  onUpdate: (content: Note['content']) => void
  onDelete: () => void
}

export function NoteCard({ note, isEditMode, onUpdate, onDelete }: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 10px',
        position: 'relative'
      }}
    >
      {isEditMode && (
        <button
          onClick={onDelete}
          title="Delete note"
          style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}
        >
          ✕
        </button>
      )}
      {note.type === 'text' ? (
        <TextNote content={note.content as string} isEditMode={isEditMode} onChange={onUpdate} />
      ) : (
        <ChecklistNote items={note.content as ChecklistItem[]} isEditMode={isEditMode} onChange={onUpdate} />
      )}
      <div style={{ color: '#475569', fontSize: 10, marginTop: 4, textAlign: 'right' }}>
        {new Date(note.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/renderer/src/components/NoteList.tsx`**

```tsx
import { NoteCard } from './NoteCard'
import type { Note } from '../types'

interface Props {
  notes: Note[]
  isEditMode: boolean
  onUpdate: (noteId: string, content: Note['content']) => void
  onDelete: (noteId: string) => void
}

export function NoteList({ notes, isEditMode, onUpdate, onDelete }: Props) {
  const sorted = [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  if (sorted.length === 0) {
    return (
      <div style={{ color: '#475569', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
        No notes yet. {isEditMode ? 'Add one above.' : 'Switch to edit mode to add notes.'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sorted.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          isEditMode={isEditMode}
          onUpdate={content => onUpdate(note.id, content)}
          onDelete={() => onDelete(note.id)}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: PASS — all tests green

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/NoteCard.tsx src/renderer/src/components/NoteList.tsx tests/renderer/NoteCard.test.tsx
git commit -m "feat: add NoteCard and NoteList components with sort by date"
```

---

## Task 12: useAudio hook and VoiceButton component

**Files:**
- Create: `src/renderer/src/hooks/useAudio.ts`
- Create: `src/renderer/src/components/VoiceButton.tsx`

- [ ] **Step 1: Create `src/renderer/src/hooks/useAudio.ts`**

```typescript
import { useState, useRef, useCallback } from 'react'

export type AudioState = 'idle' | 'recording' | 'processing'

export interface UseAudioReturn {
  audioState: AudioState
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Float32Array | null>
  error: string | null
}

export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      mediaRecorderRef.current = recorder
      setAudioState('recording')
    } catch (err) {
      setError('Microphone unavailable. Check permissions.')
      setAudioState('idle')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Float32Array | null> => {
    return new Promise(resolve => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') { resolve(null); return }

      recorder.onstop = async () => {
        try {
          setAudioState('processing')
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          const audioCtx = new AudioContext({ sampleRate: 16000 })
          const decoded = await audioCtx.decodeAudioData(arrayBuffer)
          const float32 = decoded.getChannelData(0)
          recorder.stream.getTracks().forEach(t => t.stop())
          resolve(float32)
        } catch {
          setError('Failed to process audio.')
          resolve(null)
        } finally {
          setAudioState('idle')
        }
      }
      recorder.stop()
    })
  }, [])

  return { audioState, startRecording, stopRecording, error }
}
```

- [ ] **Step 2: Create `src/renderer/src/components/VoiceButton.tsx`**

```tsx
import type { AudioState } from '../hooks/useAudio'

interface Props {
  audioState: AudioState
  downloadProgress: number | null
  isEditMode: boolean
  onToggle: () => void
}

export function VoiceButton({ audioState, downloadProgress, isEditMode, onToggle }: Props) {
  const isRecording = audioState === 'recording'
  const isProcessing = audioState === 'processing'

  const label = isProcessing
    ? 'Processing…'
    : isRecording
    ? '⏹ Stop'
    : '🎤 Record'

  const disabled = isProcessing || !isEditMode

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {downloadProgress !== null && (
        <span style={{ color: '#94a3b8', fontSize: 11 }}>
          Downloading model {Math.round(downloadProgress * 100)}%…
        </span>
      )}
      <button
        onClick={onToggle}
        disabled={disabled}
        title={!isEditMode ? 'Switch to edit mode to record' : isRecording ? 'Stop recording' : 'Start voice note'}
        style={{
          background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${isRecording ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 4,
          color: disabled ? '#475569' : '#e2e8f0',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 12,
          padding: '3px 10px'
        }}
      >
        {label}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/hooks/useAudio.ts src/renderer/src/components/VoiceButton.tsx
git commit -m "feat: add useAudio hook and VoiceButton component"
```

---

## Task 13: Voice IPC handler and Whisper worker thread

**Files:**
- Create: `src/main/voice/whisper-worker.ts`
- Create: `src/main/voice/voice-handler.ts`

- [ ] **Step 1: Create `src/main/voice/whisper-worker.ts`**

This file runs in a Node.js worker thread and must use a dynamic ESM import for `@xenova/transformers`.

```typescript
import { workerData, parentPort } from 'worker_threads'

async function run() {
  try {
    // Dynamic import needed because @xenova/transformers is ESM
    const { pipeline, env } = await import('@xenova/transformers')

    env.cacheDir = workerData.cacheDir
    env.allowLocalModels = false

    // Report download progress back to main thread
    const progressCallback = (progress: { status: string; progress?: number }) => {
      if (progress.status === 'downloading' && progress.progress !== undefined) {
        parentPort?.postMessage({ type: 'progress', value: progress.progress / 100 })
      }
    }

    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: progressCallback
    })

    const audioData = Float32Array.from(Object.values(workerData.audioBuffer as Record<string, number>))
    const result = await transcriber(audioData, { language: 'english', task: 'transcribe' }) as { text: string }

    parentPort?.postMessage({ type: 'result', text: result.text.trim() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    parentPort?.postMessage({ type: 'error', message })
  }
}

run()
```

- [ ] **Step 2: Create `src/main/voice/voice-handler.ts`**

```typescript
import { ipcMain, app, BrowserWindow } from 'electron'
import { Worker } from 'worker_threads'
import { join } from 'path'

export function registerVoiceHandlers(win: BrowserWindow): void {
  ipcMain.handle('voice:transcribe', async (_event, audioBuffer: Float32Array) => {
    const workerPath = join(__dirname, 'whisper-worker.js')
    const cacheDir = join(app.getPath('userData'), 'whisper-cache')

    return new Promise<void>((resolve) => {
      const worker = new Worker(workerPath, {
        workerData: { audioBuffer: Array.from(audioBuffer), cacheDir }
      })

      worker.on('message', (msg: { type: string; value?: number; text?: string; message?: string }) => {
        if (msg.type === 'progress' && msg.value !== undefined) {
          win.webContents.send('voice:progress', msg.value)
        } else if (msg.type === 'result') {
          win.webContents.send('voice:result', msg.text)
          resolve()
        } else if (msg.type === 'error') {
          win.webContents.send('voice:result', null, msg.message)
          resolve()
        }
      })

      worker.on('error', (err) => {
        win.webContents.send('voice:result', null, err.message)
        resolve()
      })
    })
  })
}
```

- [ ] **Step 3: Register the voice handler in `src/main/index.ts`**

Add the import at the top of `src/main/index.ts`:

```typescript
import { registerVoiceHandlers } from './voice/voice-handler'
```

Add the call inside `app.whenReady().then(...)`, after `registerHotkeyHandlers(mainWindow)`:

```typescript
registerVoiceHandlers(mainWindow)
```

- [ ] **Step 4: Commit**

```bash
git add src/main/voice/whisper-worker.ts src/main/voice/voice-handler.ts src/main/index.ts
git commit -m "feat: add Whisper voice transcription via worker thread"
```

---

## Task 14: Toast component

**Files:**
- Create: `src/renderer/src/components/Toast.tsx`

- [ ] **Step 1: Create `src/renderer/src/components/Toast.tsx`**

```tsx
import { useEffect } from 'react'
import type { ToastMessage } from '../types'

interface Props {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

const COLORS: Record<ToastMessage['type'], string> = {
  error: '#ef4444',
  info: '#3b82f6',
  success: '#4ade80'
}

export function Toast({ toasts, onDismiss }: Props) {
  return (
    <div style={{ bottom: 8, display: 'flex', flexDirection: 'column', gap: 4, left: 8, position: 'fixed', right: 8, zIndex: 9999 }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      style={{
        alignItems: 'center',
        background: 'rgba(15,15,15,0.92)',
        border: `1px solid ${COLORS[toast.type]}`,
        borderRadius: 6,
        color: '#e2e8f0',
        display: 'flex',
        fontSize: 12,
        gap: 8,
        justifyContent: 'space-between',
        padding: '6px 10px'
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/components/Toast.tsx
git commit -m "feat: add auto-dismissing Toast component"
```

---

## Task 15: SettingsPanel component

**Files:**
- Create: `src/renderer/src/components/SettingsPanel.tsx`
- Create: `tests/renderer/SettingsPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `tests/renderer/SettingsPanel.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsPanel } from '@renderer/components/SettingsPanel'
import type { Hotkeys } from '@renderer/types'

const hotkeys: Hotkeys = {
  toggleVisibility: 'Alt+Shift+N',
  toggleEditMode: 'Alt+Shift+E',
  startVoiceNote: 'Alt+Shift+V'
}

describe('SettingsPanel', () => {
  it('renders all three hotkey fields', () => {
    render(<SettingsPanel hotkeys={hotkeys} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Show / Hide Overlay')).toBeInTheDocument()
    expect(screen.getByText('Toggle Edit Mode')).toBeInTheDocument()
    expect(screen.getByText('Start Voice Note')).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<SettingsPanel hotkeys={hotkeys} onSave={vi.fn()} onClose={onClose} />)
    await userEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --reporter=verbose
```

Expected: FAIL — cannot find module `@renderer/components/SettingsPanel`

- [ ] **Step 3: Create `src/renderer/src/components/SettingsPanel.tsx`**

```tsx
import { useState, useCallback } from 'react'
import type { Hotkeys } from '../types'

interface Props {
  hotkeys: Hotkeys
  onSave: (hotkeys: Hotkeys) => void
  onClose: () => void
}

type HotkeyKey = keyof Hotkeys

const LABELS: Record<HotkeyKey, string> = {
  toggleVisibility: 'Show / Hide Overlay',
  toggleEditMode: 'Toggle Edit Mode',
  startVoiceNote: 'Start Voice Note'
}

export function SettingsPanel({ hotkeys, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Hotkeys>({ ...hotkeys })
  const [capturing, setCapturing] = useState<HotkeyKey | null>(null)

  const handleKeyDown = useCallback((e: React.KeyboardEvent, key: HotkeyKey) => {
    e.preventDefault()
    const parts: string[] = []
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Meta')
    const main = e.key
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(main)) {
      parts.push(main.length === 1 ? main.toUpperCase() : main)
      setDraft(prev => ({ ...prev, [key]: parts.join('+') }))
      setCapturing(null)
    }
  }, [])

  return (
    <div
      style={{
        background: 'rgba(15,15,15,0.95)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        color: '#e2e8f0',
        padding: 16,
        position: 'absolute',
        right: 8,
        top: 40,
        width: 280,
        zIndex: 100
      }}
    >
      <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>Settings</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(Object.keys(LABELS) as HotkeyKey[]).map(key => (
          <div key={key}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 3 }}>{LABELS[key]}</div>
            <div
              onKeyDown={capturing === key ? e => handleKeyDown(e, key) : undefined}
              onClick={() => setCapturing(key)}
              tabIndex={0}
              style={{
                background: capturing === key ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${capturing === key ? '#4ade80' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4,
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 12,
                padding: '4px 8px'
              }}
            >
              {capturing === key ? 'Press keys…' : draft[key]}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#94a3b8', cursor: 'pointer', fontSize: 12, padding: '4px 12px' }}
        >
          Cancel
        </button>
        <button
          onClick={() => { onSave(draft); onClose() }}
          style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid #4ade80', borderRadius: 4, color: '#4ade80', cursor: 'pointer', fontSize: 12, padding: '4px 12px' }}
        >
          Save
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --reporter=verbose
```

Expected: PASS — all tests green

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/SettingsPanel.tsx tests/renderer/SettingsPanel.test.tsx
git commit -m "feat: add SettingsPanel component with hotkey rebinding"
```

---

## Task 16: App.tsx — wire everything together

**Files:**
- Modify: `src/renderer/src/App.tsx`

- [ ] **Step 1: Replace `src/renderer/src/App.tsx` with the full wired-up app**

The component is split into two parts to avoid hooks-ordering issues: `App` waits for data to load, then renders `NotesApp` which always has valid `initialData`. Stale closure issues in IPC listeners are avoided by keeping mutable refs for values that change.

```tsx
import { useEffect, useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppData, WindowMode, ToastMessage } from './types'
import { useNotes } from './hooks/useNotes'
import { useAudio } from './hooks/useAudio'
import { TabBar } from './components/TabBar'
import { NoteList } from './components/NoteList'
import { VoiceButton } from './components/VoiceButton'
import { ModeIndicator } from './components/ModeIndicator'
import { SettingsPanel } from './components/SettingsPanel'
import { Toast } from './components/Toast'
import './styles/overlay.css'

// Outer shell: waits for notes:load IPC before rendering the app
export default function App() {
  const [initialData, setInitialData] = useState<AppData | null>(null)
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null)

  useEffect(() => {
    window.api.onNotesLoad((data, loadError) => {
      setInitialData(data)
      if (loadError) setInitialLoadError(loadError)
    })
  }, [])

  if (!initialData) {
    return (
      <div className="overlay-root" style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
        Loading…
      </div>
    )
  }

  return <NotesApp initialData={initialData} initialLoadError={initialLoadError} />
}

// Inner app: all hooks called unconditionally, always has valid initialData
function NotesApp({ initialData, initialLoadError }: { initialData: AppData; initialLoadError: string | null }) {
  const notes = useNotes(initialData)
  const { audioState, startRecording, stopRecording, error: audioError } = useAudio()

  const [mode, setMode] = useState<WindowMode>('view')
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialData.sections[0]?.id ?? null
  )
  const [showSettings, setShowSettings] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>(() =>
    initialLoadError ? [{ id: uuidv4(), type: 'error', message: initialLoadError }] : []
  )
  const [voiceDownloadProgress, setVoiceDownloadProgress] = useState<number | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Refs to avoid stale closures in stable IPC callbacks
  const activeSectionIdRef = useRef(activeSectionId)
  useEffect(() => { activeSectionIdRef.current = activeSectionId }, [activeSectionId])

  const addTextNoteRef = useRef(notes.addTextNote)
  useEffect(() => { addTextNoteRef.current = notes.addTextNote }, [notes.addTextNote])

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
    setToasts(prev => [...prev, { id: uuidv4(), type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Wire up IPC listeners (registered once; use refs for mutable values)
  useEffect(() => {
    window.api.onVoiceProgress(p => setVoiceDownloadProgress(p >= 1 ? null : p))

    window.api.onVoiceResult(text => {
      const sectionId = activeSectionIdRef.current
      if (text && sectionId) {
        addTextNoteRef.current(sectionId, text)
        addToast('Voice note added.', 'success')
      } else if (!text) {
        addToast('Transcription failed. Try again.')
      }
      setVoiceDownloadProgress(null)
    })

    // Hotkey events: use functional setState to avoid stale mode value
    window.api.onHotkeyToggleEditMode(() => {
      setMode(prev => {
        const next: WindowMode = prev === 'view' ? 'edit' : 'view'
        window.api.setMode(next)
        return next
      })
    })

    window.api.onHotkeyStartVoiceNote(() => {
      voiceToggleRef.current()
    })

    return () => {
      window.api.removeAllListeners('voice:progress')
      window.api.removeAllListeners('voice:result')
      window.api.removeAllListeners('hotkey:toggleEditMode')
      window.api.removeAllListeners('hotkey:startVoiceNote')
    }
  }, [addToast])

  // Show audio capture errors as toasts
  useEffect(() => {
    if (audioError) addToast(audioError)
  }, [audioError, addToast])

  const handleToggleMode = useCallback(() => {
    setMode(prev => {
      const next: WindowMode = prev === 'view' ? 'edit' : 'view'
      window.api.setMode(next)
      return next
    })
  }, [])

  const handleVoiceToggle = useCallback(async () => {
    const sectionId = activeSectionIdRef.current
    if (audioState === 'recording') {
      const buffer = await stopRecording()
      if (buffer && sectionId) await window.api.transcribeAudio(buffer)
    } else if (audioState === 'idle' && sectionId) {
      await startRecording()
    }
  }, [audioState, startRecording, stopRecording])

  // Keep a ref to handleVoiceToggle for the IPC listener above
  const voiceToggleRef = useRef(handleVoiceToggle)
  useEffect(() => { voiceToggleRef.current = handleVoiceToggle }, [handleVoiceToggle])

  const handleSaveSettings = useCallback(async (hotkeys: typeof notes.settings.hotkeys) => {
    notes.updateSettings({ ...notes.settings, hotkeys })
    await window.api.updateHotkeys(hotkeys)
  }, [notes])

  // Auto-save (debounced 500ms)
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      window.api.saveNotes(notes.getAppData())
    }, 500)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [notes.sections, notes.settings]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeSection = notes.sections.find(s => s.id === activeSectionId) ?? null

  return (
    <div className="overlay-root">
      {/* Header row */}
      <div className="overlay-header">
        <TabBar
          sections={notes.sections}
          activeSectionId={activeSectionId}
          onSelect={id => setActiveSectionId(id)}
          onAdd={name => notes.addSection(name)}
          onRename={(id, name) => notes.renameSection(id, name)}
          isEditMode={mode === 'edit'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8 }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            title="Settings"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 0 }}
          >
            ⚙
          </button>
          <ModeIndicator mode={mode} onToggle={handleToggleMode} />
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          hotkeys={notes.settings.hotkeys}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Action row */}
      {mode === 'edit' && activeSection && (
        <div className="overlay-actions">
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => notes.addTextNote(activeSection.id, '')}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 12, padding: '3px 10px' }}
            >
              + Text
            </button>
            <button
              onClick={() => notes.addChecklistNote(activeSection.id)}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 12, padding: '3px 10px' }}
            >
              + Checklist
            </button>
          </div>
          <VoiceButton
            audioState={audioState}
            downloadProgress={voiceDownloadProgress}
            isEditMode={mode === 'edit'}
            onToggle={handleVoiceToggle}
          />
        </div>
      )}

      {/* Notes area */}
      <div className="overlay-notes">
        {activeSection ? (
          <NoteList
            notes={activeSection.notes}
            isEditMode={mode === 'edit'}
            onUpdate={(noteId, content) => notes.updateNote(activeSection.id, noteId, content)}
            onDelete={noteId => notes.deleteNote(activeSection.id, noteId)}
          />
        ) : (
          <div style={{ color: '#475569', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
            {notes.sections.length === 0
              ? 'Switch to edit mode and add a section to get started.'
              : 'Select a section above.'}
          </div>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/src/App.tsx
git commit -m "feat: wire all components together in App.tsx"
```

---

## Task 17: Overlay CSS

**Files:**
- Create: `src/renderer/src/styles/overlay.css`
- Modify: `src/renderer/src/main.tsx` (import CSS)

- [ ] **Step 1: Create `src/renderer/src/styles/overlay.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  background: transparent;
  margin: 0;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
}

.overlay-root {
  background: rgba(10, 12, 16, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.overlay-header {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  min-height: 36px;
  -webkit-app-region: drag;
}

/* Prevent drag on interactive elements inside the header */
.overlay-header button,
.overlay-header input {
  -webkit-app-region: no-drag;
}

.overlay-actions {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
}

.overlay-notes {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px;
  scrollbar-color: rgba(255,255,255,0.1) transparent;
  scrollbar-width: thin;
}

/* Allow text selection inside notes when in edit mode */
.overlay-notes textarea,
.overlay-notes input[type="text"] {
  -webkit-user-select: text;
  user-select: text;
}
```

- [ ] **Step 2: Update `src/renderer/src/main.tsx` to remove the default Electron template CSS imports**

Replace the contents of `src/renderer/src/main.tsx` with:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Update `src/renderer/index.html` to set a transparent background**

In `src/renderer/index.html`, find the `<style>` block (if any) or add inside `<head>`:

```html
<style>
  html, body, #root { height: 100%; margin: 0; background: transparent; }
</style>
```

- [ ] **Step 4: Verify the full app runs**

```bash
npm run dev
```

Expected: Electron window appears as a dark semi-transparent rounded overlay. The app shows "Loading…" briefly then the notes UI with the header, tab bar, and mode indicator. Verify:
- Window is frameless and always on top
- Pressing `Alt+Shift+N` hides/shows the window
- Pressing `Alt+Shift+E` toggles `● VIEW` / `● EDIT` in the UI
- In edit mode, `+ Text` and `+ Checklist` buttons appear and create notes
- Typing in a text note and waiting 500ms saves to `notes.json` in `%APPDATA%\game-overlay-notes\` (Windows) or `~/.config/game-overlay-notes/` (Linux)
- Gear icon opens the settings panel with hotkey rebinding

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/styles/overlay.css src/renderer/src/main.tsx src/renderer/index.html
git commit -m "feat: add overlay CSS and finalize renderer entry point"
```

---

## Task 18: Run full test suite and final verification

- [ ] **Step 1: Run all tests**

```bash
npm test -- --reporter=verbose
```

Expected: All tests pass. If any fail, fix before proceeding.

- [ ] **Step 2: Run the app end-to-end**

```bash
npm run dev
```

Verify the following golden path:
1. App opens as a transparent overlay (no window chrome)
2. `Alt+Shift+E` switches to edit mode (`● EDIT` indicator turns green)
3. Add a section named "My Game" via the `+` tab button
4. Click `+ Text`, type a note, wait 500ms (auto-saved)
5. Click `+ Checklist`, add two items, check one
6. `Alt+Shift+E` returns to view mode — overlay is click-through (click the desktop behind it)
7. `Alt+Shift+N` hides the overlay, pressing again shows it
8. Open settings (⚙), rebind a hotkey, save — new hotkey works immediately
9. Close and reopen the app — all notes and sections are restored from disk

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete game overlay notes app"
```
