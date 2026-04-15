import type { AudioState } from '../hooks/useAudio'

interface Props {
  audioState: AudioState
  downloadProgress: number | null
  isEditMode: boolean
  onToggle: () => void
}

export function VoiceButton({ audioState, downloadProgress, isEditMode, onToggle }: Props) {
  const isRecording = audioState === 'recording'
  const isProcessing = audioState === 'processing'

  const label = isProcessing
    ? 'Processing…'
    : isRecording
    ? '⏹ Stop'
    : '🎤 Record'

  const disabled = isProcessing || !isEditMode

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {downloadProgress !== null && (
        <span style={{ color: '#94a3b8', fontSize: 11 }}>
          Downloading model {Math.round(downloadProgress * 100)}%…
        </span>
      )}
      <button
        onClick={onToggle}
        disabled={disabled}
        title={!isEditMode ? 'Switch to edit mode to record' : isRecording ? 'Stop recording' : 'Start voice note'}
        style={{
          background: isRecording ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${isRecording ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 4,
          color: disabled ? '#475569' : '#e2e8f0',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 12,
          padding: '3px 10px'
        }}
      >
        {label}
      </button>
    </div>
  )
}
