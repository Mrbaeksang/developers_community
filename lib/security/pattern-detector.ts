/**
 * Pattern Detection System
 * 악용 패턴 감지 및 이상 행동 탐지 시스템
 */

import { redis as getRedis } from '@/lib/core/redis'
import { ActionCategory, ActionType, getActionMetadata } from './actions'

export enum PatternType {
  RAPID_FIRE = 'RAPID_FIRE', // 짧은 시간에 많은 요청
  SEQUENTIAL_FAILURE = 'SEQUENTIAL_FAILURE', // 연속 실패
  SUSPICIOUS_TIMING = 'SUSPICIOUS_TIMING', // 의심스러운 타이밍
  CONTENT_SPAM = 'CONTENT_SPAM', // 콘텐츠 스팸
  AUTOMATION = 'AUTOMATION', // 자동화 도구 사용 의심
  DISTRIBUTED_ATTACK = 'DISTRIBUTED_ATTACK', // 분산 공격
  CREDENTIAL_STUFFING = 'CREDENTIAL_STUFFING', // 크리덴셜 스터핑
  SCRAPING = 'SCRAPING', // 데이터 스크래핑
}

export interface PatternDetectionResult {
  detected: boolean
  patterns: PatternType[]
  confidence: number // 0-1 범위의 확신도
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedAction: 'allow' | 'challenge' | 'block' | 'ban'
  evidence: PatternEvidence[]
}

// Type for pattern evidence details
interface EvidenceDetails {
  requestCount?: number
  requestsPerSecond?: number
  window?: number
  minInterval?: number
  averageInterval?: number
  failureCount?: number
  totalRequests?: number
  failureRate?: number
  regularityScore?: number
  userAgents?: string[]
  reason?: string
  precision?: number
  duplicateCount?: number
  totalPosts?: number
  similarity?: number
  readRatio?: number
  uniqueActions?: string[]
  [key: string]: string | number | boolean | string[] | undefined
}

export interface PatternEvidence {
  pattern: PatternType
  timestamp: Date
  details: EvidenceDetails
  score: number
}

export interface BehaviorMetrics {
  requestCount: number
  failureCount: number
  successRate: number
  averageInterval: number // ms between requests
  minInterval: number
  uniqueActions: Set<string>
  uniqueIPs: Set<string>
  userAgent: string[]
  timeDistribution: Map<number, number> // hour -> count
}

// Type for detection metadata
interface DetectionMetadata {
  ip?: string
  userAgent?: string
  content?: string
  reason?: string
  patterns?: PatternType[]
  severity?: 'low' | 'medium' | 'high' | 'critical'
  [key: string]:
    | string
    | number
    | boolean
    | PatternType[]
    | ('low' | 'medium' | 'high' | 'critical')
    | undefined
}

// Type for behavior log metadata
interface BehaviorLogMetadata {
  ip?: string
  userAgent?: string
  content?: string
  [key: string]: string | undefined
}

export class PatternDetector {
  private static readonly WINDOW_SIZE = 5 * 60 * 1000 // 5분 window
  private static readonly LONG_WINDOW_SIZE = 60 * 60 * 1000 // 1시간 window

  // Pattern detection thresholds
  private static readonly THRESHOLDS = {
    RAPID_FIRE: {
      requestsPerSecond: 10,
      burstSize: 20,
      timeWindow: 10000, // 10초
    },
    SEQUENTIAL_FAILURE: {
      failureCount: 5,
      timeWindow: 60000, // 1분
      failureRate: 0.8,
    },
    SUSPICIOUS_TIMING: {
      minInterval: 50, // ms - 너무 빠른 요청
      regularityThreshold: 0.95, // 너무 규칙적인 패턴
    },
    AUTOMATION: {
      precisionThreshold: 0.9, // 시간 간격의 정확도
      minRequests: 10,
    },
    DISTRIBUTED_ATTACK: {
      uniqueIPThreshold: 5,
      timeWindow: 60000,
      similarityThreshold: 0.8,
    },
    CONTENT_SPAM: {
      duplicateThreshold: 0.8, // 콘텐츠 유사도
      minPosts: 3,
      timeWindow: 300000, // 5분
    },
    SCRAPING: {
      readRatio: 0.95, // READ 작업 비율
      sequentialPages: 10, // 연속 페이지 요청
      timeWindow: 60000,
    },
  }

  /**
   * 패턴 감지 메인 함수
   */

  static async detect(
    userId: string,
    action: ActionCategory,
    metadata?: DetectionMetadata
  ): Promise<PatternDetectionResult> {
    // 행동 메트릭 수집
    const metrics = await this.collectBehaviorMetrics(userId)

    // 각 패턴 체크
    const detectedPatterns: PatternEvidence[] = []

    // 1. Rapid Fire 체크
    const rapidFire = await this.detectRapidFire(userId, metrics)
    if (rapidFire) detectedPatterns.push(rapidFire)

    // 2. Sequential Failure 체크
    const seqFailure = await this.detectSequentialFailure(userId, metrics)
    if (seqFailure) detectedPatterns.push(seqFailure)

    // 3. Suspicious Timing 체크
    const suspiciousTiming = this.detectSuspiciousTiming(metrics)
    if (suspiciousTiming) detectedPatterns.push(suspiciousTiming)

    // 4. Automation 체크
    const automation = this.detectAutomation(metrics)
    if (automation) detectedPatterns.push(automation)

    // 5. Content Spam 체크 (쓰기 작업인 경우)
    const actionMeta = getActionMetadata(action)
    if (actionMeta?.type === ActionType.WRITE && metadata?.content) {
      const contentSpam = await this.detectContentSpam(userId, metadata.content)
      if (contentSpam) detectedPatterns.push(contentSpam)
    }

    // 6. Scraping 체크 (읽기 작업인 경우)
    if (actionMeta?.type === ActionType.READ) {
      const scraping = await this.detectScraping(userId, metrics)
      if (scraping) detectedPatterns.push(scraping)
    }

    // 패턴 분석 및 종합 판단
    return this.analyzePatterns(detectedPatterns, metrics)
  }

  /**
   * 행동 메트릭 수집
   */
  private static async collectBehaviorMetrics(
    userId: string
  ): Promise<BehaviorMetrics> {
    const redis = getRedis()
    if (!redis) {
      return this.getDefaultMetrics()
    }

    const now = Date.now()
    const windowStart = now - this.WINDOW_SIZE

    // 최근 요청 로그 가져오기
    const logKey = `behavior:${userId}`
    const recentLogs = await redis.zrangebyscore(
      logKey,
      windowStart,
      now,
      'WITHSCORES'
    )

    // 메트릭 계산
    const requests: number[] = []
    const actions = new Set<string>()
    const ips = new Set<string>()
    const userAgents: string[] = []
    let failures = 0

    for (let i = 0; i < recentLogs.length; i += 2) {
      try {
        const data = JSON.parse(recentLogs[i])
        const timestamp = parseInt(recentLogs[i + 1])

        requests.push(timestamp)
        actions.add(data.action)
        if (data.ip) ips.add(data.ip)
        if (data.userAgent) userAgents.push(data.userAgent)
        if (data.failed) failures++
      } catch (error) {
        console.error('Failed to parse behavior log:', error)
      }
    }

    // 시간 간격 계산
    const intervals = []
    for (let i = 1; i < requests.length; i++) {
      intervals.push(requests[i] - requests[i - 1])
    }

    // 시간대별 분포
    const timeDistribution = new Map<number, number>()
    requests.forEach((timestamp) => {
      const hour = new Date(timestamp).getHours()
      timeDistribution.set(hour, (timeDistribution.get(hour) || 0) + 1)
    })

    return {
      requestCount: requests.length,
      failureCount: failures,
      successRate:
        requests.length > 0
          ? (requests.length - failures) / requests.length
          : 1,
      averageInterval:
        intervals.length > 0
          ? intervals.reduce((a, b) => a + b, 0) / intervals.length
          : 0,
      minInterval: intervals.length > 0 ? Math.min(...intervals) : 0,
      uniqueActions: actions,
      uniqueIPs: ips,
      userAgent: userAgents,
      timeDistribution,
    }
  }

  /**
   * Rapid Fire 패턴 감지
   */
  private static async detectRapidFire(
    userId: string,
    metrics: BehaviorMetrics
  ): Promise<PatternEvidence | null> {
    const threshold = this.THRESHOLDS.RAPID_FIRE

    // 짧은 시간 내 너무 많은 요청
    if (metrics.requestCount >= threshold.burstSize) {
      const requestsPerSecond = metrics.requestCount / (this.WINDOW_SIZE / 1000)

      if (requestsPerSecond >= threshold.requestsPerSecond) {
        return {
          pattern: PatternType.RAPID_FIRE,
          timestamp: new Date(),
          details: {
            requestCount: metrics.requestCount,
            requestsPerSecond,
            window: this.WINDOW_SIZE,
          },
          score: Math.min(requestsPerSecond / threshold.requestsPerSecond, 1),
        }
      }
    }

    // 최소 간격이 너무 짧은 경우
    if (metrics.minInterval > 0 && metrics.minInterval < 100) {
      return {
        pattern: PatternType.RAPID_FIRE,
        timestamp: new Date(),
        details: {
          minInterval: metrics.minInterval,
          averageInterval: metrics.averageInterval,
        },
        score: 1 - metrics.minInterval / 100,
      }
    }

    return null
  }

  /**
   * Sequential Failure 패턴 감지
   */
  private static async detectSequentialFailure(
    userId: string,
    metrics: BehaviorMetrics
  ): Promise<PatternEvidence | null> {
    const threshold = this.THRESHOLDS.SEQUENTIAL_FAILURE

    if (metrics.failureCount >= threshold.failureCount) {
      const failureRate = metrics.failureCount / metrics.requestCount

      if (failureRate >= threshold.failureRate) {
        return {
          pattern: PatternType.SEQUENTIAL_FAILURE,
          timestamp: new Date(),
          details: {
            failureCount: metrics.failureCount,
            totalRequests: metrics.requestCount,
            failureRate,
          },
          score: failureRate,
        }
      }
    }

    return null
  }

  /**
   * Suspicious Timing 패턴 감지
   */
  private static detectSuspiciousTiming(
    metrics: BehaviorMetrics
  ): PatternEvidence | null {
    if (metrics.requestCount < 5) return null

    const threshold = this.THRESHOLDS.SUSPICIOUS_TIMING

    // 너무 규칙적인 패턴 감지
    const intervals: number[] = []
    // metrics에서 intervals 계산 (실제로는 더 정교한 방법 필요)

    if (metrics.averageInterval > 0) {
      // 표준편차 계산
      const variance = this.calculateVariance(intervals)
      const regularityScore = 1 - variance / metrics.averageInterval

      if (regularityScore >= threshold.regularityThreshold) {
        return {
          pattern: PatternType.SUSPICIOUS_TIMING,
          timestamp: new Date(),
          details: {
            averageInterval: metrics.averageInterval,
            regularityScore,
          },
          score: regularityScore,
        }
      }
    }

    return null
  }

  /**
   * Automation 패턴 감지
   */
  private static detectAutomation(
    metrics: BehaviorMetrics
  ): PatternEvidence | null {
    const threshold = this.THRESHOLDS.AUTOMATION

    if (metrics.requestCount < threshold.minRequests) return null

    // User-Agent 분석
    const suspiciousAgents = [
      'bot',
      'crawler',
      'spider',
      'scraper',
      'python',
      'curl',
      'wget',
    ]

    const hasSuspiciousAgent = metrics.userAgent.some((agent) =>
      suspiciousAgents.some((suspicious) =>
        agent.toLowerCase().includes(suspicious)
      )
    )

    if (hasSuspiciousAgent) {
      return {
        pattern: PatternType.AUTOMATION,
        timestamp: new Date(),
        details: {
          userAgents: metrics.userAgent,
          reason: 'suspicious_user_agent',
        },
        score: 0.9,
      }
    }

    // 시간 패턴이 너무 정확한 경우 (예: 정확히 1초 간격)
    if (metrics.averageInterval > 0) {
      const precision =
        Math.abs(
          metrics.averageInterval -
            Math.round(metrics.averageInterval / 1000) * 1000
        ) / 1000

      if (precision < 0.1) {
        // 0.1초 이내의 정확도
        return {
          pattern: PatternType.AUTOMATION,
          timestamp: new Date(),
          details: {
            averageInterval: metrics.averageInterval,
            precision,
            reason: 'precise_timing',
          },
          score: 1 - precision,
        }
      }
    }

    return null
  }

  /**
   * Content Spam 패턴 감지
   */
  private static async detectContentSpam(
    userId: string,
    content: string
  ): Promise<PatternEvidence | null> {
    const redis = getRedis()
    if (!redis) return null

    const threshold = this.THRESHOLDS.CONTENT_SPAM
    const contentKey = `content:${userId}`

    // 최근 콘텐츠 가져오기
    const recentContents = await redis.lrange(
      contentKey,
      0,
      threshold.minPosts - 1
    )

    if (recentContents.length >= threshold.minPosts - 1) {
      // 간단한 유사도 체크 (실제로는 더 정교한 알고리즘 필요)
      let duplicateCount = 0

      for (const prevContent of recentContents) {
        const similarity = this.calculateSimilarity(content, prevContent)
        if (similarity >= threshold.duplicateThreshold) {
          duplicateCount++
        }
      }

      if (duplicateCount > 0) {
        return {
          pattern: PatternType.CONTENT_SPAM,
          timestamp: new Date(),
          details: {
            duplicateCount,
            totalPosts: recentContents.length + 1,
            similarity: duplicateCount / recentContents.length,
          },
          score: duplicateCount / recentContents.length,
        }
      }
    }

    // 현재 콘텐츠 저장
    await redis.lpush(contentKey, content)
    await redis.ltrim(contentKey, 0, 9) // 최대 10개 유지
    await redis.expire(contentKey, 300) // 5분 TTL

    return null
  }

  /**
   * Scraping 패턴 감지
   */
  private static async detectScraping(
    userId: string,
    metrics: BehaviorMetrics
  ): Promise<PatternEvidence | null> {
    const threshold = this.THRESHOLDS.SCRAPING

    // READ 작업 비율 체크
    const readActions = Array.from(metrics.uniqueActions).filter(
      (action) =>
        action.includes('read') ||
        action.includes('list') ||
        action.includes('search')
    )

    const readRatio = readActions.length / metrics.uniqueActions.size

    if (
      readRatio >= threshold.readRatio &&
      metrics.requestCount >= threshold.sequentialPages
    ) {
      return {
        pattern: PatternType.SCRAPING,
        timestamp: new Date(),
        details: {
          readRatio,
          requestCount: metrics.requestCount,
          uniqueActions: Array.from(metrics.uniqueActions),
        },
        score: readRatio,
      }
    }

    return null
  }

  /**
   * 패턴 분석 및 종합 판단
   */
  private static analyzePatterns(
    evidences: PatternEvidence[],
    metrics: BehaviorMetrics
  ): PatternDetectionResult {
    if (!evidences || evidences.length === 0) {
      return {
        detected: false,
        patterns: [],
        confidence: 0,
        severity: 'low',
        suggestedAction: 'allow',
        evidence: [],
      }
    }

    // 패턴별 가중치
    const weights: Record<PatternType, number> = {
      [PatternType.RAPID_FIRE]: 0.8,
      [PatternType.SEQUENTIAL_FAILURE]: 0.9,
      [PatternType.SUSPICIOUS_TIMING]: 0.6,
      [PatternType.CONTENT_SPAM]: 0.85,
      [PatternType.AUTOMATION]: 0.7,
      [PatternType.DISTRIBUTED_ATTACK]: 0.95,
      [PatternType.CREDENTIAL_STUFFING]: 0.95,
      [PatternType.SCRAPING]: 0.5,
    }

    // 종합 점수 계산
    let totalScore = 0
    const patterns = evidences.map((e) => e.pattern)

    for (const evidence of evidences) {
      const weight = weights[evidence.pattern]
      totalScore += evidence.score * weight
    }

    const confidence = Math.min(totalScore / evidences.length, 1)

    // 심각도 결정
    let severity: 'low' | 'medium' | 'high' | 'critical'
    if (
      confidence >= 0.9 ||
      patterns.includes(PatternType.CREDENTIAL_STUFFING)
    ) {
      severity = 'critical'
    } else if (
      confidence >= 0.7 ||
      patterns.includes(PatternType.SEQUENTIAL_FAILURE)
    ) {
      severity = 'high'
    } else if (confidence >= 0.5) {
      severity = 'medium'
    } else {
      severity = 'low'
    }

    // 권장 조치 결정
    let suggestedAction: 'allow' | 'challenge' | 'block' | 'ban'
    if (severity === 'critical') {
      suggestedAction = metrics.failureCount > 10 ? 'ban' : 'block'
    } else if (severity === 'high') {
      suggestedAction = 'block'
    } else if (severity === 'medium') {
      suggestedAction = 'challenge'
    } else {
      suggestedAction = 'allow'
    }

    return {
      detected: true,
      patterns,
      confidence,
      severity,
      suggestedAction,
      evidence: evidences,
    }
  }

  /**
   * 분산 계산 (헬퍼 함수)
   */
  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2))
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length)
  }

  /**
   * 텍스트 유사도 계산 (간단한 버전)
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const len1 = text1.length
    const len2 = text2.length
    const maxLen = Math.max(len1, len2)

    if (maxLen === 0) return 1

    // 간단한 Levenshtein distance 기반 유사도
    let distance = 0
    const minLen = Math.min(len1, len2)

    for (let i = 0; i < minLen; i++) {
      if (text1[i] !== text2[i]) distance++
    }

    distance += Math.abs(len1 - len2)

    return 1 - distance / maxLen
  }

  /**
   * 기본 메트릭 반환
   */
  private static getDefaultMetrics(): BehaviorMetrics {
    return {
      requestCount: 0,
      failureCount: 0,
      successRate: 1,
      averageInterval: 0,
      minInterval: 0,
      uniqueActions: new Set(),
      uniqueIPs: new Set(),
      userAgent: [],
      timeDistribution: new Map(),
    }
  }

  /**
   * 행동 로그 기록
   */
  static async logBehavior(
    userId: string,
    action: ActionCategory,
    success: boolean,
    metadata?: BehaviorLogMetadata
  ): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    const logKey = `behavior:${userId}`
    const now = Date.now()

    const logData = JSON.stringify({
      action,
      failed: !success,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
      timestamp: now,
    })

    // Sorted Set에 저장 (score는 timestamp)
    await redis.zadd(logKey, now, logData)

    // 오래된 로그 제거 (1시간 이상)
    await redis.zremrangebyscore(logKey, '-inf', now - this.LONG_WINDOW_SIZE)

    // TTL 설정
    await redis.expire(logKey, 3600) // 1시간

    // 실패한 경우 추가 기록
    if (!success) {
      const failureKey = `failures:${userId}`
      await redis.incr(failureKey)
      await redis.expire(failureKey, 300) // 5분
    }
  }
}
