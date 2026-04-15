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
