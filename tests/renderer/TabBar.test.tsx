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

  it('calls onAdd when a new section name is typed and confirmed', async () => {
    const onAdd = vi.fn()
    render(<TabBar sections={sections} activeSectionId="s1" onSelect={noop} onAdd={onAdd} onRename={noop} isEditMode={true} />)
    await userEvent.click(screen.getByTitle('Add section'))
    const input = screen.getByPlaceholderText('Section name')
    await userEvent.type(input, 'New Game{Enter}')
    expect(onAdd).toHaveBeenCalledWith('New Game')
  })
})
