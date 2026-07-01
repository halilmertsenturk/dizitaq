import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockPrisma = {
  user: { findUnique: vi.fn() },
  cachedTitle: { findUnique: vi.fn(), upsert: vi.fn() },
  watchlist: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

const mockGetServerSession = vi.fn()
vi.mock('next-auth', () => ({
  getServerSession: () => mockGetServerSession(),
}))

const mockGetTitleDetails = vi.fn()
vi.mock('@/services/watchmode', () => ({
  getTitleDetails: () => mockGetTitleDetails(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function getHandlers() {
  return await import('@/app/api/watchlist/route')
}

function createRequest(method: string, body?: unknown, searchParams?: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/watchlist')
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v)
    }
  }
  return new NextRequest(url, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

describe('GET /api/watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const { GET } = await getHandlers()
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 401 when session has no email', async () => {
    mockGetServerSession.mockResolvedValue({ user: { name: 'Test' } })

    const { GET } = await getHandlers()
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns watchlist entries for authenticated user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.watchlist.findMany.mockResolvedValue([
      { id: 'wl-1', titleId: 'title-1', addedAt: new Date(), title: { title: 'Breaking Bad', watchmodeId: 1, poster: null } },
    ])

    const { GET } = await getHandlers()
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].title.title).toBe('Breaking Bad')
  })
})

describe('POST /api/watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const { POST } = await getHandlers()
    const req = createRequest('POST', { watchmodeId: 1 })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when watchmodeId is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })

    const { POST } = await getHandlers()
    const req = createRequest('POST', {})
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('watchmodeId')
  })

  it('returns 400 when watchmodeId is not a number', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })

    const { POST } = await getHandlers()
    const req = createRequest('POST', { watchmodeId: 'abc' })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('watchmodeId')
  })

  it('creates a new watchlist entry', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.cachedTitle.findUnique.mockResolvedValue(null)
    mockGetTitleDetails.mockResolvedValue({
      title: 'Breaking Bad',
      type: 'series',
      year: 2008,
      genres: ['Drama'],
      poster: null,
      rating: null,
      plot: null,
      imdb_id: null,
      tmdb_id: null,
    })
    mockPrisma.cachedTitle.upsert.mockResolvedValue({ id: 'title-1' })
    mockPrisma.watchlist.findUnique.mockResolvedValue(null)
    mockPrisma.watchlist.create.mockResolvedValue({ id: 'wl-1', userId: 'user-1', titleId: 'title-1' })

    const { POST } = await getHandlers()
    const req = createRequest('POST', { watchmodeId: 123 })
    const response = await POST(req)

    expect(response.status).toBe(201)
    const json = await response.json()
    expect(json.id).toBe('wl-1')
    expect(mockPrisma.cachedTitle.upsert).toHaveBeenCalled()
    expect(mockGetTitleDetails).toHaveBeenCalled()
  })

  it('returns 200 when already in watchlist', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.cachedTitle.findUnique.mockResolvedValue({ id: 'title-1' })
    mockPrisma.watchlist.findUnique.mockResolvedValue({ id: 'wl-1' })

    const { POST } = await getHandlers()
    const req = createRequest('POST', { watchmodeId: 123 })
    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toBe('Already in watchlist')
  })
})

describe('DELETE /api/watchlist', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const { DELETE } = await getHandlers()
    const req = createRequest('DELETE', undefined, { watchmodeId: '1' })
    const response = await DELETE(req)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 400 when watchmodeId is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })

    const { DELETE } = await getHandlers()
    const req = createRequest('DELETE')
    const response = await DELETE(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('watchmodeId')
  })

  it('removes a watchlist entry', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'test@example.com' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
    mockPrisma.cachedTitle.findUnique.mockResolvedValue({ id: 'title-1', watchmodeId: 123 })
    mockPrisma.watchlist.delete.mockResolvedValue({ id: 'wl-1' })

    const { DELETE } = await getHandlers()
    const req = createRequest('DELETE', undefined, { watchmodeId: '123' })
    const response = await DELETE(req)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toBe('Removed from watchlist')
  })
})
