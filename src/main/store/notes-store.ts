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
