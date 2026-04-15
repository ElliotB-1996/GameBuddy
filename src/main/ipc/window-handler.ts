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
