import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => {
  const mockVideoSource = {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({}),
  }
  const mockCachedTitle = {
    upsert: vi.fn().mockResolvedValue({}),
  }
  return {
    prisma: {
      videoSource: mockVideoSource,
      cachedTitle: mockCachedTitle,
      $transaction: vi.fn((args: unknown[]) => Promise.resolve(args.map(() => ({})))),
    },
  }
})

let lastUrl = ''
const mockResponseQueue: Array<{ ok: boolean; statusText?: string; status?: number; data: unknown }> = []

const mockFetch = vi.fn(async (url: string) => {
  lastUrl = url
  const next = mockResponseQueue.shift() ?? { ok: true, data: {} }
  return {
    ok: next.ok,
    statusText: next.statusText ?? 'OK',
    status: next.status ?? 200,
    json: async () => next.data,
  }
})

global.fetch = mockFetch as unknown as typeof global.fetch

function mockNextResponse(data: unknown) {
  mockResponseQueue.push({ ok: true, data })
}

function mockErrorResponse(statusText: string, status: number) {
  mockResponseQueue.push({ ok: false, statusText, status, data: {} })
}

beforeEach(() => {
  lastUrl = ''
  mockResponseQueue.length = 0
  vi.clearAllMocks()
})

describe('getTrending', () => {
  it('fetches trending titles with default params', async () => {
    mockNextResponse({
      titles: [
        { id: 1, title: 'Breaking Bad', year: 2008, type: 'tv_series', imdb_id: 'tt0903747', tmdb_id: 1396 },
        { id: 2, title: 'Inception', year: 2010, type: 'movie', imdb_id: 'tt1375666', tmdb_id: 27205 },
      ],
      page: 1, total_pages: 50, total_results: 1000,
    })

    const { getTrending } = await import('@/services/watchmode')
    const result = await getTrending()

    expect(result.titles).toHaveLength(2)
    expect(result.titles[0].title).toBe('Breaking Bad')
    expect(result.titles[0].type).toBe('series')
  })

  it('filters by type', async () => {
    mockNextResponse({ titles: [], page: 1, total_pages: 0, total_results: 0 })

    const { getTrending } = await import('@/services/watchmode')
    await getTrending(1, 20, 'movie')

    expect(lastUrl).toContain('types=movie')
  })

  it('handles empty response', async () => {
    mockNextResponse({ titles: [], page: 1, total_pages: 0, total_results: 0 })

    const { getTrending } = await import('@/services/watchmode')
    const result = await getTrending(999)

    expect(result.titles).toEqual([])
    expect(result.total).toBe(0)
  })
})

describe('getTitleDetails', () => {
  it('returns mapped title details', async () => {
    mockNextResponse({
      id: 123,
      title: 'The Matrix',
      plot_overview: 'A computer hacker learns about the true nature of reality.',
      user_rating: 8.7,
      genre_names: ['Action', 'Sci-Fi'],
      poster: 'https://example.com/poster.jpg',
      release_date: '1999-03-31',
      type: 'movie',
      year: 1999,
      imdb_id: 'tt0133093',
      tmdb_id: 603,
      runtime_minutes: 136,
      us_rating: 'R',
      networks: null,
      network_names: [],
      similar_titles: [124, 125],
      original_language: 'en',
      trailer: 'https://youtube.com/watch?v=vKQi3bBA1y8',
      backdrop: 'https://example.com/backdrop.jpg',
    })

    const { getTitleDetails } = await import('@/services/watchmode')
    const result = await getTitleDetails(123)

    expect(result.title).toBe('The Matrix')
    expect(result.type).toBe('movie')
    expect(result.rating).toBe(8.7)
    expect(result.genres).toContain('Action')
    expect(result.poster).toBe('https://example.com/poster.jpg')
    expect(result.imdb_id).toBe('tt0133093')
  })

  it('constructs correct endpoint URL', async () => {
    mockNextResponse({ id: 456, title: 'Test', type: 'movie', genre_names: [] })

    const { getTitleDetails } = await import('@/services/watchmode')
    await getTitleDetails(456)

    expect(lastUrl).toContain('/title/456/details')
    expect(lastUrl).toContain('apiKey=test-api-key')
  })
})

describe('searchTitles', () => {
  it('searches by query', async () => {
    mockNextResponse({
      title_results: [
        { id: 1, name: 'Interstellar', type: 'movie', year: 2014, imdb_id: 'tt0816692', tmdb_id: 157336 },
      ],
    })
    mockNextResponse({ poster: 'https://example.com/poster.jpg' })

    const { searchTitles } = await import('@/services/watchmode')
    const result = await searchTitles({ query: 'Interstellar' })

    expect(result.titles).toHaveLength(1)
    expect(result.titles[0].title).toBe('Interstellar')
    expect(result.titles[0].poster).toBe('https://example.com/poster.jpg')
  })

  it('browses with genre and year filters', async () => {
    mockNextResponse([{ id: 1, name: 'Action' }])
    mockNextResponse({
      titles: [{ id: 5, title: 'Die Hard', year: 1988, type: 'movie', imdb_id: 'tt0095016', tmdb_id: 562 }],
      page: 1, total_pages: 1, total_results: 1,
    })

    const { searchTitles } = await import('@/services/watchmode')
    const result = await searchTitles({ genre: 'Action', year: '1988' })

    expect(result.titles).toHaveLength(1)
    expect(result.titles[0].title).toBe('Die Hard')
  })
})
