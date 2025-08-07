/**
 * Adaptive Rate Limiting System
 * 메트릭 기반 동적 Rate Limit 조정 시스템
 */

import { redis as getRedis } from '@/lib/core/redis'
import { ActionCategory, getActionMetadata } from './actions'
import { MetricsCollector } from './metrics'
import { TrustScorer } from './trust-scorer'
import { PatternDetector } from './pattern-detector'

export interface AdaptiveConfig {
  baseMultiplier: number // 기본 배수 (1.0 = 100%)
  trustBonus: number // 신뢰도 보너스 최대치
  systemLoadPenalty: number // 시스템 부하 페널티
  patternPenalty: number // 패턴 감지 페널티
  timeOfDayAdjustment: boolean // 시간대별 조정 활성화
  dynamicThreshold: boolean // 동적 임계값 활성화
}

export interface AdaptiveResult {
  adjustedLimit: number // 조정된 제한
  originalLimit: number // 원래 제한
  multiplier: number // 적용된 배수
  factors: AdaptiveFactor[] // 적용된 요인들
  recommendation?: string // 권장사항
}

export interface AdaptiveFactor {
  type: 'trust' | 'load' | 'pattern' | 'time' | 'history' | 'global'
  name: string
  impact: number // -1 to 1 (negative = penalty, positive = bonus)
  description: string
}

export interface AdaptiveStatusResult {
  timestamp: Date
  systemLoad: number
  globalBlockRate: number
  currentHour: number
  timeAdjustment: number
  user?: {
    userId: string
    trustScore: number
    blockRate: number
    totalRequests: number
  }
}

export class AdaptiveRateLimiter {
  private static readonly DEFAULT_CONFIG: AdaptiveConfig = {
    baseMultiplier: 1.0,
    trustBonus: 2.0, // 최대 2배 보너스
    systemLoadPenalty: 0.5, // 최대 50% 감소
    patternPenalty: 0.3, // 패턴 감지시 30% 감소
    timeOfDayAdjustment: true,
    dynamicThreshold: true,
  }

  // 시간대별 조정 계수
  private static readonly TIME_ADJUSTMENTS: Record<number, number> = {
    0: 1.2, // 00:00 - 00:59 (새벽)
    1: 1.2,
    2: 1.3,
    3: 1.3,
    4: 1.3,
    5: 1.2,
    6: 1.1, // 06:00 - 06:59 (아침)
    7: 1.0,
    8: 0.9, // 08:00 - 08:59 (출근)
    9: 0.9,
    10: 1.0,
    11: 1.0,
    12: 0.9, // 12:00 - 12:59 (점심)
    13: 0.9,
    14: 1.0,
    15: 1.0,
    16: 1.0,
    17: 1.0,
    18: 0.9, // 18:00 - 18:59 (퇴근)
    19: 0.8, // 19:00 - 19:59 (저녁 피크)
    20: 0.8,
    21: 0.8,
    22: 0.9,
    23: 1.0,
  }

  /**
   * 적응형 Rate Limit 계산
   */
  static async calculate(
    userId: string,
    action: ActionCategory,
    baseLimit: number,
    config?: Partial<AdaptiveConfig>
  ): Promise<AdaptiveResult> {
    const cfg = { ...this.DEFAULT_CONFIG, ...config }
    const factors: AdaptiveFactor[] = []
    let multiplier = cfg.baseMultiplier

    // 1. Trust Score 기반 조정
    const trustFactor = await this.calculateTrustFactor(userId, cfg)
    if (trustFactor) {
      factors.push(trustFactor)
      multiplier *= 1 + trustFactor.impact
    }

    // 2. 시스템 부하 기반 조정
    const loadFactor = await this.calculateLoadFactor(cfg)
    if (loadFactor) {
      factors.push(loadFactor)
      multiplier *= 1 + loadFactor.impact
    }

    // 3. 패턴 감지 기반 조정
    const patternFactor = await this.calculatePatternFactor(userId, action, cfg)
    if (patternFactor) {
      factors.push(patternFactor)
      multiplier *= 1 + patternFactor.impact
    }

    // 4. 시간대별 조정
    if (cfg.timeOfDayAdjustment) {
      const timeFactor = this.calculateTimeFactor()
      if (timeFactor) {
        factors.push(timeFactor)
        multiplier *= 1 + timeFactor.impact
      }
    }

    // 5. 사용자 히스토리 기반 조정
    const historyFactor = await this.calculateHistoryFactor(userId)
    if (historyFactor) {
      factors.push(historyFactor)
      multiplier *= 1 + historyFactor.impact
    }

    // 6. 글로벌 조정 (전체 시스템 상태)
    const globalFactor = await this.calculateGlobalFactor()
    if (globalFactor) {
      factors.push(globalFactor)
      multiplier *= 1 + globalFactor.impact
    }

    // 최종 제한 계산 (최소 1, 최대 원래의 5배)
    const adjustedLimit = Math.max(
      1,
      Math.min(baseLimit * 5, Math.round(baseLimit * multiplier))
    )

    // 권장사항 생성
    const recommendation = this.generateRecommendation(factors, multiplier)

    return {
      adjustedLimit,
      originalLimit: baseLimit,
      multiplier,
      factors,
      recommendation,
    }
  }

  /**
   * Trust Score 기반 조정 계산
   */
  private static async calculateTrustFactor(
    userId: string,
    config: AdaptiveConfig
  ): Promise<AdaptiveFactor | null> {
    try {
      const trustData = await TrustScorer.calculateTrustScore(userId)
      const trustScore = trustData.score

      // Trust Score가 높을수록 보너스 (0-1 범위)
      const impact = trustScore * config.trustBonus - 1 // -1 to +1

      if (Math.abs(impact) < 0.05) return null // 5% 미만 변화는 무시

      return {
        type: 'trust',
        name: 'Trust Score',
        impact,
        description: `Trust score: ${(trustScore * 100).toFixed(1)}%`,
      }
    } catch (error) {
      console.error('Failed to calculate trust factor:', error)
      return null
    }
  }

  /**
   * 시스템 부하 기반 조정
   */
  private static async calculateLoadFactor(
    config: AdaptiveConfig
  ): Promise<AdaptiveFactor | null> {
    try {
      const metrics = await MetricsCollector.getSystemHealth()

      // CPU와 메모리 사용률 기반 계산
      const memoryUsage =
        metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal
      const load = memoryUsage // 실제로는 CPU 사용률도 포함해야 함

      if (load > 0.8) {
        // 80% 이상 사용시 페널티
        const impact = -config.systemLoadPenalty * ((load - 0.8) / 0.2)

        return {
          type: 'load',
          name: 'System Load',
          impact,
          description: `System load: ${(load * 100).toFixed(1)}%`,
        }
      }

      return null
    } catch (error) {
      console.error('Failed to calculate load factor:', error)
      return null
    }
  }

  /**
   * 패턴 감지 기반 조정
   */
  private static async calculatePatternFactor(
    userId: string,
    _action: ActionCategory,
    config: AdaptiveConfig
  ): Promise<AdaptiveFactor | null> {
    try {
      const detection = await PatternDetector.detect(userId, _action)

      if (detection.detected) {
        // 패턴이 감지되면 페널티
        const severityMultiplier = {
          low: 0.25,
          medium: 0.5,
          high: 0.75,
          critical: 1.0,
        }[detection.severity]

        const impact = -config.patternPenalty * severityMultiplier

        return {
          type: 'pattern',
          name: 'Pattern Detection',
          impact,
          description: `Detected: ${detection.patterns.join(', ')}`,
        }
      }

      return null
    } catch (error) {
      console.error('Failed to calculate pattern factor:', error)
      return null
    }
  }

  /**
   * 시간대별 조정
   */
  private static calculateTimeFactor(): AdaptiveFactor | null {
    const hour = new Date().getHours()
    const adjustment = this.TIME_ADJUSTMENTS[hour] || 1.0

    if (Math.abs(adjustment - 1.0) < 0.05) return null

    const impact = adjustment - 1.0

    return {
      type: 'time',
      name: 'Time of Day',
      impact,
      description: `${hour}:00 adjustment`,
    }
  }

  /**
   * 사용자 히스토리 기반 조정
   */
  private static async calculateHistoryFactor(
    userId: string
  ): Promise<AdaptiveFactor | null> {
    try {
      const userMetrics = await MetricsCollector.getUserMetrics(userId)

      // 차단 비율이 높으면 페널티
      const blockRate =
        userMetrics.totalRequests > 0
          ? userMetrics.blockedRequests / userMetrics.totalRequests
          : 0

      if (blockRate > 0.2) {
        // 20% 이상 차단된 경우
        const impact = -Math.min(0.5, blockRate)

        return {
          type: 'history',
          name: 'User History',
          impact,
          description: `Block rate: ${(blockRate * 100).toFixed(1)}%`,
        }
      }

      // 좋은 이력이면 보너스
      if (blockRate < 0.05 && userMetrics.totalRequests > 100) {
        return {
          type: 'history',
          name: 'User History',
          impact: 0.2,
          description: 'Good standing user',
        }
      }

      return null
    } catch (error) {
      console.error('Failed to calculate history factor:', error)
      return null
    }
  }

  /**
   * 글로벌 시스템 상태 기반 조정
   */
  private static async calculateGlobalFactor(): Promise<AdaptiveFactor | null> {
    try {
      const metrics = await MetricsCollector.getMetrics()

      // 전체 차단 비율
      const globalBlockRate =
        metrics.totalRequests > 0
          ? metrics.blockedRequests / metrics.totalRequests
          : 0

      // 공격 상황 감지
      if (globalBlockRate > 0.3) {
        // 30% 이상 차단 = 공격 상황
        return {
          type: 'global',
          name: 'Global State',
          impact: -0.5,
          description: 'System under attack',
        }
      }

      // 에러율 체크
      if (metrics.errorRate > 0.05) {
        // 5% 이상 에러
        return {
          type: 'global',
          name: 'Global State',
          impact: -0.3,
          description: `High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`,
        }
      }

      return null
    } catch (error) {
      console.error('Failed to calculate global factor:', error)
      return null
    }
  }

  /**
   * 권장사항 생성
   */
  private static generateRecommendation(
    factors: AdaptiveFactor[],
    multiplier: number
  ): string | undefined {
    const penalties = factors.filter((f) => f.impact < 0)
    const bonuses = factors.filter((f) => f.impact > 0)

    if (penalties.length > 2) {
      return 'Multiple risk factors detected. Consider implementing additional security measures.'
    }

    if (multiplier < 0.5) {
      return 'Severely restricted due to suspicious activity. User may need verification.'
    }

    if (multiplier > 2.0 && bonuses.length > 0) {
      return 'Trusted user with increased limits. Monitor for potential privilege escalation.'
    }

    const patternFactor = factors.find((f) => f.type === 'pattern')
    if (patternFactor) {
      return 'Suspicious patterns detected. Consider requiring CAPTCHA or additional verification.'
    }

    const loadFactor = factors.find((f) => f.type === 'load')
    if (loadFactor && loadFactor.impact < -0.3) {
      return 'System under heavy load. Consider scaling resources or implementing queue system.'
    }

    return undefined
  }

  /**
   * 동적 임계값 계산
   */
  static async calculateDynamicThreshold(
    action: ActionCategory,
    percentile: number = 95
  ): Promise<number> {
    const redis = getRedis()
    if (!redis) {
      // 기본값 반환
      const metadata = getActionMetadata(action)
      return metadata?.cost ? metadata.cost * 10 : 100
    }

    try {
      // 최근 1시간 동안의 요청 분포 분석
      const key = `stats:${action}:distribution`
      const distribution = await redis.zrange(key, 0, -1, 'WITHSCORES')

      if (distribution.length < 2) {
        // 데이터 부족
        const metadata = getActionMetadata(action)
        return metadata?.cost ? metadata.cost * 10 : 100
      }

      // 백분위수 계산
      const values: number[] = []
      for (let i = 1; i < distribution.length; i += 2) {
        values.push(parseFloat(distribution[i]))
      }

      values.sort((a, b) => a - b)
      const index = Math.floor(values.length * (percentile / 100))

      return Math.ceil(values[index] || 100)
    } catch (error) {
      console.error('Failed to calculate dynamic threshold:', error)
      const metadata = getActionMetadata(action)
      return metadata?.cost ? metadata.cost * 10 : 100
    }
  }

  /**
   * 학습 기반 조정
   */
  static async learn(
    userId: string,
    action: ActionCategory,
    allowed: boolean,
    legitimate: boolean // 사후 검증 결과
  ): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    const key = `learning:${action}`

    try {
      // 학습 데이터 저장
      await redis.hincrby(key, 'total', 1)

      if (allowed && legitimate) {
        // True Positive
        await redis.hincrby(key, 'true_positive', 1)
      } else if (!allowed && !legitimate) {
        // True Negative
        await redis.hincrby(key, 'true_negative', 1)
      } else if (allowed && !legitimate) {
        // False Positive
        await redis.hincrby(key, 'false_positive', 1)
      } else {
        // False Negative
        await redis.hincrby(key, 'false_negative', 1)
      }

      // 사용자별 학습
      const userKey = `learning:user:${userId}`
      await redis.hincrby(userKey, action, legitimate ? 1 : -1)
      await redis.expire(userKey, 7 * 24 * 60 * 60) // 7일

      // 임계값 자동 조정
      await this.adjustThresholds(action)
    } catch (error) {
      console.error('Failed to record learning data:', error)
    }
  }

  /**
   * 임계값 자동 조정
   */
  private static async adjustThresholds(action: ActionCategory): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    const key = `learning:${action}`
    const data = await redis.hgetall(key)

    if (!data.total || parseInt(data.total) < 1000) {
      // 충분한 데이터가 없음
      return
    }

    const tp = parseInt(data.true_positive || '0')
    const fp = parseInt(data.false_positive || '0')
    const fn = parseInt(data.false_negative || '0')

    const precision = tp > 0 ? tp / (tp + fp) : 0
    const recall = tp > 0 ? tp / (tp + fn) : 0

    // F1 Score
    const f1 = (2 * (precision * recall)) / (precision + recall) || 0

    // 임계값 조정 결정
    if (f1 < 0.8) {
      // 성능이 낮음 - 조정 필요
      const adjustKey = `threshold:${action}`

      if (precision < recall) {
        // False Positive가 많음 - 임계값 낮추기
        await redis.set(
          adjustKey,
          JSON.stringify({
            adjustment: 1.2, // 20% 증가
            reason: 'high_false_positive',
            f1_score: f1,
          })
        )
      } else {
        // False Negative가 많음 - 임계값 높이기
        await redis.set(
          adjustKey,
          JSON.stringify({
            adjustment: 0.8, // 20% 감소
            reason: 'high_false_negative',
            f1_score: f1,
          })
        )
      }
    }
  }

  /**
   * 실시간 조정 상태 조회
   */
  static async getAdaptiveStatus(
    userId?: string
  ): Promise<AdaptiveStatusResult> {
    const metrics = await MetricsCollector.getMetrics()
    const health = await MetricsCollector.getSystemHealth()

    const status: AdaptiveStatusResult = {
      timestamp: new Date(),
      systemLoad: health.memoryUsage.heapUsed / health.memoryUsage.heapTotal,
      globalBlockRate:
        metrics.totalRequests > 0
          ? metrics.blockedRequests / metrics.totalRequests
          : 0,
      currentHour: new Date().getHours(),
      timeAdjustment: this.TIME_ADJUSTMENTS[new Date().getHours()],
    }

    if (userId) {
      const userMetrics = await MetricsCollector.getUserMetrics(userId)
      const trustData = await TrustScorer.calculateTrustScore(userId)

      status.user = {
        userId,
        trustScore: trustData.score,
        blockRate:
          userMetrics.totalRequests > 0
            ? userMetrics.blockedRequests / userMetrics.totalRequests
            : 0,
        totalRequests: userMetrics.totalRequests,
      }
    }

    return status
  }
}
