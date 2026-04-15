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
