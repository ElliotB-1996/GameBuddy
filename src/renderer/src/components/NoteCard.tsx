import { TextNote } from './TextNote'
import { ChecklistNote } from './ChecklistNote'
import type { Note, ChecklistItem } from '../types'

interface Props {
  note: Note
  isEditMode: boolean
  onUpdate: (content: Note['content']) => void
  onDelete: () => void
}

export function NoteCard({ note, isEditMode, onUpdate, onDelete }: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 6,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 10px',
        position: 'relative'
      }}
    >
      {isEditMode && (
        <button
          onClick={onDelete}
          title="Delete note"
          style={{ position: 'absolute', top: 4, right: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, padding: 0 }}
        >
          ✕
        </button>
      )}
      {note.type === 'text' ? (
        <TextNote content={note.content as string} isEditMode={isEditMode} onChange={onUpdate} />
      ) : (
        <ChecklistNote items={note.content as ChecklistItem[]} isEditMode={isEditMode} onChange={onUpdate} />
      )}
      <div style={{ color: '#475569', fontSize: 10, marginTop: 4, textAlign: 'right' }}>
        {new Date(note.updatedAt).toLocaleString()}
      </div>
    </div>
  )
}
