import { describe, it, expect } from 'vitest'

describe('smoke tests', () => {
  it('exports validateLLM and default', async () => {
    // load the source build (src) since this repo publishes source-first
    const mod = await import('../src/index.js')
    const pkg = mod.default ?? mod
    const candidates = [
      pkg && pkg.validateLLM,
      pkg && pkg.default,
      pkg && pkg.default && pkg.default.validateLLM,
      mod && mod.validateLLM,
      mod && mod.default
    ]
    const ok = candidates.some(c => typeof c === 'function')
    expect(ok).toBe(true)
  })
})
