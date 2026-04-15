import { useState, useRef, useCallback } from 'react'

export type AudioState = 'idle' | 'recording' | 'processing'

export interface UseAudioReturn {
  audioState: AudioState
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Float32Array | null>
  error: string | null
}

export function useAudio(): UseAudioReturn {
  const [audioState, setAudioState] = useState<AudioState>('idle')
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.start()
      mediaRecorderRef.current = recorder
      setAudioState('recording')
    } catch {
      setError('Microphone unavailable. Check permissions.')
      setAudioState('idle')
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Float32Array | null> => {
    return new Promise(resolve => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') { resolve(null); return }

      recorder.onstop = async () => {
        try {
          setAudioState('processing')
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          const audioCtx = new AudioContext({ sampleRate: 16000 })
          const decoded = await audioCtx.decodeAudioData(arrayBuffer)
          const float32 = decoded.getChannelData(0)
          recorder.stream.getTracks().forEach(t => t.stop())
          resolve(float32)
        } catch {
          setError('Failed to process audio.')
          resolve(null)
        } finally {
          setAudioState('idle')
        }
      }
      recorder.stop()
    })
  }, [])

  return { audioState, startRecording, stopRecording, error }
}
