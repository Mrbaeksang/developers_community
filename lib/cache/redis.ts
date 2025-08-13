import { redis } from '@/lib/core/redis'

// Re-export redis for convenience
export { redis }

/**
 * Redis 캐시 TTL 설정 (초 단위)
 * 프로덕션 환경 최적화 - 사용자 경험 우선
 */
export const REDIS_TTL = {
  // 조회수 버퍼 (매우 짧음)
  VIEW_BUFFER: 60, // 1분
  // API 응답 - TTFB 개선을 위한 적극적 캐싱
  API_SHORT: 30, // 30초 (게시글 목록 - 빠른 응답 우선)
  API_MEDIUM: 300, // 5분 (검색 결과, 카테고리 목록 - 증가)
  API_LONG: 1800, // 30분 (집계 데이터, 트렌딩 - 증가)
  // 정적 데이터 (변경 빈도가 낮음)
  API_STATIC: 3600, // 1시간 (카테고리, 태그 목록)
  // 세션 데이터
  SESSION: 86400, // 24시간
} as const

/**
 * Redis 캐시 키 접두사
 */
export const REDIS_KEYS = {
  // 조회수
  postViews: (postId: string) => `post:${postId}:views`,
  postDailyViews: (postId: string, date: string) =>
    `post:${postId}:views:${date}`,
  communityPostViews: (postId: string) => `community:post:${postId}:views`,
  communityPostDailyViews: (postId: string, date: string) =>
    `community:post:${postId}:views:${date}`,

  // API 캐싱
  apiCache: (endpoint: string, params: string) =>
    `api:cache:${endpoint}:${params}`,

  // 사용자 세션
  userSession: (sessionId: string) => `session:${sessionId}`,

  // 속도 제한
  rateLimit: (key: string) => `rate:${key}`,
} as const

/**
 * Redis 캐시 래퍼 클래스
 */
export class RedisCache {
  private client: ReturnType<typeof redis>
  private inFlightRequests: Map<string, Promise<unknown>>

  constructor() {
    this.client = redis()
    this.inFlightRequests = new Map()
  }

  /**
   * 캐시된 값 가져오기 (자동 JSON 파싱)
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
   * 캐시 값 설정 (자동 JSON 직렬화 및 TTL)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.client) return false

    try {
      // BigInt 직렬화 처리
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
   * 캐시된 값 삭제
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
   * 패턴과 일치하는 키 삭제
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
   * 키 존재 여부 확인
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
   * 기존 키에 만료 시간 설정
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
   * 캐시 값 가져오거나 설정 (cache-aside 패턴)
   * 동시 요청 중복 방지 기능 포함
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 캐시에서 먼저 조회
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 이미 진행 중인 동일한 요청이 있는지 확인
    const inFlight = this.inFlightRequests.get(key)
    if (inFlight) {
      return (await inFlight) as T
    }

    // 새로운 Promise 생성
    const promise = factory()
      .then(async (value) => {
        // 캐시에 저장
        await this.set(key, value, ttl).catch(() => {
          // 로그만 남기고 에러는 던지지 않음 - 캐시 실패가 앱을 중단시키면 안됨
          console.error(`Failed to cache value for key: ${key}`)
        })

        // 진행 중 요청 추적 정리
        this.inFlightRequests.delete(key)
        return value
      })
      .catch((error) => {
        // 에러 시에도 정리
        this.inFlightRequests.delete(key)
        throw error
      })

    // 진행 중 요청 추적
    this.inFlightRequests.set(key, promise)

    return await promise
  }

  /**
   * 여러 패턴의 캐시 키 무효화
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

// 싱글톤 인스턴스 내보내기
export const redisCache = new RedisCache()

/**
 * 요청 파라미터로 캐시 키 생성
 * 긴 키는 해시 처리
 */
export function generateCacheKey(
  endpoint: string,
  params: Record<string, unknown>
): string {
  // 일관된 키를 위해 파라미터 정렬
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

  // 키가 너무 길면 해시 사용
  if (paramString.length > 200) {
    // Node.js crypto 모듈로 해싱
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto')
    const hash = crypto.createHash('sha256').update(paramString).digest('hex')
    return REDIS_KEYS.apiCache(endpoint, hash.substring(0, 16)) // 해시의 처음 16자만 사용
  }

  return REDIS_KEYS.apiCache(endpoint, paramString)
}

/**
 * API 라우트용 캐시 데코레이터
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

    // 캐시에서 조회
    const cached = await redisCache.get(key)
    if (cached !== null) {
      return cached
    }

    // 함수 실행
    const result = await fn(...args)

    // 결과 캐싱
    await redisCache.set(key, result, options.ttl)

    // 제공된 패턴 무효화
    if (options.invalidatePatterns) {
      await redisCache.invalidatePattern(options.invalidatePatterns)
    }

    return result
  }) as T
}
