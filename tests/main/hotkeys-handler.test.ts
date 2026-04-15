import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAccelerator } from '../../src/main/ipc/hotkeys-handler'

describe('buildAccelerator', () => {
  it('returns the accelerator string as-is', () => {
    expect(buildAccelerator('Alt+Shift+N')).toBe('Alt+Shift+N')
  })

  it('handles single key accelerators', () => {
    expect(buildAccelerator('F1')).toBe('F1')
  })
})
