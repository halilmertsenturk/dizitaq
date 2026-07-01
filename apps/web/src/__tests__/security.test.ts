import { describe, it, expect, vi } from 'vitest'
import {
  emailSchema,
  passwordSchema,
  nameSchema,
  registerSchema,
  sanitize,
  parseId,
  isValidOrigin,
  getBodySize,
  BODY_SIZE_LIMIT,
} from '@/lib/security'

describe('Input validation schemas', () => {
  describe('emailSchema', () => {
    it('accepts valid emails', () => {
      expect(emailSchema.parse('test@example.com')).toBe('test@example.com')
      expect(emailSchema.parse('user+tag@domain.co.uk')).toBe('user+tag@domain.co.uk')
    })

    it('rejects invalid emails', () => {
      expect(() => emailSchema.parse('')).toThrow()
      expect(() => emailSchema.parse('not-an-email')).toThrow()
      expect(() => emailSchema.parse('@domain.com')).toThrow()
      expect(() => emailSchema.parse('user@')).toThrow()
    })

    it('rejects emails exceeding max length', () => {
      const long = 'a'.repeat(256) + '@b.com'
      expect(() => emailSchema.parse(long)).toThrow('Email too long')
    })
  })

  describe('passwordSchema', () => {
    it('accepts strong passwords', () => {
      expect(passwordSchema.parse('Password1')).toBe('Password1')
      expect(passwordSchema.parse('MyP@ssw0rd!')).toBe('MyP@ssw0rd!')
      expect(passwordSchema.parse('LongEnoughPassword99')).toBe('LongEnoughPassword99')
    })

    it('rejects passwords shorter than 8 characters', () => {
      expect(() => passwordSchema.parse('Ab1')).toThrow('at least 8')
      expect(() => passwordSchema.parse('Ab12345')).toThrow('at least 8')
    })

    it('rejects passwords without uppercase', () => {
      expect(() => passwordSchema.parse('password123')).toThrow('uppercase')
    })

    it('rejects passwords without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow('lowercase')
    })

    it('rejects passwords without digits', () => {
      expect(() => passwordSchema.parse('PasswordNoDigit')).toThrow('digit')
    })

    it('rejects passwords exceeding max length', () => {
      const long = 'A1' + 'a'.repeat(200)
      expect(() => passwordSchema.parse(long)).toThrow('too long')
    })
  })

  describe('nameSchema', () => {
    it('accepts valid names', () => {
      expect(nameSchema.parse('John')).toBe('John')
      expect(nameSchema.parse('  Jane  ')).toBe('Jane')
    })

    it('rejects empty names', () => {
      expect(() => nameSchema.parse('')).toThrow('Name is required')
    })

    it('rejects names exceeding max length', () => {
      expect(() => nameSchema.parse('a'.repeat(101))).toThrow('too long')
    })

    it('trims whitespace', () => {
      expect(nameSchema.parse('  Test User  ')).toBe('Test User')
    })
  })

  describe('registerSchema', () => {
    it('accepts valid registration payloads', () => {
      const result = registerSchema.safeParse({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
      })
      expect(result.success).toBe(true)
    })

    it('rejects with missing fields', () => {
      expect(registerSchema.safeParse({ name: 'Test', email: 'test@example.com' }).success).toBe(false)
      expect(registerSchema.safeParse({ name: 'Test', password: 'Password123' }).success).toBe(false)
      expect(registerSchema.safeParse({ email: 'test@example.com', password: 'Password123' }).success).toBe(false)
    })

    it('rejects with invalid field types', () => {
      expect(registerSchema.safeParse({ name: 'Test', email: 'test@example.com', password: 12345 }).success).toBe(false)
      expect(registerSchema.safeParse({ name: 123, email: 'test@example.com', password: 'Password123' }).success).toBe(false)
    })
  })
})

describe('XSS sanitize', () => {
  it('escapes HTML special characters', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    expect(sanitize("test'value")).toBe('test&#x27;value')
    expect(sanitize('a&b')).toBe('a&amp;b')
  })

  it('passes safe strings through unchanged', () => {
    expect(sanitize('hello world')).toBe('hello world')
    expect(sanitize('')).toBe('')
    expect(sanitize('12345')).toBe('12345')
  })
})

describe('parseId', () => {
  it('parses valid numeric strings', () => {
    expect(parseId('123')).toBe(123)
    expect(parseId('0')).toBe(0)
    expect(parseId('1')).toBe(1)
  })

  it('returns null for null or undefined input', () => {
    expect(parseId(null)).toBeNull()
    expect(parseId(undefined as unknown as string)).toBeNull()
  })

  it('returns null for non-numeric strings', () => {
    expect(parseId('abc')).toBeNull()
    expect(parseId('12abc')).toBeNull()
    expect(parseId('')).toBeNull()
  })

  it('parses with radix 10', () => {
    expect(parseId('010')).toBe(10)
    expect(parseId('0x1A')).toBeNull()
    expect(parseId('  5')).toBe(5)
  })
})

describe('CSRF origin validation', () => {
  function createRequest(origin: string | null, referer: string | null): Request {
    const headers: Record<string, string> = {}
    if (origin) headers['origin'] = origin
    if (referer) headers['referer'] = referer
    return new Request('http://localhost:3000/api/test', { method: 'POST', headers })
  }

  it('accepts requests from allowed origins', () => {
    const req = createRequest('http://localhost:3000', null)
    expect(isValidOrigin(req)).toBe(true)
  })

  it('rejects requests from unknown origins', () => {
    const req = createRequest('https://evil-site.com', null)
    expect(isValidOrigin(req)).toBe(false)
  })

  it('falls back to referer when origin is missing', () => {
    const req = createRequest(null, 'http://localhost:3000/api/test')
    expect(isValidOrigin(req)).toBe(true)
  })

  it('rejects requests with no origin or referer', () => {
    const req = createRequest(null, null)
    expect(isValidOrigin(req)).toBe(false)
  })

  it('rejects requests from evil referer', () => {
    const req = createRequest(null, 'https://evil-site.com/api/steal')
    expect(isValidOrigin(req)).toBe(false)
  })

  it('rejects when origin and referer are both malicious', () => {
    const req = createRequest('https://attacker.com', 'https://attacker.com/page')
    expect(isValidOrigin(req)).toBe(false)
  })
})

describe('Body size enforcement', () => {
  it('reads content-length header', () => {
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': '5000' },
    })
    expect(getBodySize(req)).toBe(5000)
  })

  it('returns 0 when content-length is missing', () => {
    const req = new Request('http://localhost:3000/api/test', { method: 'POST' })
    expect(getBodySize(req)).toBe(0)
  })

  it('allows requests within size limit', () => {
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': String(BODY_SIZE_LIMIT) },
    })
    expect(getBodySize(req)).toBeLessThanOrEqual(BODY_SIZE_LIMIT)
  })

  it('rejects requests exceeding size limit', () => {
    const req = new Request('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'content-length': String(BODY_SIZE_LIMIT + 1) },
    })
    expect(getBodySize(req)).toBeGreaterThan(BODY_SIZE_LIMIT)
  })
})
