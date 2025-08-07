/**
 * Advanced Rate Limiting Service
 * Sliding Window + Token Bucket 하이브리드 방식의 지능형 Rate Limiter
 */

import { redis as getRedis } from '@/lib/core/redis'
import { TrustScorer, TrustLevel } from './trust-scorer'
import {
  ActionCategory,
  ActionType,
  getActionMetadata,
  calculateActionCost,
  getActionFromPath,
} from './actions'
import { AdaptiveRateLimiter } from './adaptive-limiter'
import { PatternDetector } from './pattern-detector'
import { MetricsCollector } from './metrics'
import { AbuseTracker, AbuseType } from './abuse-tracker'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number // seconds to wait if blocked
  reason?: string
  trustLevel?: TrustLevel
  actionCost?: number
}

export interface RateLimitOptions {
  userId?: string
  ipAddress: string
  action: ActionCategory
  trustScore?: number
  bypassForAdmin?: boolean
  userAgent?: string
}

export interface WindowConfig {
  windowMs: number // 시간 창 크기 (ms)
  maxRequests: number // 최대 요청 수
  blockDuration: number // 차단 시간 (초)
}

export class RateLimiter {
  // Action Type별 기본 설정
  private static readonly DEFAULT_CONFIGS: Record<ActionType, WindowConfig> = {
    [ActionType.READ]: {
      windowMs: 60 * 1000, // 1분
      maxRequests: 100, // 100 requests
      blockDuration: 60, // 1분 차단
    },
    [ActionType.WRITE]: {
      windowMs: 60 * 1000, // 1분
      maxRequests: 20, // 20 requests
      blockDuration: 5 * 60, // 5분 차단
    },
    [ActionType.SENSITIVE]: {
      windowMs: 60 * 1000, // 1분
      maxRequests: 10, // 10 requests
      blockDuration: 3 * 60, // 3분 차단
    },
    [ActionType.CRITICAL]: {
      windowMs: 15 * 60 * 1000, // 15분
      maxRequests: 5, // 5 requests
      blockDuration: 30 * 60, // 30분 차단
    },
    [ActionType.ADMIN]: {
      windowMs: 60 * 1000, // 1분
      maxRequests: 1000, // 거의 무제한
      blockDuration: 0, // 차단 없음
    },
  }

  /**
   * Rate Limit 체크 메인 함수
   */
  static async check(options: RateLimitOptions): Promise<RateLimitResult> {
    const { userId, ipAddress, action, bypassForAdmin } = options
    const startTime = Date.now()

    // Action 메타데이터 가져오기
    const metadata = getActionMetadata(action)
    if (!metadata) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(),
        reason: 'Invalid action',
      }
    }

    // 관리자 우회 체크
    if (bypassForAdmin && userId) {
      const isAdmin = await this.checkIfAdmin(userId)
      if (isAdmin) {
        return {
          allowed: true,
          remaining: 999999,
          resetAt: new Date(Date.now() + 3600000),
          trustLevel: TrustLevel.PREMIUM,
        }
      }
    }

    // 사용자 신뢰도 점수 가져오기
    let trustScore = 0
    let trustLevel = TrustLevel.NEW

    if (userId) {
      try {
        const trust = await TrustScorer.calculateTrustScore(userId)
        trustScore = trust.score
        trustLevel = trust.level

        // 차단된 사용자 체크
        if (trust.factors.isBanned) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(Date.now() + 86400000), // 24시간
            reason: 'User is banned',
            trustLevel,
          }
        }
      } catch (error) {
        console.error('Failed to calculate trust score:', error)
        // 신뢰도 계산 실패시 기본값 사용
      }
    }

    // Pattern Detection - 패턴 감지
    const identifier = userId || ipAddress
    const patternDetection = await PatternDetector.detect(identifier, action, {
      ip: ipAddress,
      userAgent: options.userAgent,
    })

    // 심각한 패턴이 감지되면 즉시 차단
    if (patternDetection.detected && patternDetection.severity === 'critical') {
      // Abuse Tracking
      if (userId) {
        await AbuseTracker.recordIncident(
          userId,
          AbuseType.PATTERN_DETECTION,
          action,
          {
            patterns: patternDetection.patterns,
            severity: 'critical',
          }
        )
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 3600000), // 1시간
        reason: `Critical pattern detected: ${patternDetection.patterns.join(', ')}`,
        trustLevel,
      }
    }

    // Action 비용 계산 (신뢰도 반영)
    const actionCost = calculateActionCost(action, trustScore)

    // 기본 설정 가져오기
    const baseConfig = this.getConfigWithTrust(metadata.type, trustLevel)

    // Adaptive Rate Limiting - 동적 제한 조정
    const adaptiveResult = await AdaptiveRateLimiter.calculate(
      identifier,
      action,
      baseConfig.maxRequests,
      {
        baseMultiplier: 1.0,
        trustBonus: 2.0,
        systemLoadPenalty: 0.5,
        patternPenalty: patternDetection.detected ? 0.3 : 0,
        timeOfDayAdjustment: true,
        dynamicThreshold: true,
      }
    )

    // 조정된 설정 적용
    const adjustedConfig = {
      ...baseConfig,
      maxRequests: adaptiveResult.adjustedLimit,
    }

    // Rate Limit 키 생성
    const key = this.generateKey(identifier, action)

    // Sliding Window + Token Bucket 체크
    const result = await this.slidingWindowCheck(
      key,
      adjustedConfig,
      actionCost
    )

    // Metrics 기록
    const processingTime = Date.now() - startTime
    await MetricsCollector.recordRequest(
      identifier,
      action,
      result.allowed,
      processingTime,
      {
        pattern: patternDetection.detected
          ? patternDetection.patterns[0]
          : undefined,
        reason: result.reason,
        trustScore,
      }
    )

    // Pattern Detection 로그
    if (userId || ipAddress) {
      await PatternDetector.logBehavior(identifier, action, result.allowed, {
        ip: ipAddress,
        userAgent: options.userAgent,
      })
    }

    // 위반 시 처리
    if (!result.allowed) {
      if (userId) {
        // Trust Score 위반 기록
        await TrustScorer.recordViolation(
          userId,
          'rate_limit',
          metadata.severity
        )

        // Abuse Tracking
        await AbuseTracker.recordIncident(
          userId,
          AbuseType.RATE_LIMIT_VIOLATION,
          action,
          {
            severity: metadata.severity,
            metadata: {
              limit: adjustedConfig.maxRequests,
              cost: actionCost,
              // Serialize adaptive factors to string to match IncidentMetadata type
              adaptiveFactors: JSON.stringify(adaptiveResult.factors),
            },
          }
        )
      }

      // 학습 시스템에 피드백
      await AdaptiveRateLimiter.learn(
        identifier,
        action,
        false, // not allowed
        false // assume not legitimate since blocked
      )
    } else {
      // 성공 시 학습
      await AdaptiveRateLimiter.learn(
        identifier,
        action,
        true, // allowed
        true // assume legitimate since allowed
      )
    }

    // 권장사항 추가
    const finalResult: RateLimitResult = {
      ...result,
      trustLevel,
      actionCost,
    }

    // Adaptive recommendation 추가
    if (adaptiveResult.recommendation) {
      finalResult.reason = finalResult.reason
        ? `${finalResult.reason}. ${adaptiveResult.recommendation}`
        : adaptiveResult.recommendation
    }

    return finalResult
  }

  /**
   * Sliding Window 방식 체크
   */
  private static async slidingWindowCheck(
    key: string,
    config: WindowConfig,
    cost: number = 1
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - config.windowMs

    // 차단 상태 체크
    const blockKey = `${key}:blocked`
    const redis = getRedis()
    if (!redis) {
      // Redis 없으면 통과
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
      }
    }
    const blockedUntil = await redis.get(blockKey)
    if (blockedUntil) {
      const blockEndTime = parseInt(blockedUntil)
      if (blockEndTime > now) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(blockEndTime),
          retryAfter: Math.ceil((blockEndTime - now) / 1000),
          reason: 'Rate limit exceeded - temporarily blocked',
        }
      } else {
        // 차단 시간 종료
        await redis.del(blockKey)
      }
    }

    // Sliding Window 구현
    const multi = redis.multi()

    // 오래된 엔트리 제거
    multi.zremrangebyscore(key, '-inf', windowStart.toString())

    // 현재 창의 요청 수 가져오기
    multi.zcard(key)

    // 새 요청 추가
    multi.zadd(key, now, `${now}:${cost}`)

    // TTL 설정
    multi.expire(key, Math.ceil(config.windowMs / 1000))

    const results = await multi.exec()
    if (!results) {
      // Redis 오류 시 통과
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
      }
    }

    const currentCount = (results[1]?.[1] as number) || 0

    // 비용을 고려한 체크
    const effectiveCount = currentCount * cost

    if (effectiveCount >= config.maxRequests) {
      // Rate limit 초과 - 차단
      if (config.blockDuration > 0) {
        const blockUntil = now + config.blockDuration * 1000
        await redis.setex(blockKey, config.blockDuration, blockUntil.toString())
      }

      // 마지막 요청 제거 (초과했으므로)
      await redis.zrem(key, `${now}:${cost}`)

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + config.windowMs),
        retryAfter: config.blockDuration,
        reason: 'Rate limit exceeded',
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - effectiveCount - cost),
      resetAt: new Date(now + config.windowMs),
    }
  }

  /**
   * 신뢰도를 반영한 설정 조정
   */
  private static getConfigWithTrust(
    actionType: ActionType,
    trustLevel: TrustLevel
  ): WindowConfig {
    const baseConfig = { ...this.DEFAULT_CONFIGS[actionType] }
    const multiplier = TrustScorer.getRateLimitMultiplier(trustLevel)

    // 신뢰도에 따라 요청 수 증가
    baseConfig.maxRequests = Math.floor(baseConfig.maxRequests * multiplier)

    // 신뢰도가 높으면 차단 시간 감소
    if (
      trustLevel === TrustLevel.TRUSTED ||
      trustLevel === TrustLevel.PREMIUM
    ) {
      baseConfig.blockDuration = Math.floor(baseConfig.blockDuration * 0.5)
    }

    return baseConfig
  }

  /**
   * Rate Limit 키 생성
   */
  private static generateKey(
    identifier: string,
    action: ActionCategory
  ): string {
    return `rl:${action}:${identifier}`
  }

  /**
   * 관리자 체크
   */
  private static async checkIfAdmin(userId: string): Promise<boolean> {
    const key = `user:admin:${userId}`
    const redis = getRedis()
    if (!redis) return false
    const cached = await redis.get(key)

    if (cached !== null) {
      return cached === '1'
    }

    // DB에서 확인 (prisma import 필요)
    const { prisma } = await import('@/lib/core/prisma')
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { globalRole: true },
    })

    const isAdmin = user?.globalRole === 'ADMIN'

    // 캐시 저장 (1시간)
    await redis.setex(key, 3600, isAdmin ? '1' : '0')

    return isAdmin
  }

  /**
   * 사용자의 현재 Rate Limit 상태 조회
   */
  static async getStatus(
    userId: string,
    action: ActionCategory
  ): Promise<{
    used: number
    limit: number
    remaining: number
    resetAt: Date
    trustLevel: TrustLevel
  }> {
    // 신뢰도 조회
    const trust = await TrustScorer.calculateTrustScore(userId)
    const metadata = getActionMetadata(action)

    if (!metadata) {
      throw new Error('Invalid action')
    }

    // 설정 가져오기
    const config = this.getConfigWithTrust(metadata.type, trust.level)

    // 현재 사용량 조회
    const key = this.generateKey(userId, action)
    const now = Date.now()
    const windowStart = now - config.windowMs

    // 현재 창의 요청 수
    const redis = getRedis()
    if (!redis) {
      return {
        used: 0,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
        trustLevel: trust.level,
      }
    }
    const count = await redis.zcount(key, windowStart.toString(), '+inf')

    return {
      used: count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
      resetAt: new Date(now + config.windowMs),
      trustLevel: trust.level,
    }
  }

  /**
   * Rate Limit 리셋 (관리자용)
   */
  static async reset(
    identifier: string,
    action?: ActionCategory
  ): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    if (action) {
      const key = this.generateKey(identifier, action)
      await redis.del(key)
      await redis.del(`${key}:blocked`)
    } else {
      // 모든 action에 대해 리셋
      const pattern = `rl:*:${identifier}`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  }

  /**
   * IP 기반 Rate Limit (비로그인 사용자용)
   */
  static async checkByIP(
    ipAddress: string,
    path: string,
    method: string
  ): Promise<RateLimitResult> {
    // URL과 메서드로 Action 결정
    const action = getActionFromPath(method, path)

    if (!action) {
      // 알 수 없는 경로는 기본 READ로 처리
      return this.check({
        ipAddress,
        action: ActionCategory.POST_READ,
      })
    }

    return this.check({
      ipAddress,
      action,
    })
  }
}
