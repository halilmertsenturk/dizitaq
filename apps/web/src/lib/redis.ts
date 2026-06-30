import { Redis } from '@upstash/redis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('REDIS_URL not configured — caching disabled')
    }
    return null
  }

  try {
    return new Redis({ url, token })
  } catch {
    console.warn('Failed to initialize Redis — caching disabled')
    return null
  }
}

export const redis: Redis | null =
  globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}
