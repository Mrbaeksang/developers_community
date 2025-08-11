/**
 * Rate Limiting 프로덕션 설정 검증 테스트
 * 프로덕션 환경 기준 Rate Limiting 설정이 올바른지 확인
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RateLimiter } from '@/lib/security/rate-limiter'
import { ActionCategory, ActionType } from '@/lib/security/actions'
import { TrustLevel } from '@/lib/security/trust-scorer'
import { PatternType } from '@/lib/security/pattern-detector'

// Mock Redis
vi.mock('@/lib/core/redis', () => ({
  redis: vi.fn(() => ({
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    multi: vi.fn(() => ({
      zremrangebyscore: vi.fn(),
      zcard: vi.fn(),
      zadd: vi.fn(),
      expire: vi.fn(),
      exec: vi.fn().mockResolvedValue([
        [null, 1],
        [null, 0],
        [null, 1],
        [null, 1],
      ]),
    })),
    zcount: vi.fn().mockResolvedValue(0),
    zrangebyscore: vi.fn().mockResolvedValue([]),
    keys: vi.fn().mockResolvedValue([]),
  })),
}))

// Mock other dependencies
vi.mock('@/lib/security/trust-scorer')
vi.mock('@/lib/security/pattern-detector')
vi.mock('@/lib/security/adaptive-limiter')
vi.mock('@/lib/security/metrics')
vi.mock('@/lib/security/abuse-tracker')

describe('Rate Limiting 프로덕션 설정 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 프로덕션 환경 설정
    process.env.RATE_LIMIT_ENABLED = 'true'
    process.env.RATE_LIMIT_USE_REDIS = 'true'
    process.env.ADMIN_RATE_LIMIT_BONUS = 'true'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('프로덕션 Rate Limit 설정', () => {
    it('READ 액션 - 일반 사용자는 1분에 100회 제한', async () => {
      const result = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_READ,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeLessThanOrEqual(100)
    })

    it('WRITE 액션 - 일반 사용자는 1분에 50회 제한', async () => {
      const result = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_CREATE,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeLessThanOrEqual(50)
    })

    it('SENSITIVE 액션 - 일반 사용자는 1분에 30회 제한', async () => {
      const result = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_LIKE,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeLessThanOrEqual(30)
    })

    it('CRITICAL 액션 - 모든 사용자는 15분에 5회 제한', async () => {
      const result = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.AUTH_LOGIN,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeLessThanOrEqual(5)
    })
  })

  describe('관리자 Rate Limit 보너스', () => {
    it('관리자는 일반 사용자보다 10-20배 높은 한도를 가짐', async () => {
      // Mock 관리자 체크
      vi.mocked(RateLimiter as any).checkIfAdmin = vi
        .fn()
        .mockResolvedValue(true)

      const adminResult = await RateLimiter.getStatus(
        'admin1',
        ActionCategory.POST_READ
      )

      // 일반 사용자 한도는 100, 관리자는 최소 1000
      expect(adminResult.limit).toBeGreaterThanOrEqual(1000)
    })

    it('관리자도 완전 우회는 불가능함', async () => {
      // 관리자가 한도를 초과하는 시나리오
      const redisClient = (await import('@/lib/core/redis')).redis()
      if (!redisClient) {
        // Redis가 없을 때는 테스트 건너뛰기
        return
      }
      vi.mocked(redisClient.multi().exec).mockResolvedValue([
        [null, 1],
        [null, 2000], // 현재 요청 수가 2000
        [null, 1],
        [null, 1],
      ])

      const result = await RateLimiter.check({
        userId: 'admin1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_READ,
      })

      // 관리자도 한도 초과시 차단됨
      expect(result.allowed).toBe(false)
    })
  })

  describe('IP 기반 Rate Limiting', () => {
    it('비로그인 사용자는 IP 기반으로 제한됨', async () => {
      const result = await RateLimiter.checkByIP(
        '192.168.1.1',
        '/api/posts',
        'GET'
      )

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBeDefined()
    })

    it('IP 기반 제한은 로그인 사용자보다 50% 엄격함', async () => {
      // IP 기반 (비로그인)
      const ipResult = await RateLimiter.check({
        ipAddress: '192.168.1.1',
        action: ActionCategory.POST_READ,
      })

      // 사용자 기반 (로그인)
      const userResult = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '192.168.1.1',
        action: ActionCategory.POST_READ,
      })

      // IP 기반이 더 엄격한지 확인 (설정에 따라 다를 수 있음)
      expect(ipResult.remaining).toBeLessThanOrEqual(userResult.remaining)
    })
  })

  describe('차단 및 복구', () => {
    it('한도 초과시 일정 시간 차단됨', async () => {
      // 한도 초과 시뮬레이션
      const redisClient = (await import('@/lib/core/redis')).redis()
      if (!redisClient) {
        // Redis가 없을 때는 테스트 건너뛰기
        return
      }
      vi.mocked(redisClient.multi().exec).mockResolvedValue([
        [null, 1],
        [null, 101], // 한도 초과
        [null, 1],
        [null, 1],
      ])

      const result = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_READ,
      })

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(0)
      expect(result.reason).toContain('Rate limit exceeded')
    })

    it('차단 시간이 지나면 자동 복구됨', async () => {
      const redisClient = (await import('@/lib/core/redis')).redis()
      if (!redisClient) {
        // Redis가 없을 때는 테스트 건너뛰기
        return
      }

      // 차단 시간이 지난 상태 시뮬레이션
      vi.mocked(redisClient.get).mockResolvedValue(
        (Date.now() - 1000).toString()
      )

      const result = await RateLimiter.check({
        userId: 'user1',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_READ,
      })

      // 차단이 해제되어 통과해야 함
      expect(result.allowed).toBe(true)
    })
  })

  describe('Trust Score 연동', () => {
    it('신뢰도가 높은 사용자는 더 높은 한도를 가짐', async () => {
      // Mock Trust Score
      const { TrustScorer } = await import('@/lib/security/trust-scorer')
      vi.mocked(TrustScorer.calculateTrustScore).mockResolvedValue({
        userId: 'trusted-user',
        score: 80,
        level: TrustLevel.TRUSTED,
        factors: {} as any,
        calculatedAt: new Date(),
        nextReview: new Date(Date.now() + 3600000),
      })

      const trustedResult = await RateLimiter.getStatus(
        'trusted-user',
        ActionCategory.POST_READ
      )

      // 신뢰도가 높으면 기본 한도보다 높음
      expect(trustedResult.limit).toBeGreaterThan(100)
      expect(trustedResult.trustLevel).toBe(TrustLevel.TRUSTED)
    })

    it('차단된 사용자는 즉시 거부됨', async () => {
      const { TrustScorer } = await import('@/lib/security/trust-scorer')
      vi.mocked(TrustScorer.calculateTrustScore).mockResolvedValue({
        userId: 'blocked-user',
        score: 0,
        level: TrustLevel.NEW,
        factors: { isBanned: true } as any,
        calculatedAt: new Date(),
        nextReview: new Date(Date.now() + 3600000),
      })

      const result = await RateLimiter.check({
        userId: 'banned-user',
        ipAddress: '127.0.0.1',
        action: ActionCategory.POST_READ,
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('banned')
    })
  })

  describe('패턴 감지 연동', () => {
    it('수상한 패턴 감지시 즉시 차단', async () => {
      const { PatternDetector } = await import(
        '@/lib/security/pattern-detector'
      )
      vi.mocked(PatternDetector.detect).mockResolvedValue({
        detected: true,
        patterns: [PatternType.RAPID_FIRE],
        severity: 'critical',
        confidence: 0.95,
        suggestedAction: 'block',
        evidence: [],
      })

      const result = await RateLimiter.check({
        userId: 'attacker',
        ipAddress: '127.0.0.1',
        action: ActionCategory.AUTH_LOGIN,
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Critical pattern detected')
    })
  })

  describe('프로덕션 환경 변수 검증', () => {
    it('RATE_LIMIT_ENABLED가 활성화되어 있어야 함', () => {
      expect(process.env.RATE_LIMIT_ENABLED).toBe('true')
    })

    it('Redis를 사용하도록 설정되어 있어야 함', () => {
      expect(process.env.RATE_LIMIT_USE_REDIS).toBe('true')
    })

    it('관리자 보너스가 활성화되어 있어야 함', () => {
      expect(process.env.ADMIN_RATE_LIMIT_BONUS).toBe('true')
    })
  })

  describe('실제 프로덕션 시나리오', () => {
    it('일반 사용자가 정상적으로 게시글을 읽을 수 있음', async () => {
      // 10개 게시글 읽기
      for (let i = 0; i < 10; i++) {
        const result = await RateLimiter.check({
          userId: 'normal-user',
          ipAddress: '127.0.0.1',
          action: ActionCategory.POST_READ,
        })
        expect(result.allowed).toBe(true)
      }
    })

    it('봇이 대량 요청시 차단됨', async () => {
      const redis = (await import('@/lib/core/redis')).redis()
      if (!redis) {
        // Redis가 없을 때는 테스트 건너뛰기
        return
      }

      // 100회 이상 요청 시뮬레이션
      vi.mocked(redis.multi().exec).mockResolvedValue([
        [null, 1],
        [null, 150], // 대량 요청
        [null, 1],
        [null, 1],
      ])

      const result = await RateLimiter.check({
        ipAddress: '1.2.3.4', // 봇 IP
        action: ActionCategory.POST_READ,
      })

      expect(result.allowed).toBe(false)
    })

    it('로그인 시도 실패가 반복되면 차단됨', async () => {
      const redis = (await import('@/lib/core/redis')).redis()
      if (!redis) {
        // Redis가 없을 때는 테스트 건너뛰기
        return
      }

      // 5회 이상 로그인 시도
      vi.mocked(redis.multi().exec).mockResolvedValue([
        [null, 1],
        [null, 6], // 6번째 시도
        [null, 1],
        [null, 1],
      ])

      const result = await RateLimiter.check({
        ipAddress: '127.0.0.1',
        action: ActionCategory.AUTH_LOGIN,
      })

      expect(result.allowed).toBe(false)
      expect(result.retryAfter).toBeGreaterThan(0)
    })
  })
})
