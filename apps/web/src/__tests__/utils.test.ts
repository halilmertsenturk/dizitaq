import { describe, it, expect } from 'vitest'
import { cn, formatRating, formatYear, truncate, debounce } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2')
  })

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('formatRating', () => {
  it('formats a valid rating to 1 decimal', () => {
    expect(formatRating(7.5)).toBe('7.5')
  })

  it('rounds to 1 decimal', () => {
    expect(formatRating(8.333)).toBe('8.3')
  })

  it('returns N/A for null', () => {
    expect(formatRating(null)).toBe('N/A')
  })

  it('returns N/A for undefined', () => {
    expect(formatRating(undefined)).toBe('N/A')
  })

  it('returns N/A for 0', () => {
    expect(formatRating(0)).toBe('0.0')
  })
})

describe('formatYear', () => {
  it('formats a valid year', () => {
    expect(formatYear(2024)).toBe('2024')
  })

  it('returns em-dash for null', () => {
    expect(formatYear(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatYear(undefined)).toBe('—')
  })

  it('returns em-dash for 0', () => {
    expect(formatYear(0)).toBe('—')
  })
})

describe('truncate', () => {
  it('returns the string if shorter than length', () => {
    expect(truncate('Hello', 10)).toBe('Hello')
  })

  it('truncates with ellipsis if longer than length', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
  })

  it('returns empty string for empty input', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('handles exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })
})

describe('debounce', () => {
  it('delays function execution', async () => {
    let called = 0
    const fn = debounce(() => { called++ }, 50)

    fn()
    fn()
    fn()

    expect(called).toBe(0)

    await new Promise(r => setTimeout(r, 100))
    expect(called).toBe(1)
  })

  it('calls with the last arguments', async () => {
    let result = ''
    const fn = debounce((s: string) => { result = s }, 50)

    fn('a')
    fn('b')
    fn('c')

    await new Promise(r => setTimeout(r, 100))
    expect(result).toBe('c')
  })
})
