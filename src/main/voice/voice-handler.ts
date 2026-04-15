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
