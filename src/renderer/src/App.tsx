import { useEffect, useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { AppData, WindowMode, ToastMessage } from './types'
import { useNotes } from './hooks/useNotes'
import { useAudio } from './hooks/useAudio'
import { TabBar } from './components/TabBar'
import { NoteList } from './components/NoteList'
import { VoiceButton } from './components/VoiceButton'
import { ModeIndicator } from './components/ModeIndicator'
import { SettingsPanel } from './components/SettingsPanel'
import { Toast } from './components/Toast'
import './styles/overlay.css'

export default function App() {
  const [initialData, setInitialData] = useState<AppData | null>(null)
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null)

  useEffect(() => {
    window.api.onNotesLoad((data, loadError) => {
      setInitialData(data)
      if (loadError) setInitialLoadError(loadError)
    })
  }, [])

  if (!initialData) {
    return (
      <div className="overlay-root" style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
        Loading…
      </div>
    )
  }

  return <NotesApp initialData={initialData} initialLoadError={initialLoadError} />
}

function NotesApp({ initialData, initialLoadError }: { initialData: AppData; initialLoadError: string | null }) {
  const notes = useNotes(initialData)
  const { audioState, startRecording, stopRecording, error: audioError } = useAudio()

  const [mode, setMode] = useState<WindowMode>('view')
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialData.sections[0]?.id ?? null
  )
  const [showSettings, setShowSettings] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>(() =>
    initialLoadError ? [{ id: uuidv4(), type: 'error', message: initialLoadError }] : []
  )
  const [voiceDownloadProgress, setVoiceDownloadProgress] = useState<number | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeSectionIdRef = useRef(activeSectionId)
  useEffect(() => { activeSectionIdRef.current = activeSectionId }, [activeSectionId])

  const addTextNoteRef = useRef(notes.addTextNote)
  useEffect(() => { addTextNoteRef.current = notes.addTextNote }, [notes.addTextNote])

  const voiceToggleRef = useRef<() => void>(() => {})

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'error') => {
    setToasts(prev => [...prev, { id: uuidv4(), type, message }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    window.api.onVoiceProgress(p => setVoiceDownloadProgress(p >= 1 ? null : p))

    window.api.onVoiceResult(text => {
      const sectionId = activeSectionIdRef.current
      if (text && sectionId) {
        addTextNoteRef.current(sectionId, text)
        addToast('Voice note added.', 'success')
      } else if (!text) {
        addToast('Transcription failed. Try again.')
      }
      setVoiceDownloadProgress(null)
    })

    window.api.onHotkeyToggleEditMode(() => {
      setMode(prev => {
        const next: WindowMode = prev === 'view' ? 'edit' : 'view'
        window.api.setMode(next)
        return next
      })
    })

    window.api.onHotkeyStartVoiceNote(() => {
      voiceToggleRef.current()
    })

    return () => {
      window.api.removeAllListeners('voice:progress')
      window.api.removeAllListeners('voice:result')
      window.api.removeAllListeners('hotkey:toggleEditMode')
      window.api.removeAllListeners('hotkey:startVoiceNote')
    }
  }, [addToast])

  useEffect(() => {
    if (audioError) addToast(audioError)
  }, [audioError, addToast])

  const handleToggleMode = useCallback(() => {
    setMode(prev => {
      const next: WindowMode = prev === 'view' ? 'edit' : 'view'
      window.api.setMode(next)
      return next
    })
  }, [])

  const handleVoiceToggle = useCallback(async () => {
    const sectionId = activeSectionIdRef.current
    if (audioState === 'recording') {
      const buffer = await stopRecording()
      if (buffer && sectionId) await window.api.transcribeAudio(buffer)
    } else if (audioState === 'idle' && sectionId) {
      await startRecording()
    }
  }, [audioState, startRecording, stopRecording])

  useEffect(() => { voiceToggleRef.current = handleVoiceToggle }, [handleVoiceToggle])

  const handleSaveSettings = useCallback(async (hotkeys: typeof notes.settings.hotkeys) => {
    notes.updateSettings({ ...notes.settings, hotkeys })
    await window.api.updateHotkeys(hotkeys)
  }, [notes])

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      window.api.saveNotes(notes.getAppData())
    }, 500)
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) }
  }, [notes.sections, notes.settings]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeSection = notes.sections.find(s => s.id === activeSectionId) ?? null

  return (
    <div className="overlay-root">
      <div className="overlay-header">
        <TabBar
          sections={notes.sections}
          activeSectionId={activeSectionId}
          onSelect={id => setActiveSectionId(id)}
          onAdd={name => notes.addSection(name)}
          onRename={(id, name) => notes.renameSection(id, name)}
          isEditMode={mode === 'edit'}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8 }}>
          <button
            onClick={() => setShowSettings(s => !s)}
            title="Settings"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 0 }}
          >
            ⚙
          </button>
          <ModeIndicator mode={mode} onToggle={handleToggleMode} />
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          hotkeys={notes.settings.hotkeys}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {mode === 'edit' && activeSection && (
        <div className="overlay-actions">
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => notes.addTextNote(activeSection.id, '')}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 12, padding: '3px 10px' }}
            >
              + Text
            </button>
            <button
              onClick={() => notes.addChecklistNote(activeSection.id)}
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#e2e8f0', cursor: 'pointer', fontSize: 12, padding: '3px 10px' }}
            >
              + Checklist
            </button>
          </div>
          <VoiceButton
            audioState={audioState}
            downloadProgress={voiceDownloadProgress}
            isEditMode={mode === 'edit'}
            onToggle={handleVoiceToggle}
          />
        </div>
      )}

      <div className="overlay-notes">
        {activeSection ? (
          <NoteList
            notes={activeSection.notes}
            isEditMode={mode === 'edit'}
            onUpdate={(noteId, content) => notes.updateNote(activeSection.id, noteId, content)}
            onDelete={noteId => notes.deleteNote(activeSection.id, noteId)}
          />
        ) : (
          <div style={{ color: '#475569', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
            {notes.sections.length === 0
              ? 'Switch to edit mode and add a section to get started.'
              : 'Select a section above.'}
          </div>
        )}
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
