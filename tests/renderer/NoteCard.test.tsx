import { describe, it, expect } from 'vitest'
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
