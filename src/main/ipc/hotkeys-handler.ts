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
