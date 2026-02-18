import { describe, it, expect, vi } from 'vitest'

import { computeScore } from '../src/core/score.js'
import { validateLLM } from '../src/core/validate.js'
import { validateAndDecide, llmGuardMiddleware } from '../src/core/helpers.js'

describe('core library tests', () => {
  it('computeScore applies penalties and floors at 0', () => {
    const issues = [
      { severity: 'high' },
      { severity: 'medium' },
      { severity: 'low' }
    ]
    expect(computeScore(issues)).toBe(100 - (15 + 8 + 3))

    // large penalties should floor to 0
    const manyHigh = Array(10).fill({ severity: 'high' })
    expect(computeScore(manyHigh)).toBe(0)
  })

  it('validateLLM respects JSON schema and returns issues for invalid object', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string' }
      },
      required: ['a']
    }
    const res = validateLLM({}, { schema })
    expect(res).toHaveProperty('issues')
    expect(res.issues.length).toBeGreaterThan(0)
    expect(res.ok).toBe(false)
    expect(typeof res.score).toBe('number')
  })

  it('validateLLM verbose returns meta and summary', () => {
    const res = validateLLM('just a harmless string', { verbose: true })
    expect(res).toHaveProperty('summary')
    expect(res).toHaveProperty('meta')
    expect(res.meta).toHaveProperty('inputType')
    expect(res.meta.inputType).toBe('string')
  })

  it('validateAndDecide returns allowed based on threshold', () => {
    const { allowed, report } = validateAndDecide('hello world', {}, 100)
    // score for a harmless string should be 100 -> allowed true when threshold <= 100
    expect(typeof report.score).toBe('number')
    expect(allowed).toBe(report.score >= 100)
  })

  it('llmGuardMiddleware blocks when below threshold and forwards when allowed', () => {
    const req1 = { body: { output: 'hello' } }
    const res1 = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next1 = vi.fn()
    // set threshold higher than perfect score to force block
    const mwBlock = llmGuardMiddleware({ threshold: 101 })
    mwBlock(req1, res1, next1)
    expect(res1.status).toHaveBeenCalledWith(422)
    expect(res1.json).toHaveBeenCalled()

    // now allow path
    const req2 = { body: { output: 'hello' } }
    const res2 = { status: vi.fn().mockReturnThis(), json: vi.fn() }
    const next2 = vi.fn()
    const mwAllow = llmGuardMiddleware({ threshold: 50 })
    mwAllow(req2, res2, next2)
    expect(next2).toHaveBeenCalled()
  })
})
