import { describe, it, expect } from 'vitest'
import { GENRES, PLATFORM_COLORS, PLATFORM_LOGOS } from '@dizitaq/shared'

describe('GENRES', () => {
  it('contains 18 genres', () => {
    expect(GENRES).toHaveLength(18)
  })

  it('includes known genres', () => {
    expect(GENRES).toContain('Action')
    expect(GENRES).toContain('Comedy')
    expect(GENRES).toContain('Drama')
  })

  it('has no duplicates', () => {
    expect(new Set(GENRES).size).toBe(GENRES.length)
  })
})

describe('PLATFORM_COLORS', () => {
  it('includes Netflix', () => {
    expect(PLATFORM_COLORS).toHaveProperty('Netflix')
  })

  it('includes Disney+', () => {
    expect(PLATFORM_COLORS).toHaveProperty('Disney+')
  })

  it('values are valid hex colors', () => {
    for (const color of Object.values(PLATFORM_COLORS)) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
})

describe('PLATFORM_LOGOS', () => {
  it('includes Netflix logo', () => {
    expect(PLATFORM_LOGOS).toHaveProperty('Netflix')
  })

  it('includes Disney+ logo', () => {
    expect(PLATFORM_LOGOS).toHaveProperty('Disney+')
  })

  it('logo values are non-empty strings', () => {
    for (const logo of Object.values(PLATFORM_LOGOS)) {
      expect(logo).toBeTruthy()
      expect(typeof logo).toBe('string')
    }
  })
})
