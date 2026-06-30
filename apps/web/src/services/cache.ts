import { redis } from '@/lib/redis'

const CACHE_TTL = {
  SEARCH: 60 * 60 * 24,      // 24 hours
  DETAILS: 60 * 60 * 24,     // 24 hours
  SOURCES: 60 * 60 * 12,     // 12 hours
  EPISODES: 60 * 60 * 24,    // 24 hours
  TRENDING: 60 * 60 * 6,     // 6 hours
}

function cacheKey(prefix: string, key: string): string {
  return `watchmode:${prefix}:${key}`
}

export async function getCached<T>(prefix: string, key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const fullKey = cacheKey(prefix, key)
    const data = await redis.get<T>(fullKey)
    return data ?? null
  } catch {
    return null
  }
}

export async function setCache<T>(
  prefix: string,
  key: string,
  data: T,
  ttl: number = CACHE_TTL.DETAILS
): Promise<void> {
  if (!redis) return
  try {
    const fullKey = cacheKey(prefix, key)
    await redis.set(fullKey, data, { ex: ttl })
  } catch {
    // Silently fail — cache is optional
  }
}

export async function invalidateCache(prefix: string, key?: string): Promise<void> {
  if (!redis) return
  try {
    if (key) {
      await redis.del(cacheKey(prefix, key))
    } else {
      // Scan and delete all keys with prefix
      let cursor = '0'
      do {
        const result = await redis.scan(cursor, { match: `watchmode:${prefix}:*`, count: 100 })
        cursor = result[0]
        const keys = result[1]
        if (keys.length > 0) {
          await redis.del(...keys)
        }
      } while (cursor !== '0')
    }
  } catch {
    // Silently fail
  }
}

export { CACHE_TTL }
