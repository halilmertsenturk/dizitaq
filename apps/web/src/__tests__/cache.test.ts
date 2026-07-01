import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  scan: vi.fn(),
}

vi.mock('@/lib/redis', () => ({
  redis: mockRedis,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CACHE_TTL', () => {
  it('exports TTL constants', async () => {
    const { CACHE_TTL } = await import('@/services/cache')
    expect(CACHE_TTL.SEARCH).toBe(86400)
    expect(CACHE_TTL.DETAILS).toBe(86400)
    expect(CACHE_TTL.SOURCES).toBe(43200)
    expect(CACHE_TTL.EPISODES).toBe(86400)
    expect(CACHE_TTL.TRENDING).toBe(21600)
    expect(CACHE_TTL.BROWSE).toBe(21600)
    expect(CACHE_TTL.GENRES).toBe(604800)
  })
})

describe('getCached', () => {
  it('returns cached data when key exists', async () => {
    mockRedis.get.mockResolvedValue({ title: 'Breaking Bad' })
    const { getCached } = await import('@/services/cache')

    const result = await getCached<{ title: string }>('details', '/title/123/details?apiKey=test')

    expect(result).toEqual({ title: 'Breaking Bad' })
    expect(mockRedis.get).toHaveBeenCalledWith('watchmode:details:/title/123/details?apiKey=test')
  })

  it('returns null when key does not exist', async () => {
    mockRedis.get.mockResolvedValue(null)
    const { getCached } = await import('@/services/cache')

    const result = await getCached('trending', 'some-key')

    expect(result).toBeNull()
  })

  it('returns null on Redis error', async () => {
    mockRedis.get.mockRejectedValue(new Error('Connection failed'))
    const { getCached } = await import('@/services/cache')

    const result = await getCached('details', 'key')

    expect(result).toBeNull()
  })
})

describe('setCache', () => {
  it('stores data with default TTL', async () => {
    mockRedis.set.mockResolvedValue('OK')
    const { setCache } = await import('@/services/cache')

    await setCache('search', 'query-key', { titles: [] })

    expect(mockRedis.set).toHaveBeenCalledWith(
      'watchmode:search:query-key',
      { titles: [] },
      { ex: 86400 }
    )
  })

  it('stores data with custom TTL', async () => {
    mockRedis.set.mockResolvedValue('OK')
    const { setCache } = await import('@/services/cache')

    await setCache('genres', 'genres-key', ['Action', 'Comedy'], 604800)

    expect(mockRedis.set).toHaveBeenCalledWith(
      'watchmode:genres:genres-key',
      ['Action', 'Comedy'],
      { ex: 604800 }
    )
  })

  it('handles Redis error gracefully', async () => {
    mockRedis.set.mockRejectedValue(new Error('Write failed'))
    const { setCache } = await import('@/services/cache')

    await expect(setCache('test', 'key', 'data')).resolves.toBeUndefined()
  })
})

describe('invalidateCache', () => {
  it('deletes a specific key', async () => {
    mockRedis.del.mockResolvedValue(1)
    const { invalidateCache } = await import('@/services/cache')

    await invalidateCache('details', '/title/123/details')

    expect(mockRedis.del).toHaveBeenCalledWith('watchmode:details:/title/123/details')
  })

  it('scans and deletes all keys with prefix when no key given', async () => {
    mockRedis.scan
      .mockResolvedValueOnce(['5', ['key1', 'key2']])
      .mockResolvedValueOnce(['0', ['key3']])
    mockRedis.del.mockResolvedValue(3)
    const { invalidateCache } = await import('@/services/cache')

    await invalidateCache('trending')

    expect(mockRedis.scan).toHaveBeenCalledTimes(2)
    expect(mockRedis.del).toHaveBeenCalledWith('key1', 'key2')
    expect(mockRedis.del).toHaveBeenCalledWith('key3')
  })

  it('handles Redis error gracefully', async () => {
    mockRedis.del.mockRejectedValue(new Error('Delete failed'))
    const { invalidateCache } = await import('@/services/cache')

    await expect(invalidateCache('test', 'key')).resolves.toBeUndefined()
  })
})
