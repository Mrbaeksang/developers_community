/**
 * Compatibility Layer for Rate Limiting Migration
 * 기존 API 라우트를 새 Rate Limiting 시스템으로 점진적 마이그레이션
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from './rate-limiter'
import { AbuseTracker, AbuseType, RestrictionInfo } from './abuse-tracker'
import { ActionCategory } from './actions'
import { withRateLimitHandler } from './middleware'
// 통합 미들웨어 사용
import {
  withSecurity as withSecurityUnified,
  withRateLimiting as withRateLimitingUnified,
  SecurityOptions,
} from './unified-middleware'

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
  params: Promise<Record<string, string | string[]>>
}

/**
 * API Route Handler Wrapper (App Router)
 * 통합 미들웨어로 리다이렉트
 */
export function withRateLimiting<T extends RouteContext = RouteContext>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
  options: RateLimitOptions = {}
) {
  // 통합 미들웨어 사용 (CSRF 스킵)
  const securityOptions: SecurityOptions = {
    ...options,
    skipCSRF: true, // Rate limiting만 적용
  }

  return withRateLimitingUnified(handler, securityOptions)
}

/**
 * Security Wrapper - Rate Limiting + CSRF
 * 전체 보안 기능 적용
 */
export function withSecurity<T extends RouteContext = RouteContext>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
  options: RateLimitOptions & { requireCSRF?: boolean } = {}
) {
  const securityOptions: SecurityOptions = {
    ...options,
    requireCSRF: options.requireCSRF !== false, // 기본값 true
  }

  return withSecurityUnified(handler, securityOptions)
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
