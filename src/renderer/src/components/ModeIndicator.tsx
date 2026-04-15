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
