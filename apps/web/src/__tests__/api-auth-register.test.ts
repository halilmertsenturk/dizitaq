import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockPrisma = {
  user: { findUnique: vi.fn(), create: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
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
    headers: { 'Content-Type': 'application/json' },
  })
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
    const req = createRequest({ name: 'Test User', email: 'test@example.com', password: 'password123' })
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

  it('returns 400 when email is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ password: 'password123' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Email and password are required')
  })

  it('returns 400 when password is missing', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ email: 'test@example.com' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Email and password are required')
  })

  it('returns 400 when password is too short', async () => {
    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ email: 'test@example.com', password: '12345' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Password must be at least 6 characters')
  })

  it('returns 409 when email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user', email: 'test@example.com' })

    const { POST } = await import('@/app/api/auth/register/route')
    const req = createRequest({ email: 'test@example.com', password: 'password123' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toBe('Email already in use')
  })
})
