import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockPrisma = {
  user: { findUnique: vi.fn(), create: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

vi.mock('@/lib/redis', () => ({
  redis: null,
}))

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(() => 'hashed-password-123') },
  hash: vi.fn(() => 'hashed-password-123'),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:3000',
    },
  })
}

function validPayload() {
  return { name: 'Test User', email: 'test@example.com', password: 'Password123' }
}

describe('POST /api/auth/register', () => {
  it('creates a new user successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    })

    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest(validPayload())
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.id).toBe('user-1')
    expect(json.email).toBe('test@example.com')
    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
          hashedPassword: 'hashed-password-123',
        }),
      })
    )
  })

  it('returns 400 when name is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const { name, ...rest } = validPayload()
    const req = createRequest(rest)
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Required')
  })

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ name: 'Test User', password: 'Password123' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBeDefined()
  })

  it('returns 400 when password is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ name: 'Test User', email: 'test@example.com' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBeDefined()
  })

  it('returns 400 when password is too short', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ name: 'Test User', email: 'test@example.com', password: 'Ab1' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('at least 8')
  })

  it('returns 400 when password lacks uppercase', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ name: 'Test User', email: 'test@example.com', password: 'password123' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('uppercase')
  })

  it('returns 400 when password lacks digit', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ name: 'Test User', email: 'test@example.com', password: 'PasswordNoDigit' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('digit')
  })

  it('returns 400 when email is invalid format', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ name: 'Test User', email: 'not-an-email', password: 'Password123' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('Invalid email')
  })

  it('returns 409 when email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' })

    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest(validPayload())
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toBe('Email already in use')
  })

  it('returns 403 when origin is invalid (CSRF)', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(validPayload()),
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil-site.com',
      },
    })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toBe('CSRF validation failed')
  })
})
