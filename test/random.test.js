import { describe, it, expect } from 'vitest'

import { validateLLM } from '../src/core/validate.js'
import { validateAndDecide } from '../src/core/helpers.js'

// Deterministic RNG (LCG) so tests are 'random' but reproducible
function makeRng(seed = 42) {
  let s = seed >>> 0
  return () => {
    // constants from Numerical Recipes
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function randomValue(rng, depth = 0) {
  const types = ['string', 'number', 'boolean', 'null', 'object', 'array']
  // shallow bias to avoid very deep recursion
  if (depth > 3) types.splice(types.indexOf('object'), 1)
  const t = types[Math.floor(rng() * types.length)]
  switch (t) {
    case 'string':
      return `s_${Math.floor(rng() * 1e6)}`
    case 'number':
      return (rng() - 0.5) * 2e6
    case 'boolean':
      return rng() > 0.5
    case 'null':
      return null
    case 'array': {
      const len = Math.floor(rng() * 5)
      const arr = []
      for (let i = 0; i < len; i++) arr.push(randomValue(rng, depth + 1))
      return arr
    }
    case 'object': {
      const props = Math.floor(rng() * 5)
      const obj = {}
      for (let i = 0; i < props; i++) {
        obj[`k${i}`] = randomValue(rng, depth + 1)
      }
      return obj
    }
    default:
      return 'x'
  }
}

describe('randomized inputs (100) smoke', () => {
  it('handles 100 deterministic-random inputs of various types', () => {
    const rng = makeRng(12345)
    for (let i = 0; i < 100; i++) {
      const input = randomValue(rng)
      // Should not throw
      const report = validateLLM(input)
      // report shape checks
      expect(report).toHaveProperty('score')
      expect(typeof report.score).toBe('number')
      expect(report.score).toBeGreaterThanOrEqual(0)
      expect(report.score).toBeLessThanOrEqual(100)
      expect(report).toHaveProperty('issues')
      expect(Array.isArray(report.issues)).toBe(true)
      expect(report.ok).toBe(report.issues.length === 0)

      // validateAndDecide should return allowed/report and not throw
      const decide = validateAndDecide(input, {}, 70)
      expect(decide).toHaveProperty('allowed')
      expect(typeof decide.allowed).toBe('boolean')
      expect(decide).toHaveProperty('report')
      expect(decide.report.score).toBe(report.score)
    }
  })
})
