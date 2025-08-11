/**
 * User Trust Scoring System
 * 사용자 신뢰도를 계산하여 Rate Limiting을 동적으로 조정
 */

import { prisma } from '@/lib/core/prisma'
import { redis as getRedis } from '@/lib/core/redis'
import type { User } from '@prisma/client'

// Type for user with relations from the Prisma query
interface UserWithRelations extends User {
  mainPosts: Array<{
    likeCount: number
    viewCount: number
    status: string
  }>
  communityPosts: Array<{
    likeCount: number
    viewCount: number
  }>
  mainComments: Array<{ id: string }>
  communityComments: Array<{ id: string }>
  _count: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    communityComments: number
    mainLikes: number
    communityLikes: number
  }
}

export enum TrustLevel {
  NEW = 'NEW', // 신규 사용자 (0-0.2)
  BASIC = 'BASIC', // 기본 사용자 (0.2-0.5)
  VERIFIED = 'VERIFIED', // 인증된 사용자 (0.5-0.7)
  TRUSTED = 'TRUSTED', // 신뢰 사용자 (0.7-0.9)
  PREMIUM = 'PREMIUM', // 프리미엄 사용자 (0.9-1.0)
}

export interface TrustFactors {
  accountAge: number // 계정 생성 기간 (일)
  emailVerified: boolean // 이메일 인증 여부
  phoneVerified: boolean // 전화번호 인증 여부
  contentQuality: number // 콘텐츠 품질 점수 (0-1)
  violationCount: number // 규칙 위반 횟수
  reportCount: number // 신고 받은 횟수
  contributionCount: number // 기여도 (게시글, 댓글 수)
  likeRatio: number // 좋아요 비율
  isPremium: boolean // 프리미엄 구독 여부
  isAdmin: boolean // 관리자 여부
  isBanned: boolean // 차단 여부
  lastViolation?: Date // 마지막 위반 시간
}

export interface TrustScore {
  userId: string
  score: number // 0-1 범위의 신뢰도 점수
  level: TrustLevel
  factors: TrustFactors
  calculatedAt: Date
  nextReview: Date // 다음 재계산 시간
}

export class TrustScorer {
  private static readonly CACHE_PREFIX = 'trust:'
  private static readonly CACHE_TTL = 3600 // 1시간 캐시

  /**
   * 사용자 신뢰도 점수 계산
   */
  static async calculateTrustScore(userId: string): Promise<TrustScore> {
    try {
      // 캐시 확인
      const cached = await this.getCachedScore(userId)
      if (cached) return cached

      // 사용자 정보 조회
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          mainPosts: {
            select: {
              likeCount: true,
              viewCount: true,
              status: true,
            },
          },
          communityPosts: {
            select: {
              likeCount: true,
              viewCount: true,
            },
          },
          mainComments: {
            select: { id: true },
          },
          communityComments: {
            select: { id: true },
          },
          _count: {
            select: {
              mainPosts: true,
              communityPosts: true,
              mainComments: true,
              communityComments: true,
              mainLikes: true,
              communityLikes: true,
            },
          },
        },
      })

      if (!user) {
        throw new Error(`User not found: ${userId}`)
      }

      // Trust Factors 수집
      const factors = await this.collectTrustFactors(user)

      // 점수 계산
      const score = this.computeScore(factors)

      // Trust Level 결정
      const level = this.getTrustLevel(score)

      const trustScore: TrustScore = {
        userId,
        score,
        level,
        factors,
        calculatedAt: new Date(),
        nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      }

      // 캐시 저장
      await this.cacheScore(trustScore)

      return trustScore
    } catch (error) {
      // 오류 발생시 기본값 반환
      console.error('Trust score calculation failed:', error)
      return {
        userId,
        score: 0,
        level: TrustLevel.NEW,
        factors: {
          accountAge: 0,
          emailVerified: false,
          phoneVerified: false,
          contentQuality: 0,
          violationCount: 0,
          reportCount: 0,
          contributionCount: 0,
          likeRatio: 0,
          isPremium: false,
          isAdmin: false,
          isBanned: false,
        },
        calculatedAt: new Date(),
        nextReview: new Date(Date.now() + 60 * 60 * 1000), // 1시간 후 재시도
      }
    }
  }

  /**
   * Trust Factors 수집
   */
  private static async collectTrustFactors(
    user: UserWithRelations
  ): Promise<TrustFactors> {
    const now = new Date()
    const accountAge = Math.floor(
      (now.getTime() - new Date(user.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // 콘텐츠 통계
    const totalPosts = user._count.mainPosts + user._count.communityPosts
    const totalComments =
      user._count.mainComments + user._count.communityComments
    const contributionCount = totalPosts + totalComments

    // 좋아요 비율 계산 (받은 좋아요 / 전체 조회수)
    let totalReceivedLikes = 0
    let totalViews = 0

    for (const post of [...user.mainPosts, ...user.communityPosts]) {
      totalReceivedLikes += post.likeCount
      totalViews += post.viewCount
    }

    const likeRatio = totalViews > 0 ? totalReceivedLikes / totalViews : 0

    // 규칙 위반 횟수 조회 (Redis에서)
    const violationCount = await this.getViolationCount(user.id)
    const reportCount = await this.getReportCount(user.id)

    // 콘텐츠 품질 점수 (간단한 계산)
    const contentQuality = this.calculateContentQuality(
      totalPosts,
      totalReceivedLikes,
      totalViews
    )

    return {
      accountAge,
      emailVerified: user.emailVerified !== null,
      phoneVerified: false, // 현재 시스템에 없음
      contentQuality,
      violationCount,
      reportCount,
      contributionCount,
      likeRatio: Math.min(likeRatio, 1), // 최대 1로 제한
      isPremium: false, // 현재 시스템에 없음
      isAdmin: user.globalRole === 'ADMIN',
      isBanned: user.isBanned || false,
      lastViolation: undefined, // Redis에서 별도 조회 필요
    }
  }

  /**
   * 신뢰도 점수 계산 알고리즘
   */
  private static computeScore(factors: TrustFactors): number {
    let score = 0

    // 차단된 사용자는 0점
    if (factors.isBanned) return 0

    // 관리자는 최고 점수
    if (factors.isAdmin) return 1.0

    // 계정 나이 (최대 0.2점)
    if (factors.accountAge >= 365)
      score += 0.2 // 1년 이상
    else if (factors.accountAge >= 90)
      score += 0.15 // 3개월 이상
    else if (factors.accountAge >= 30)
      score += 0.1 // 1개월 이상
    else if (factors.accountAge >= 7) score += 0.05 // 1주일 이상

    // 이메일 인증 (0.15점)
    if (factors.emailVerified) score += 0.15

    // 전화번호 인증 (0.1점)
    if (factors.phoneVerified) score += 0.1

    // 콘텐츠 품질 (최대 0.2점)
    score += factors.contentQuality * 0.2

    // 기여도 (최대 0.15점)
    if (factors.contributionCount >= 100) score += 0.15
    else if (factors.contributionCount >= 50) score += 0.1
    else if (factors.contributionCount >= 20) score += 0.05
    else if (factors.contributionCount >= 10) score += 0.03

    // 좋아요 비율 (최대 0.1점)
    score += Math.min(factors.likeRatio * 0.5, 0.1)

    // 프리미엄 구독 (0.1점)
    if (factors.isPremium) score += 0.1

    // 위반 및 신고에 따른 감점
    score -= factors.violationCount * 0.1 // 위반당 -0.1점
    score -= factors.reportCount * 0.05 // 신고당 -0.05점

    // 최근 위반 시 추가 감점
    if (factors.lastViolation) {
      const daysSinceViolation = Math.floor(
        (Date.now() - factors.lastViolation.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceViolation < 7)
        score -= 0.2 // 1주일 이내
      else if (daysSinceViolation < 30) score -= 0.1 // 1개월 이내
    }

    // 0-1 범위로 제한
    return Math.max(0, Math.min(1, score))
  }

  /**
   * Trust Level 결정
   */
  private static getTrustLevel(score: number): TrustLevel {
    if (score >= 0.9) return TrustLevel.PREMIUM
    if (score >= 0.7) return TrustLevel.TRUSTED
    if (score >= 0.5) return TrustLevel.VERIFIED
    if (score >= 0.2) return TrustLevel.BASIC
    return TrustLevel.NEW
  }

  /**
   * 콘텐츠 품질 점수 계산
   */
  private static calculateContentQuality(
    posts: number,
    likes: number,
    views: number
  ): number {
    if (posts === 0 || views === 0) return 0

    // 좋아요/조회수 비율과 게시글 수를 고려한 품질 점수
    const engagementRate = likes / views
    const activityScore = Math.min(posts / 50, 1) // 50개 게시글을 최대로

    return engagementRate * 0.7 + activityScore * 0.3
  }

  /**
   * 위반 횟수 조회
   */
  private static async getViolationCount(userId: string): Promise<number> {
    const key = `violations:${userId}`
    const redis = getRedis()
    if (!redis) return 0
    const count = await redis.get(key)
    return count ? parseInt(count) : 0
  }

  /**
   * 신고 횟수 조회
   */
  private static async getReportCount(userId: string): Promise<number> {
    const key = `reports:${userId}`
    const redis = getRedis()
    if (!redis) return 0
    const count = await redis.get(key)
    return count ? parseInt(count) : 0
  }

  /**
   * 캐시된 점수 조회
   */
  private static async getCachedScore(
    userId: string
  ): Promise<TrustScore | null> {
    const key = `${this.CACHE_PREFIX}${userId}`
    const redis = getRedis()
    if (!redis) return null
    const cached = await redis.get(key)

    if (cached) {
      return JSON.parse(cached)
    }

    return null
  }

  /**
   * 점수 캐시 저장
   */
  private static async cacheScore(score: TrustScore): Promise<void> {
    const key = `${this.CACHE_PREFIX}${score.userId}`
    const redis = getRedis()
    if (!redis) return
    await redis.setex(key, this.CACHE_TTL, JSON.stringify(score))
  }

  /**
   * 위반 기록
   */
  static async recordViolation(
    userId: string,
    type: 'rate_limit' | 'spam' | 'abuse' | 'other',
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    // 위반 횟수 증가
    const violationKey = `violations:${userId}`
    const redis = getRedis()
    if (!redis) return
    await redis.incr(violationKey)

    // 최근 위반 시간 저장
    const lastViolationKey = `last_violation:${userId}`
    await redis.set(lastViolationKey, new Date().toISOString())

    // 심각도에 따른 추가 처리
    if (severity === 'high') {
      // 캐시 무효화 (재계산 필요)
      const cacheKey = `${this.CACHE_PREFIX}${userId}`
      await redis.del(cacheKey)
    }

    // 위반 로그 저장 (7일간 보관)
    const logKey = `violation_log:${userId}:${Date.now()}`
    await redis.setex(
      logKey,
      7 * 24 * 60 * 60,
      JSON.stringify({ type, severity, timestamp: new Date() })
    )
  }

  /**
   * 신고 기록
   */
  static async recordReport(
    userId: string,
    reporterId: string,
    reason: string
  ): Promise<void> {
    // 신고 횟수 증가
    const reportKey = `reports:${userId}`
    const redis = getRedis()
    if (!redis) return
    await redis.incr(reportKey)

    // 신고 로그 저장 (30일간 보관)
    const logKey = `report_log:${userId}:${Date.now()}`
    await redis.setex(
      logKey,
      30 * 24 * 60 * 60,
      JSON.stringify({ reporterId, reason, timestamp: new Date() })
    )

    // 캐시 무효화
    const cacheKey = `${this.CACHE_PREFIX}${userId}`
    await redis.del(cacheKey)
  }

  /**
   * Trust Level별 Rate Limit 승수 반환
   */
  static getRateLimitMultiplier(level: TrustLevel): number {
    switch (level) {
      case TrustLevel.PREMIUM:
        return 5.0 // 5배 증가
      case TrustLevel.TRUSTED:
        return 3.0 // 3배 증가
      case TrustLevel.VERIFIED:
        return 2.0 // 2배 증가
      case TrustLevel.BASIC:
        return 1.5 // 1.5배 증가
      case TrustLevel.NEW:
      default:
        return 1.0 // 기본값
    }
  }
}
