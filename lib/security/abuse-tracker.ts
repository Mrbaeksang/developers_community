/**
 * Abuse Tracking System
 * 사용자 행동 추적 및 악용 대응 시스템
 */

import { redis as getRedis } from '@/lib/core/redis'
import { PatternDetector, PatternType } from './pattern-detector'
import { TrustScorer } from './trust-scorer'
import { ActionCategory } from './actions'

export enum AbuseType {
  RATE_LIMIT_VIOLATION = 'RATE_LIMIT_VIOLATION',
  PATTERN_DETECTION = 'PATTERN_DETECTION',
  MANUAL_REPORT = 'MANUAL_REPORT',
  CONTENT_VIOLATION = 'CONTENT_VIOLATION',
  SECURITY_THREAT = 'SECURITY_THREAT',
}

export enum ResponseAction {
  NONE = 'NONE', // 조치 없음
  WARNING = 'WARNING', // 경고
  THROTTLE = 'THROTTLE', // 속도 제한
  CHALLENGE = 'CHALLENGE', // 챌린지 (CAPTCHA 등)
  TEMPORARY_BLOCK = 'TEMPORARY_BLOCK', // 임시 차단
  PERMANENT_BAN = 'PERMANENT_BAN', // 영구 차단
}

// Type for incident metadata
interface IncidentMetadata {
  ip?: string
  userAgent?: string
  content?: string
  reason?: string
  patterns?: PatternType[]
  severity?: 'low' | 'medium' | 'high' | 'critical'
  // Index signature must match DetectionMetadata exactly
  [key: string]:
    | string
    | number
    | boolean
    | PatternType[]
    | ('low' | 'medium' | 'high' | 'critical')
    | undefined
}

// Type for restriction details
interface RestrictionDetails {
  type?: string
  multiplier?: number
  required?: boolean
  permanent?: boolean
  until?: string | Date
  reason?: string
  bannedAt?: Date
  // Removed index signature to avoid type conflicts
  // All known properties are explicitly defined
}

export interface AbuseIncident {
  id: string
  userId: string
  type: AbuseType
  severity: 'low' | 'medium' | 'high' | 'critical'
  patterns?: PatternType[]
  action: ActionCategory
  timestamp: Date
  metadata?: IncidentMetadata
  responseAction: ResponseAction
  expiresAt?: Date
}

export interface UserAbuseProfile {
  userId: string
  incidents: AbuseIncident[]
  totalScore: number // 누적 악용 점수
  currentStatus: 'normal' | 'watching' | 'throttled' | 'blocked' | 'banned'
  restrictions: RestrictionInfo[]
  lastIncident?: Date
  nextReview: Date
}

export interface RestrictionInfo {
  type: 'throttle' | 'block' | 'ban' | 'challenge'
  reason: string
  startedAt: Date
  expiresAt?: Date
  details?: RestrictionDetails
}

export interface AbuseMetrics {
  totalIncidents: number
  incidentsByType: Map<AbuseType, number>
  severityDistribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
  recentPatterns: PatternType[]
  escalationLevel: number // 0-5, 에스컬레이션 레벨
}

export class AbuseTracker {
  private static readonly INCIDENT_TTL = 7 * 24 * 60 * 60 // 7일
  private static readonly PROFILE_TTL = 30 * 24 * 60 * 60 // 30일

  // 심각도별 점수
  private static readonly SEVERITY_SCORES = {
    low: 1,
    medium: 5,
    high: 10,
    critical: 20,
  }

  // 응답 조치 임계값
  private static readonly ACTION_THRESHOLDS = {
    WARNING: 5,
    THROTTLE: 15,
    CHALLENGE: 25,
    TEMPORARY_BLOCK: 50,
    PERMANENT_BAN: 100,
  }

  /**
   * 악용 사건 기록
   */
  static async recordIncident(
    userId: string,
    type: AbuseType,
    action: ActionCategory,
    details?: {
      patterns?: PatternType[]
      severity?: 'low' | 'medium' | 'high' | 'critical'
      metadata?: IncidentMetadata
    }
  ): Promise<AbuseIncident> {
    const incidentId = `incident:${userId}:${Date.now()}`
    const severity = details?.severity || 'medium'

    // 패턴 감지 실행 (제공되지 않은 경우)
    let patterns = details?.patterns
    if (!patterns && type === AbuseType.PATTERN_DETECTION) {
      const detection = await PatternDetector.detect(
        userId,
        action,
        details?.metadata
      )
      if (detection.detected) {
        patterns = detection.patterns
      }
    }

    // 적절한 응답 조치 결정
    const responseAction = await this.determineResponseAction(
      userId,
      severity,
      patterns
    )

    // 사건 생성
    const incident: AbuseIncident = {
      id: incidentId,
      userId,
      type,
      severity,
      patterns,
      action,
      timestamp: new Date(),
      metadata: details?.metadata,
      responseAction,
      expiresAt: this.calculateExpiration(responseAction),
    }

    // Redis에 저장
    await this.saveIncident(incident)

    // 사용자 프로필 업데이트
    await this.updateUserProfile(userId, incident)

    // 응답 조치 적용
    await this.applyResponseAction(userId, responseAction, incident)

    // Trust Score에 위반 기록
    if (severity === 'high' || severity === 'critical') {
      await TrustScorer.recordViolation(userId, 'abuse', severity)
    }

    return incident
  }

  /**
   * 응답 조치 결정
   */
  private static async determineResponseAction(
    userId: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    patterns?: PatternType[]
  ): Promise<ResponseAction> {
    // 사용자 악용 점수 가져오기
    const profile = await this.getUserProfile(userId)
    const baseScore = profile.totalScore
    const severityScore = this.SEVERITY_SCORES[severity]
    const totalScore = baseScore + severityScore

    // 특정 패턴에 대한 즉시 조치
    if (patterns) {
      if (patterns.includes(PatternType.CREDENTIAL_STUFFING)) {
        return ResponseAction.PERMANENT_BAN
      }
      if (patterns.includes(PatternType.DISTRIBUTED_ATTACK)) {
        return ResponseAction.TEMPORARY_BLOCK
      }
    }

    // 심각도가 critical인 경우
    if (severity === 'critical') {
      if (totalScore >= this.ACTION_THRESHOLDS.PERMANENT_BAN) {
        return ResponseAction.PERMANENT_BAN
      }
      return ResponseAction.TEMPORARY_BLOCK
    }

    // 점수 기반 조치
    if (totalScore >= this.ACTION_THRESHOLDS.PERMANENT_BAN) {
      return ResponseAction.PERMANENT_BAN
    }
    if (totalScore >= this.ACTION_THRESHOLDS.TEMPORARY_BLOCK) {
      return ResponseAction.TEMPORARY_BLOCK
    }
    if (totalScore >= this.ACTION_THRESHOLDS.CHALLENGE) {
      return ResponseAction.CHALLENGE
    }
    if (totalScore >= this.ACTION_THRESHOLDS.THROTTLE) {
      return ResponseAction.THROTTLE
    }
    if (totalScore >= this.ACTION_THRESHOLDS.WARNING) {
      return ResponseAction.WARNING
    }

    return ResponseAction.NONE
  }

  /**
   * 응답 조치 적용
   */
  private static async applyResponseAction(
    userId: string,
    action: ResponseAction,
    incident: AbuseIncident
  ): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    const restrictionKey = `restriction:${userId}`

    switch (action) {
      case ResponseAction.WARNING:
        // 경고 카운터 증가
        await redis.incr(`warnings:${userId}`)
        break

      case ResponseAction.THROTTLE:
        // 속도 제한 적용 (30분)
        await redis.setex(
          restrictionKey,
          1800,
          JSON.stringify({
            type: 'throttle',
            multiplier: 0.5, // 속도 50% 감소
            reason: incident.id,
          })
        )
        break

      case ResponseAction.CHALLENGE:
        // 챌린지 요구 (1시간)
        await redis.setex(
          `${restrictionKey}:challenge`,
          3600,
          JSON.stringify({
            type: 'challenge',
            required: true,
            reason: incident.id,
          })
        )
        break

      case ResponseAction.TEMPORARY_BLOCK:
        // 임시 차단 (24시간)
        await redis.setex(
          `${restrictionKey}:block`,
          86400,
          JSON.stringify({
            type: 'block',
            until: new Date(Date.now() + 86400000),
            reason: incident.id,
          })
        )
        // Prisma 업데이트
        await this.updateUserBanStatus(userId, false, 86400)
        break

      case ResponseAction.PERMANENT_BAN:
        // 영구 차단
        await redis.set(
          `${restrictionKey}:ban`,
          JSON.stringify({
            type: 'ban',
            permanent: true,
            reason: incident.id,
            bannedAt: new Date(),
          })
        )
        // Prisma 업데이트
        await this.updateUserBanStatus(userId, true)
        break
    }
  }

  /**
   * 사용자 차단 상태 업데이트
   */
  private static async updateUserBanStatus(
    userId: string,
    isBanned: boolean,
    duration?: number
  ): Promise<void> {
    try {
      const { prisma } = await import('@/lib/core/prisma')

      await prisma.user.update({
        where: { id: userId },
        data: {
          isBanned,
          banReason: isBanned ? 'Security violation detected' : null,
          banUntil: duration ? new Date(Date.now() + duration * 1000) : null,
        },
      })
    } catch (error) {
      console.error('Failed to update user ban status:', error)
    }
  }

  /**
   * 사용자 프로필 조회
   */
  static async getUserProfile(userId: string): Promise<UserAbuseProfile> {
    const redis = getRedis()
    if (!redis) {
      return this.getDefaultProfile(userId)
    }

    const profileKey = `abuse:profile:${userId}`
    const cached = await redis.get(profileKey)

    if (cached) {
      return JSON.parse(cached)
    }

    // 프로필 생성
    const incidents = await this.getUserIncidents(userId)
    const totalScore = this.calculateTotalScore(incidents)
    const currentStatus = await this.getUserStatus(userId)
    const restrictions = await this.getUserRestrictions(userId)

    const profile: UserAbuseProfile = {
      userId,
      incidents,
      totalScore,
      currentStatus,
      restrictions,
      lastIncident: incidents[0]?.timestamp,
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
    }

    // 캐시 저장
    await redis.setex(profileKey, 3600, JSON.stringify(profile))

    return profile
  }

  /**
   * 사용자 사건 목록 조회
   */
  private static async getUserIncidents(
    userId: string
  ): Promise<AbuseIncident[]> {
    const redis = getRedis()
    if (!redis) return []

    const pattern = `incident:${userId}:*`
    const keys = await redis.keys(pattern)

    const incidents: AbuseIncident[] = []

    for (const key of keys) {
      const data = await redis.get(key)
      if (data) {
        try {
          incidents.push(JSON.parse(data))
        } catch (error) {
          console.error('Failed to parse incident:', error)
        }
      }
    }

    // 시간순 정렬
    return incidents.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /**
   * 사용자 상태 조회
   */
  private static async getUserStatus(
    userId: string
  ): Promise<'normal' | 'watching' | 'throttled' | 'blocked' | 'banned'> {
    const redis = getRedis()
    if (!redis) return 'normal'

    // 차단 확인
    const banKey = `restriction:${userId}:ban`
    const banned = await redis.exists(banKey)
    if (banned) return 'banned'

    const blockKey = `restriction:${userId}:block`
    const blocked = await redis.exists(blockKey)
    if (blocked) return 'blocked'

    const throttleKey = `restriction:${userId}`
    const throttled = await redis.exists(throttleKey)
    if (throttled) return 'throttled'

    // 악용 점수 기반
    const profile = await this.getUserProfile(userId)
    if (profile.totalScore >= this.ACTION_THRESHOLDS.WARNING) {
      return 'watching'
    }

    return 'normal'
  }

  /**
   * 사용자 제한 조회
   */
  private static async getUserRestrictions(
    userId: string
  ): Promise<RestrictionInfo[]> {
    const redis = getRedis()
    if (!redis) return []

    const restrictions: RestrictionInfo[] = []

    // 각 제한 유형 확인
    const types = ['', ':challenge', ':block', ':ban']

    for (const type of types) {
      const key = `restriction:${userId}${type}`
      const data = await redis.get(key)

      if (data) {
        try {
          const restriction = JSON.parse(data)
          restrictions.push({
            type: restriction.type,
            reason: restriction.reason || 'Unknown',
            startedAt: restriction.startedAt || new Date(),
            expiresAt: restriction.until,
            details: restriction,
          })
        } catch (error) {
          console.error('Failed to parse restriction:', error)
        }
      }
    }

    return restrictions
  }

  /**
   * 총 악용 점수 계산
   */
  private static calculateTotalScore(incidents: AbuseIncident[]): number {
    let score = 0
    const now = Date.now()

    for (const incident of incidents) {
      const age = now - new Date(incident.timestamp).getTime()
      const ageInDays = age / (24 * 60 * 60 * 1000)

      // 시간이 지날수록 점수 감소 (반감기: 7일)
      const decayFactor = Math.pow(0.5, ageInDays / 7)
      const incidentScore = this.SEVERITY_SCORES[incident.severity]

      score += incidentScore * decayFactor
    }

    return Math.round(score)
  }

  /**
   * 만료 시간 계산
   */
  private static calculateExpiration(action: ResponseAction): Date | undefined {
    const now = Date.now()

    switch (action) {
      case ResponseAction.WARNING:
        return new Date(now + 7 * 24 * 60 * 60 * 1000) // 7일
      case ResponseAction.THROTTLE:
        return new Date(now + 30 * 60 * 1000) // 30분
      case ResponseAction.CHALLENGE:
        return new Date(now + 60 * 60 * 1000) // 1시간
      case ResponseAction.TEMPORARY_BLOCK:
        return new Date(now + 24 * 60 * 60 * 1000) // 24시간
      case ResponseAction.PERMANENT_BAN:
        return undefined // 무기한
      default:
        return new Date(now + 24 * 60 * 60 * 1000) // 기본 24시간
    }
  }

  /**
   * 사건 저장
   */
  private static async saveIncident(incident: AbuseIncident): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    const key = incident.id
    await redis.setex(key, this.INCIDENT_TTL, JSON.stringify(incident))

    // 사용자별 인덱스에 추가
    const indexKey = `incidents:${incident.userId}`
    await redis.sadd(indexKey, key)
    await redis.expire(indexKey, this.INCIDENT_TTL)
  }

  /**
   * 사용자 프로필 업데이트
   */
  private static async updateUserProfile(
    userId: string,
    incident: AbuseIncident
  ): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    // 프로필 캐시 무효화
    const profileKey = `abuse:profile:${userId}`
    await redis.del(profileKey)

    // 메트릭 업데이트
    const metricsKey = `abuse:metrics:${userId}`
    await redis.hincrby(metricsKey, 'total', 1)
    await redis.hincrby(metricsKey, incident.type, 1)
    await redis.hincrby(metricsKey, `severity:${incident.severity}`, 1)
    await redis.expire(metricsKey, this.PROFILE_TTL)
  }

  /**
   * 악용 메트릭 조회
   */
  static async getAbuseMetrics(userId: string): Promise<AbuseMetrics> {
    const profile = await this.getUserProfile(userId)
    const incidents = profile.incidents

    // 타입별 집계
    const incidentsByType = new Map<AbuseType, number>()
    const severityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }

    const recentPatterns = new Set<PatternType>()

    for (const incident of incidents) {
      // 타입별 카운트
      const count = incidentsByType.get(incident.type) || 0
      incidentsByType.set(incident.type, count + 1)

      // 심각도 분포
      severityDistribution[incident.severity]++

      // 최근 패턴 수집 (최근 24시간)
      const isRecent =
        Date.now() - new Date(incident.timestamp).getTime() < 86400000
      if (isRecent && incident.patterns) {
        incident.patterns.forEach((p) => recentPatterns.add(p))
      }
    }

    // 에스컬레이션 레벨 계산
    const escalationLevel = Math.min(5, Math.floor(profile.totalScore / 20))

    return {
      totalIncidents: incidents.length,
      incidentsByType,
      severityDistribution,
      recentPatterns: Array.from(recentPatterns),
      escalationLevel,
    }
  }

  /**
   * 제한 해제
   */
  static async clearRestriction(
    userId: string,
    type?: 'throttle' | 'block' | 'ban' | 'challenge'
  ): Promise<void> {
    const redis = getRedis()
    if (!redis) return

    if (type) {
      const key =
        type === 'throttle'
          ? `restriction:${userId}`
          : `restriction:${userId}:${type}`
      await redis.del(key)
    } else {
      // 모든 제한 해제
      const pattern = `restriction:${userId}*`
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }

    // 차단 상태 해제 (DB)
    if (type === 'ban' || type === 'block' || !type) {
      await this.updateUserBanStatus(userId, false)
    }
  }

  /**
   * 기본 프로필 반환
   */
  private static getDefaultProfile(userId: string): UserAbuseProfile {
    return {
      userId,
      incidents: [],
      totalScore: 0,
      currentStatus: 'normal',
      restrictions: [],
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }
  }
}
