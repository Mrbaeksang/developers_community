/**
 * Compatibility Layer for Rate Limiting Migration
 * 기존 API 라우트를 새 Rate Limiting 시스템으로 점진적 마이그레이션
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from './rate-limiter'
import { AbuseTracker, AbuseType, RestrictionInfo } from './abuse-tracker'
import { PatternDetector } from './pattern-detector'
import { ActionCategory, getActionFromPath } from './actions'
import { withRateLimitHandler } from './middleware'

export interface RateLimitOptions {
  // 기본 옵션
  action?: ActionCategory
  skipAuth?: boolean
  skipTrustScore?: boolean

  // 레거시 호환 옵션
  maxRequests?: number
  windowMs?: number
  identifier?: string

  // 고급 옵션
  enablePatternDetection?: boolean
  enableAbuseTracking?: boolean
  customKeyGenerator?: (req: NextRequest | Request) => string
}

/**
 * Next.js App Router context type
 */
interface RouteContext {
  params?: Promise<Record<string, string | string[]>>
}

/**
 * API Route Handler Wrapper (App Router)
 * Next.js 13+ App Router용 래퍼
 */
export function withRateLimiting<T extends RouteContext = RouteContext>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // 액션 결정
      const action =
        options.action ||
        getActionFromPath(req.method, req.nextUrl.pathname) ||
        ActionCategory.POST_READ

      // Edge Runtime에서는 미들웨어가 처리
      // 여기서는 추가 검증만 수행
      const rateLimitHeader = req.headers.get('X-RateLimit-Remaining')
      if (rateLimitHeader && parseInt(rateLimitHeader) <= 0) {
        return NextResponse.json(
          {
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
          },
          { status: 429 }
        )
      }

      // 패턴 감지 (옵션)
      if (options.enablePatternDetection) {
        const userId = await getUserId(req)
        if (userId) {
          const detection = await PatternDetector.detect(userId, action, {
            ip: getClientIp(req),
            userAgent: req.headers.get('user-agent') || undefined,
          })

          if (detection.detected && detection.suggestedAction !== 'allow') {
            // 악용 추적
            if (options.enableAbuseTracking) {
              await AbuseTracker.recordIncident(
                userId,
                AbuseType.PATTERN_DETECTION,
                action,
                {
                  patterns: detection.patterns,
                  severity: detection.severity,
                }
              )
            }

            if (
              detection.suggestedAction === 'block' ||
              detection.suggestedAction === 'ban'
            ) {
              return NextResponse.json(
                {
                  error: 'Forbidden',
                  message: 'Suspicious activity detected. Access denied.',
                },
                { status: 403 }
              )
            }
          }
        }
      }

      // 핸들러 실행
      const response = await handler(req, context)

      // 성공적인 요청 로깅
      if (options.enablePatternDetection || options.enableAbuseTracking) {
        const userId = await getUserId(req)
        if (userId) {
          await PatternDetector.logBehavior(
            userId,
            action,
            response.status < 400,
            {
              ip: getClientIp(req),
              userAgent: req.headers.get('user-agent') || undefined,
            }
          )
        }
      }

      return response
    } catch (error) {
      console.error('Rate limiting wrapper error:', error)

      // 에러 발생 시에도 요청은 통과시킴
      return handler(req, context)
    }
  }
}

/**
 * Legacy API Route Handler Wrapper (Pages Router)
 * Next.js 12 이하 또는 Pages Router용 래퍼
 */
export function withRateLimitingLegacy(
  handler: (req: Request) => Promise<Response>
) {
  // withRateLimitHandler only takes 1 argument
  // Legacy wrapper for backwards compatibility
  return withRateLimitHandler(handler)
}

/**
 * Server-side Rate Limiting Check
 * 서버 컴포넌트나 서버 액션에서 사용
 */
export async function checkRateLimit(
  userId: string,
  action: ActionCategory,
  options: {
    throwOnLimit?: boolean
    recordIncident?: boolean
  } = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const result = await RateLimiter.check({
      userId,
      action,
      ipAddress: 'unknown', // Default IP for server-side checks
    })

    if (!result.allowed) {
      // 악용 기록
      if (options.recordIncident) {
        await AbuseTracker.recordIncident(
          userId,
          AbuseType.RATE_LIMIT_VIOLATION,
          action,
          {
            severity: 'medium',
          }
        )
      }

      // 에러 throw
      if (options.throwOnLimit) {
        throw new Error('Rate limit exceeded')
      }
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)

    // 에러 시 통과 (fail open)
    return {
      allowed: true,
      remaining: 1,
      resetAt: new Date(Date.now() + 60000),
    }
  }
}

/**
 * 사용자 ID 추출 헬퍼
 */
async function getUserId(req: NextRequest | Request): Promise<string | null> {
  // 1. Authorization 헤더
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    // 실제로는 JWT 디코딩 필요
    // 여기서는 간단한 해시 사용
    return `auth:${simpleHash(authHeader)}`
  }

  // 2. 세션 쿠키 (NextRequest인 경우)
  if ('cookies' in req) {
    const sessionCookie =
      req.cookies.get('next-auth.session-token') ||
      req.cookies.get('__Secure-next-auth.session-token')
    if (sessionCookie) {
      return `session:${simpleHash(sessionCookie.value)}`
    }
  }

  // 3. IP 주소 기반
  const ip = getClientIp(req)
  if (ip) {
    return `ip:${ip}`
  }

  return null
}

/**
 * 클라이언트 IP 추출
 */
function getClientIp(req: NextRequest | Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfIp = req.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIp) {
    return realIp
  }
  if (cfIp) {
    return cfIp
  }

  return 'unknown'
}

/**
 * 간단한 해시 함수
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Rate Limit 상태 확인 (클라이언트용)
 */
export async function getRateLimitStatus(userId: string): Promise<{
  limits: Map<ActionCategory, { remaining: number; resetAt: Date }>
  restrictions: RestrictionInfo[]
  trustScore: number
}> {
  try {
    // 각 액션별 상태 조회
    const limits = new Map<
      ActionCategory,
      { remaining: number; resetAt: Date }
    >()

    // 주요 액션들에 대해 체크
    const mainActions = [
      ActionCategory.POST_CREATE,
      ActionCategory.POST_LIKE,
      ActionCategory.COMMENT_CREATE,
      ActionCategory.FILE_UPLOAD,
    ]

    for (const action of mainActions) {
      const status = await RateLimiter.check({
        userId,
        action,
        ipAddress: 'unknown', // Default IP for status checks
      })
      limits.set(action, {
        remaining: status.remaining,
        resetAt: status.resetAt,
      })
    }

    // 제한 및 신뢰도 조회
    const profile = await AbuseTracker.getUserProfile(userId)
    const { TrustScorer } = await import('./trust-scorer')
    const trustScore = await TrustScorer.calculateTrustScore(userId)

    return {
      limits,
      restrictions: profile.restrictions,
      trustScore: trustScore.score,
    }
  } catch (error) {
    console.error('Failed to get rate limit status:', error)
    return {
      limits: new Map(),
      restrictions: [],
      trustScore: 0,
    }
  }
}

/**
 * Rate Limit 재설정 (관리자용)
 */
export async function resetRateLimit(
  userId: string,
  action?: ActionCategory
): Promise<void> {
  try {
    const { redis } = await import('@/lib/core/redis')
    const redisClient = redis()
    if (!redisClient) return

    if (action) {
      // 특정 액션 재설정
      const key = `rate_limit:${userId}:${action}`
      await redisClient.del(key)
    } else {
      // 모든 액션 재설정
      const pattern = `rate_limit:${userId}:*`
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    }

    // 악용 제한도 해제
    await AbuseTracker.clearRestriction(userId)
  } catch (error) {
    console.error('Failed to reset rate limit:', error)
  }
}

/**
 * 미들웨어 우회 토큰 생성 (테스트용)
 */
export function generateBypassToken(userId: string): string {
  // 실제로는 서명된 토큰 생성 필요
  const timestamp = Date.now()
  const data = `${userId}:${timestamp}`
  return Buffer.from(data).toString('base64')
}

/**
 * 미들웨어 우회 토큰 검증
 */
export function verifyBypassToken(token: string): boolean {
  try {
    const data = Buffer.from(token, 'base64').toString()
    const [, timestamp] = data.split(':')

    // 토큰 유효기간 체크 (1시간)
    const tokenAge = Date.now() - parseInt(timestamp)
    return tokenAge < 3600000
  } catch {
    return false
  }
}
