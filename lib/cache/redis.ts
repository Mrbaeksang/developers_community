import { redis } from '@/lib/core/redis'

/**
 * Redis cache TTL configurations (in seconds)
 */
export const REDIS_TTL = {
  // View counts buffer (very short)
  VIEW_BUFFER: 60, // 1 minute
  // API responses
  API_SHORT: 60, // 1 minute
  API_MEDIUM: 300, // 5 minutes
  API_LONG: 3600, // 1 hour
  // Session data
  SESSION: 86400, // 24 hours
} as const

/**
 * Redis cache key prefixes
 */
export const REDIS_KEYS = {
  // View counts
  postViews: (postId: string) => `post:${postId}:views`,
  postDailyViews: (postId: string, date: string) =>
    `post:${postId}:views:${date}`,
  communityPostViews: (postId: string) => `community:post:${postId}:views`,
  communityPostDailyViews: (postId: string, date: string) =>
    `community:post:${postId}:views:${date}`,

  // API caching
  apiCache: (endpoint: string, params: string) =>
    `api:cache:${endpoint}:${params}`,

  // User sessions
  userSession: (sessionId: string) => `session:${sessionId}`,

  // Rate limiting
  rateLimit: (key: string) => `rate:${key}`,
} as const

/**
 * Generic Redis cache wrapper
 */
export class RedisCache {
  private client: ReturnType<typeof redis>

  constructor() {
    this.client = redis()
  }

  /**
   * Get cached value with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null

    try {
      const value = await this.client.get(key)
      if (!value) return null

      return JSON.parse(value) as T
    } catch (error) {
      console.error('Redis cache get error:', error)
      return null
    }
  }

  /**
   * Set cached value with automatic JSON stringification and TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.client) return false

    try {
      // Handle BigInt serialization
      const stringValue = JSON.stringify(value, (key, val) =>
        typeof val === 'bigint' ? val.toString() : val
      )

      if (ttl) {
        await this.client.setex(key, ttl, stringValue)
      } else {
        await this.client.set(key, stringValue)
      }

      return true
    } catch (error) {
      console.error('Redis cache set error:', error)
      return false
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.client) return false

    try {
      if (Array.isArray(key)) {
        await this.client.del(...key)
      } else {
        await this.client.del(key)
      }
      return true
    } catch (error) {
      console.error('Redis cache del error:', error)
      return false
    }
  }

  /**
   * Delete keys matching a pattern
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.client) return false

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Redis cache delPattern error:', error)
      return false
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) return false

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.error('Redis cache exists error:', error)
      return false
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client) return false

    try {
      const result = await this.client.expire(key, ttl)
      return result === 1
    } catch (error) {
      console.error('Redis cache expire error:', error)
      return false
    }
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Generate value
    const value = await factory()

    // Set in cache (fire and forget)
    this.set(key, value, ttl).catch(() => {
      // Log but don't throw - cache write failures shouldn't break the app
      console.error(`Failed to cache value for key: ${key}`)
    })

    return value
  }

  /**
   * Invalidate multiple cache keys by pattern
   */
  async invalidatePattern(patterns: string[]): Promise<void> {
    if (!this.client) return

    try {
      for (const pattern of patterns) {
        await this.delPattern(pattern)
      }
    } catch (error) {
      console.error('Redis cache invalidation error:', error)
    }
  }
}

// Export singleton instance
export const redisCache = new RedisCache()

/**
 * Helper to generate cache key from request params
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, unknown>
): string {
  // Sort params for consistent keys
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key]
        }
        return acc
      },
      {} as Record<string, unknown>
    )

  const paramString = JSON.stringify(sortedParams)
  return REDIS_KEYS.apiCache(endpoint, paramString)
}

/**
 * Cache decorator for API routes
 */
export function withRedisCache<
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  fn: T,
  options: {
    ttl?: number
    keyGenerator: (...args: Parameters<T>) => string
    invalidatePatterns?: string[]
  }
): T {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator(...args)

    // Try to get from cache
    const cached = await redisCache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute function
    const result = await fn(...args)

    // Cache result
    await redisCache.set(key, result, options.ttl)

    // Invalidate patterns if provided
    if (options.invalidatePatterns) {
      await redisCache.invalidatePattern(options.invalidatePatterns)
    }

    return result
  }) as T
}
