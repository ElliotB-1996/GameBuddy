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

  it('updateNote updates note content and bumps updatedAt', async () => {
    const { result } = renderHook(() => useNotes(baseData))
    act(() => result.current.addTextNote('s1', 'original'))
    const noteId = result.current.sections[0].notes[0].id
    const originalUpdatedAt = result.current.sections[0].notes[0].updatedAt
    await new Promise((r) => setTimeout(r, 5))
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
