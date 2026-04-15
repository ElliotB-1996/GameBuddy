import { workerData, parentPort } from 'worker_threads'

async function run() {
  try {
    const { pipeline, env } = await import('@xenova/transformers')

    env.cacheDir = workerData.cacheDir
    env.allowLocalModels = false

    const progressCallback = (progress: { status: string; progress?: number }) => {
      if (progress.status === 'downloading' && progress.progress !== undefined) {
        parentPort?.postMessage({ type: 'progress', value: progress.progress / 100 })
      }
    }

    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
      progress_callback: progressCallback
    })

    const audioData = Float32Array.from(Object.values(workerData.audioBuffer as Record<string, number>))
    const result = await transcriber(audioData, { language: 'english', task: 'transcribe' }) as { text: string }

    parentPort?.postMessage({ type: 'result', text: result.text.trim() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    parentPort?.postMessage({ type: 'error', message })
  }
}

run()
