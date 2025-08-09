/**
 * Security Middleware Integration
 * Next.js 미들웨어와 Rate Limiting 통합 시스템
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getActionFromPath,
  ActionCategory,
  ActionType,
  ACTION_CONFIG,
} from './actions'

// Re-export for middleware.ts
export { ActionCategory } from './actions'

// Edge Runtime에서 사용 가능한 간단한 해시 함수
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export interface RateLimitMiddlewareConfig {
  enabled: boolean
  bypassPaths?: string[]
  customRules?: Map<string, RateLimitRule>
  defaultLimits?: {
    anonymous: number
    authenticated: number
    verified: number
  }
  trustScoreBonus?: boolean
  enablePatternDetection?: boolean
  enableAbuseTracking?: boolean
}

export interface RateLimitRule {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

export interface RateLimitResponse {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number
  reason?: string
  requiresChallenge?: boolean
}

// 기본 설정
const DEFAULT_CONFIG: RateLimitMiddlewareConfig = {
  enabled: true,
  bypassPaths: [
    '/_next',
    '/favicon.ico',
    '/.well-known',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
  ],
  defaultLimits: {
    anonymous: 60, // 1분당 60 요청
    authenticated: 120, // 1분당 120 요청
    verified: 180, // 1분당 180 요청
  },
  trustScoreBonus: true,
  enablePatternDetection: true,
  enableAbuseTracking: true,
}

// Action Type별 기본 제한
const ACTION_TYPE_LIMITS: Record<ActionType, RateLimitRule> = {
  [ActionType.READ]: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  [ActionType.WRITE]: {
    windowMs: 60 * 1000,
    maxRequests: 30, // 댓글, 게시글 작성 - 1분당 30개로 증가
  },
  [ActionType.SENSITIVE]: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  [ActionType.CRITICAL]: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
  [ActionType.ADMIN]: {
    windowMs: 60 * 1000,
    maxRequests: 50,
  },
}

export class RateLimitMiddleware {
  private config: RateLimitMiddlewareConfig
  private requestCounts: Map<string, { count: number; resetAt: number }>

  constructor(config?: Partial<RateLimitMiddlewareConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.requestCounts = new Map()
  }

  /**
   * 미들웨어 처리 함수
   */
  async handle(request: NextRequest): Promise<NextResponse | null> {
    // 비활성화 상태면 통과
    if (!this.config.enabled) {
      return null
    }

    const pathname = request.nextUrl.pathname

    // bypass 경로 체크
    if (this.shouldBypass(pathname)) {
      return null
    }

    // API 경로가 아니면 통과
    if (!pathname.startsWith('/api/')) {
      return null
    }

    // Rate Limiting 체크
    const result = await this.checkRateLimit(request)

    if (!result.allowed) {
      return this.createRateLimitResponse(result)
    }

    // 요청 통과 시 헤더 추가
    const response = NextResponse.next()
    this.addRateLimitHeaders(response, result)

    return response
  }

  /**
   * Rate Limit 체크
   */
  private async checkRateLimit(
    request: NextRequest
  ): Promise<RateLimitResponse> {
    const method = request.method
    const pathname = request.nextUrl.pathname

    // Action 분류
    const action = getActionFromPath(method, pathname)
    if (!action) {
      // 알 수 없는 액션은 기본 제한 적용
      return this.applyDefaultLimit(request)
    }

    // 사용자 식별
    const identifier = await this.getUserIdentifier(request)

    // 커스텀 룰 체크
    const customRule = this.config.customRules?.get(action)
    if (customRule) {
      return this.applyCustomRule(request, identifier, customRule)
    }

    // Action Type별 제한 적용
    return this.applyActionTypeLimit(request, identifier, action)
  }

  /**
   * 사용자 식별자 생성
   */
  private async getUserIdentifier(request: NextRequest): Promise<string> {
    // 우선순위: userId > sessionId > IP

    // 1. Authorization 헤더에서 userId 추출 시도 (실제로는 JWT 디코딩 필요)
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // Edge Runtime에서는 JWT 검증이 제한적이므로 간단한 해시 사용
      return `auth:${simpleHash(authHeader)}`
    }

    // 2. 세션 쿠키 확인
    const sessionCookie =
      request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token')
    if (sessionCookie) {
      return `session:${simpleHash(sessionCookie.value)}`
    }

    // 3. Visitor 세션 확인
    const visitorSession = request.cookies.get('visitor_session')
    if (visitorSession) {
      return `visitor:${visitorSession.value}`
    }

    // 4. IP 주소 (Vercel/Cloudflare 헤더 우선)
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'

    return `ip:${ip.split(',')[0].trim()}`
  }

  /**
   * 기본 제한 적용
   */
  private applyDefaultLimit(request: NextRequest): RateLimitResponse {
    const identifier = `default:${request.nextUrl.pathname}`
    const limit = this.config.defaultLimits?.anonymous || 60

    return this.checkLimit(identifier, limit, 60 * 1000)
  }

  /**
   * 커스텀 룰 적용
   */
  private applyCustomRule(
    request: NextRequest,
    identifier: string,
    rule: RateLimitRule
  ): RateLimitResponse {
    const key = rule.keyGenerator ? rule.keyGenerator(request) : identifier
    return this.checkLimit(key, rule.maxRequests, rule.windowMs)
  }

  /**
   * Action Type별 제한 적용
   */
  private applyActionTypeLimit(
    request: NextRequest,
    identifier: string,
    action: ActionCategory
  ): RateLimitResponse {
    const metadata = ACTION_CONFIG[action]
    if (!metadata) {
      return this.applyDefaultLimit(request)
    }

    const rule = ACTION_TYPE_LIMITS[metadata.type]
    const key = `${identifier}:${action}`

    // Trust Score 보너스 적용 (Edge Runtime에서는 제한적)
    let maxRequests = rule.maxRequests
    if (this.config.trustScoreBonus && identifier.startsWith('auth:')) {
      // 인증된 사용자는 2배 보너스
      maxRequests *= 2
    }

    return this.checkLimit(key, maxRequests, rule.windowMs)
  }

  /**
   * 실제 제한 체크 (메모리 기반)
   */
  private checkLimit(
    key: string,
    limit: number,
    windowMs: number
  ): RateLimitResponse {
    const now = Date.now()
    const resetAt = now + windowMs

    // 현재 카운트 가져오기
    const current = this.requestCounts.get(key)

    if (!current || current.resetAt <= now) {
      // 새 윈도우 시작
      this.requestCounts.set(key, { count: 1, resetAt })

      // 메모리 정리 (오래된 항목 제거)
      this.cleanupOldEntries(now)

      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetAt: new Date(resetAt),
      }
    }

    // 카운트 증가
    current.count++

    if (current.count > limit) {
      // 제한 초과
      const retryAfter = Math.ceil((current.resetAt - now) / 1000)
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: new Date(current.resetAt),
        retryAfter,
        reason: 'Rate limit exceeded',
      }
    }

    return {
      allowed: true,
      limit,
      remaining: limit - current.count,
      resetAt: new Date(current.resetAt),
    }
  }

  /**
   * 오래된 항목 정리
   */
  private cleanupOldEntries(now: number): void {
    // 메모리 효율을 위해 오래된 항목 제거
    if (this.requestCounts.size > 1000) {
      const toDelete: string[] = []

      for (const [key, value] of this.requestCounts) {
        if (value.resetAt <= now) {
          toDelete.push(key)
        }
      }

      toDelete.forEach((key) => this.requestCounts.delete(key))
    }
  }

  /**
   * Bypass 여부 확인
   */
  private shouldBypass(pathname: string): boolean {
    if (!this.config.bypassPaths) return false

    return this.config.bypassPaths.some((path) => pathname.startsWith(path))
  }

  /**
   * Rate Limit 응답 생성
   */
  private createRateLimitResponse(result: RateLimitResponse): NextResponse {
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message:
          result.reason || 'Rate limit exceeded. Please try again later.',
        retryAfter: result.retryAfter,
        resetAt: result.resetAt,
      },
      { status: 429 }
    )

    // Rate Limit 헤더 추가
    this.addRateLimitHeaders(response, result)

    // Retry-After 헤더
    if (result.retryAfter) {
      response.headers.set('Retry-After', result.retryAfter.toString())
    }

    return response
  }

  /**
   * Rate Limit 헤더 추가
   */
  private addRateLimitHeaders(
    response: NextResponse,
    result: RateLimitResponse
  ): void {
    response.headers.set('X-RateLimit-Limit', result.limit.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString())

    if (result.requiresChallenge) {
      response.headers.set('X-RateLimit-Challenge', 'required')
    }
  }
}

// Singleton 인스턴스
let middlewareInstance: RateLimitMiddleware | null = null

/**
 * Rate Limit 미들웨어 초기화
 */
export function initRateLimitMiddleware(
  config?: Partial<RateLimitMiddlewareConfig>
): RateLimitMiddleware {
  if (!middlewareInstance) {
    middlewareInstance = new RateLimitMiddleware(config)
  }
  return middlewareInstance
}

/**
 * Next.js 미들웨어 통합 헬퍼
 */
export async function withRateLimit(
  request: NextRequest,
  config?: Partial<RateLimitMiddlewareConfig>
): Promise<NextResponse | null> {
  const middleware = initRateLimitMiddleware(config)
  return middleware.handle(request)
}

/**
 * 커스텀 룰 생성 헬퍼
 */
export function createRateLimitRule(
  windowMs: number,
  maxRequests: number,
  options?: Partial<RateLimitRule>
): RateLimitRule {
  return {
    windowMs,
    maxRequests,
    ...options,
  }
}

/**
 * API Route Handler 래퍼
 */
export function withRateLimitHandler(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    // Edge Runtime API Route에서 사용
    // 실제로는 Redis 기반 rate limiting이 필요하지만
    // Edge Runtime 제약으로 간단한 체크만 수행

    try {
      // Rate Limit 헤더 체크
      const remaining = req.headers.get('X-RateLimit-Remaining')
      if (remaining && parseInt(remaining) <= 0) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        )
      }

      // 핸들러 실행
      return await handler(req)
    } catch (error) {
      console.error('Rate limit handler error:', error)
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred processing your request',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
  }
}
