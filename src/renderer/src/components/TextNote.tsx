interface Props {
  content: string
  isEditMode: boolean
  onChange: (content: string) => void
}

export function TextNote({ content, isEditMode, onChange }: Props) {
  if (!isEditMode) {
    return (
      <p style={{ margin: 0, color: '#e2e8f0', fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {content || <span style={{ color: '#64748b' }}>Empty note</span>}
      </p>
    )
  }
  return (
    <textarea
      value={content}
      onChange={e => onChange(e.target.value)}
      placeholder="Type your note..."
      style={{
        background: 'transparent',
        border: 'none',
        color: '#e2e8f0',
        fontSize: 13,
        outline: 'none',
        resize: 'none',
        width: '100%',
        minHeight: 60,
        fontFamily: 'inherit'
      }}
    />
  )
}
