/**
 * Rate Limiting Metrics Collection System
 * 메트릭 수집 및 모니터링 시스템
 */

import { redis as getRedis } from '@/lib/core/redis'
import { ActionCategory } from './actions'
import { PatternType } from './pattern-detector'
import type { Redis } from 'ioredis'

export interface RateLimitMetrics {
  // Request Metrics
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  throttledRequests: number

  // Time-based Metrics
  requestsPerMinute: number
  requestsPerHour: number
  peakRequestTime: Date

  // Action Metrics
  requestsByAction: Map<ActionCategory, number>
  blockedByAction: Map<ActionCategory, number>

  // Pattern Detection Metrics
  patternsDetected: Map<PatternType, number>
  falsePositives: number
  truePositives: number

  // User Metrics
  uniqueUsers: number
  topUsers: Array<{ userId: string; requests: number }>

  // Performance Metrics
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number

  // System Health
  redisLatency: number
  memoryUsage: number
  errorRate: number
}

export interface ActionMetrics {
  action: ActionCategory
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  averageProcessingTime: number
  peakTime: Date
  uniqueUsers: Set<string>
}

export interface UserMetrics {
  userId: string
  totalRequests: number
  allowedRequests: number
  blockedRequests: number
  trustScore: number
  patterns: PatternType[]
  lastActivity: Date
  requestDistribution: Map<ActionCategory, number>
}

export interface SystemHealthMetrics {
  timestamp: Date
  redisConnected: boolean
  redisLatency: number
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
  activeConnections: number
  queueSize: number
  errorCount: number
  errorRate: number
}

export class MetricsCollector {
  private static readonly METRICS_WINDOW = 60 * 60 * 1000 // 1시간
  private static readonly AGGREGATION_INTERVAL = 5 * 60 * 1000 // 5분
  private static readonly MAX_TOP_USERS = 20

  // In-memory metrics buffer (Edge Runtime 호환)
  private static metricsBuffer: Map<string, number> = new Map()
  private static lastAggregation: number = Date.now()

  /**
   * 요청 메트릭 기록
   */
  static async recordRequest(
    userId: string,
    action: ActionCategory,
    allowed: boolean,
    processingTime: number,
    metadata?: {
      pattern?: PatternType
      reason?: string
      trustScore?: number
    }
  ): Promise<void> {
    const now = Date.now()
    const minute = Math.floor(now / 60000) * 60000
    const hour = Math.floor(now / 3600000) * 3600000

    // Buffer에 기록
    this.updateBuffer('total_requests', 1)
    this.updateBuffer(allowed ? 'allowed_requests' : 'blocked_requests', 1)
    this.updateBuffer(`action:${action}`, 1)
    this.updateBuffer(`user:${userId}`, 1)

    if (metadata?.pattern) {
      this.updateBuffer(`pattern:${metadata.pattern}`, 1)
    }

    // Redis 기록 (가능한 경우)
    try {
      const redis = getRedis()
      if (redis) {
        await this.recordToRedis(redis, {
          userId,
          action,
          allowed,
          processingTime,
          timestamp: now,
          minute,
          hour,
          ...metadata,
        })
      }
    } catch (error) {
      console.error('Failed to record metrics to Redis:', error)
    }

    // 주기적 집계
    if (now - this.lastAggregation > this.AGGREGATION_INTERVAL) {
      await this.aggregateMetrics()
    }
  }

  /**
   * Redis에 메트릭 기록
   */
  private static async recordToRedis(
    redis: Redis,
    data: {
      userId: string
      action: ActionCategory
      allowed: boolean
      processingTime: number
      timestamp: number
      minute: number
      hour: number
      pattern?: PatternType
      reason?: string
      trustScore?: number
    }
  ): Promise<void> {
    const pipeline = redis.pipeline()

    // 전체 카운터
    pipeline.hincrby('metrics:global', 'total_requests', 1)
    pipeline.hincrby('metrics:global', data.allowed ? 'allowed' : 'blocked', 1)

    // 분당 메트릭
    const minuteKey = `metrics:minute:${data.minute}`
    pipeline.hincrby(minuteKey, 'requests', 1)
    pipeline.hincrby(minuteKey, data.allowed ? 'allowed' : 'blocked', 1)
    pipeline.expire(minuteKey, 3600) // 1시간 보관

    // 시간당 메트릭
    const hourKey = `metrics:hour:${data.hour}`
    pipeline.hincrby(hourKey, 'requests', 1)
    pipeline.hincrby(hourKey, data.allowed ? 'allowed' : 'blocked', 1)
    pipeline.expire(hourKey, 86400) // 24시간 보관

    // 액션별 메트릭
    const actionKey = `metrics:action:${data.action}`
    pipeline.hincrby(actionKey, 'total', 1)
    pipeline.hincrby(actionKey, data.allowed ? 'allowed' : 'blocked', 1)
    pipeline.zadd(actionKey + ':users', 1, data.userId)

    // 사용자별 메트릭
    const userKey = `metrics:user:${data.userId}`
    pipeline.hincrby(userKey, 'total', 1)
    pipeline.hincrby(userKey, data.allowed ? 'allowed' : 'blocked', 1)
    pipeline.hset(userKey, 'last_activity', data.timestamp)

    // 응답 시간 기록
    if (data.processingTime) {
      pipeline.zadd(
        'metrics:response_times',
        data.timestamp,
        data.processingTime
      )
      pipeline.zremrangebyscore(
        'metrics:response_times',
        '-inf',
        (data.timestamp - this.METRICS_WINDOW).toString()
      )
    }

    // 패턴 감지 메트릭
    if (data.pattern) {
      pipeline.hincrby('metrics:patterns', data.pattern, 1)
    }

    await pipeline.exec()
  }

  /**
   * 메트릭 집계
   */
  static async aggregateMetrics(): Promise<void> {
    const now = Date.now()
    this.lastAggregation = now

    try {
      const redis = getRedis()
      if (!redis) return

      // Buffer 데이터를 Redis로 플러시
      for (const [key, value] of Array.from(this.metricsBuffer.entries())) {
        if (key.startsWith('action:')) {
          const action = key.replace('action:', '')
          await redis.hincrby(`metrics:action:${action}`, 'total', value)
        } else if (key.startsWith('user:')) {
          const userId = key.replace('user:', '')
          await redis.hincrby(`metrics:user:${userId}`, 'total', value)
        } else if (key.startsWith('pattern:')) {
          const pattern = key.replace('pattern:', '')
          await redis.hincrby('metrics:patterns', pattern, value)
        }
      }

      // Top Users 계산
      await this.calculateTopUsers(redis)

      // 시스템 상태 기록
      await this.recordSystemHealth(redis)

      // Buffer 초기화
      this.metricsBuffer.clear()
    } catch (error) {
      console.error('Failed to aggregate metrics:', error)
    }
  }

  /**
   * 전체 메트릭 조회
   */
  static async getMetrics(): Promise<RateLimitMetrics> {
    const redis = getRedis()
    if (!redis) {
      return this.getDefaultMetrics()
    }

    try {
      // 전역 메트릭
      const global = await redis.hgetall('metrics:global')

      // 현재 시간 메트릭
      const now = Date.now()
      const currentMinute = Math.floor(now / 60000) * 60000
      const currentHour = Math.floor(now / 3600000) * 3600000

      const minuteMetrics = await redis.hgetall(
        `metrics:minute:${currentMinute}`
      )
      const hourMetrics = await redis.hgetall(`metrics:hour:${currentHour}`)

      // 액션별 메트릭
      const actionMetrics = new Map<ActionCategory, number>()
      const blockedByAction = new Map<ActionCategory, number>()

      for (const action of Object.values(ActionCategory)) {
        const data = await redis.hgetall(`metrics:action:${action}`)
        if (data.total) {
          actionMetrics.set(action, parseInt(data.total))
          blockedByAction.set(action, parseInt(data.blocked || '0'))
        }
      }

      // 패턴 메트릭
      const patterns = await redis.hgetall('metrics:patterns')
      const patternsDetected = new Map<PatternType, number>()
      for (const [pattern, count] of Object.entries(patterns)) {
        patternsDetected.set(pattern as PatternType, parseInt(count as string))
      }

      // Top Users
      const topUsers = await this.getTopUsers(redis)

      // 응답 시간 메트릭
      const responseTimes = await redis.zrange(
        'metrics:response_times',
        0,
        -1,
        'WITHSCORES'
      )
      const times: number[] = []
      for (let i = 1; i < responseTimes.length; i += 2) {
        times.push(parseFloat(responseTimes[i]))
      }
      times.sort((a, b) => a - b)

      const p95Index = Math.floor(times.length * 0.95)
      const p99Index = Math.floor(times.length * 0.99)

      return {
        totalRequests: parseInt(global.total_requests || '0'),
        allowedRequests: parseInt(global.allowed || '0'),
        blockedRequests: parseInt(global.blocked || '0'),
        throttledRequests: parseInt(global.throttled || '0'),
        requestsPerMinute: parseInt(minuteMetrics.requests || '0'),
        requestsPerHour: parseInt(hourMetrics.requests || '0'),
        peakRequestTime: new Date(parseInt(global.peak_time || '0')),
        requestsByAction: actionMetrics,
        blockedByAction,
        patternsDetected,
        falsePositives: parseInt(global.false_positives || '0'),
        truePositives: parseInt(global.true_positives || '0'),
        uniqueUsers: await redis.scard('metrics:unique_users'),
        topUsers,
        averageResponseTime:
          times.length > 0
            ? times.reduce((a, b) => a + b, 0) / times.length
            : 0,
        p95ResponseTime: times[p95Index] || 0,
        p99ResponseTime: times[p99Index] || 0,
        redisLatency: await this.measureRedisLatency(redis),
        memoryUsage: process.memoryUsage().heapUsed,
        errorRate: parseFloat(global.error_rate || '0'),
      }
    } catch (error) {
      console.error('Failed to get metrics:', error)
      return this.getDefaultMetrics()
    }
  }

  /**
   * 사용자별 메트릭 조회
   */
  static async getUserMetrics(userId: string): Promise<UserMetrics> {
    const redis = getRedis()
    if (!redis) {
      return this.getDefaultUserMetrics(userId)
    }

    try {
      const userKey = `metrics:user:${userId}`
      const data = await redis.hgetall(userKey)

      // 액션 분포
      const distribution = new Map<ActionCategory, number>()
      for (const action of Object.values(ActionCategory)) {
        const count = await redis.zscore(
          `metrics:action:${action}:users`,
          userId
        )
        if (count) {
          distribution.set(action, parseInt(count))
        }
      }

      // Trust Score 조회
      const { TrustScorer } = await import('./trust-scorer')
      const trustData = await TrustScorer.calculateTrustScore(userId)

      return {
        userId,
        totalRequests: parseInt(data.total || '0'),
        allowedRequests: parseInt(data.allowed || '0'),
        blockedRequests: parseInt(data.blocked || '0'),
        trustScore: trustData.score,
        patterns: [], // PatternDetector에서 조회 필요
        lastActivity: new Date(parseInt(data.last_activity || '0')),
        requestDistribution: distribution,
      }
    } catch (error) {
      console.error('Failed to get user metrics:', error)
      return this.getDefaultUserMetrics(userId)
    }
  }

  /**
   * 액션별 메트릭 조회
   */
  static async getActionMetrics(
    action: ActionCategory
  ): Promise<ActionMetrics> {
    const redis = getRedis()
    if (!redis) {
      return this.getDefaultActionMetrics(action)
    }

    try {
      const actionKey = `metrics:action:${action}`
      const data = await redis.hgetall(actionKey)
      const users = await redis.zrange(`${actionKey}:users`, 0, -1)

      return {
        action,
        totalRequests: parseInt(data.total || '0'),
        allowedRequests: parseInt(data.allowed || '0'),
        blockedRequests: parseInt(data.blocked || '0'),
        averageProcessingTime: parseFloat(data.avg_time || '0'),
        peakTime: new Date(parseInt(data.peak_time || '0')),
        uniqueUsers: new Set(users),
      }
    } catch (error) {
      console.error('Failed to get action metrics:', error)
      return this.getDefaultActionMetrics(action)
    }
  }

  /**
   * 시스템 상태 메트릭
   */
  static async getSystemHealth(): Promise<SystemHealthMetrics> {
    const redis = getRedis()
    const memoryUsage = process.memoryUsage()

    return {
      timestamp: new Date(),
      redisConnected: !!redis,
      redisLatency: redis ? await this.measureRedisLatency(redis) : 0,
      memoryUsage: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss,
      },
      activeConnections: this.metricsBuffer.size,
      queueSize: 0, // 실제 구현 필요
      errorCount: this.metricsBuffer.get('error_count') || 0,
      errorRate: this.calculateErrorRate(),
    }
  }

  /**
   * Top Users 계산
   */
  private static async calculateTopUsers(redis: Redis): Promise<void> {
    try {
      // 모든 액션에서 top users 수집
      const allUsers = new Map<string, number>()

      for (const action of Object.values(ActionCategory)) {
        const users = await redis.zrevrange(
          `metrics:action:${action}:users`,
          0,
          this.MAX_TOP_USERS - 1,
          'WITHSCORES'
        )

        for (let i = 0; i < users.length; i += 2) {
          const userId = users[i]
          const count = parseInt(users[i + 1])
          allUsers.set(userId, (allUsers.get(userId) || 0) + count)
        }
      }

      // 상위 사용자 저장
      const sorted = Array.from(allUsers.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.MAX_TOP_USERS)

      for (const [userId, count] of sorted) {
        await redis.zadd('metrics:top_users', count, userId)
      }

      // 오래된 데이터 제거
      await redis.zremrangebyrank(
        'metrics:top_users',
        0,
        -this.MAX_TOP_USERS - 1
      )
    } catch (error) {
      console.error('Failed to calculate top users:', error)
    }
  }

  /**
   * Top Users 조회
   */
  private static async getTopUsers(
    redis: Redis
  ): Promise<Array<{ userId: string; requests: number }>> {
    try {
      const users = await redis.zrevrange(
        'metrics:top_users',
        0,
        this.MAX_TOP_USERS - 1,
        'WITHSCORES'
      )
      const result: Array<{ userId: string; requests: number }> = []

      for (let i = 0; i < users.length; i += 2) {
        result.push({
          userId: users[i],
          requests: parseInt(users[i + 1]),
        })
      }

      return result
    } catch (error) {
      console.error('Failed to get top users:', error)
      return []
    }
  }

  /**
   * Redis 레이턴시 측정
   */
  private static async measureRedisLatency(redis: Redis): Promise<number> {
    try {
      const start = Date.now()
      await redis.ping()
      return Date.now() - start
    } catch {
      return 0
    }
  }

  /**
   * 시스템 상태 기록
   */
  private static async recordSystemHealth(redis: Redis): Promise<void> {
    try {
      const health = await this.getSystemHealth()
      const key = `metrics:health:${Date.now()}`

      await redis.hset(key, {
        timestamp: health.timestamp.toISOString(),
        redis_connected: health.redisConnected,
        redis_latency: health.redisLatency,
        heap_used: health.memoryUsage.heapUsed,
        heap_total: health.memoryUsage.heapTotal,
        error_rate: health.errorRate,
      })

      await redis.expire(key, 3600) // 1시간 보관
    } catch (error) {
      console.error('Failed to record system health:', error)
    }
  }

  /**
   * Buffer 업데이트
   */
  private static updateBuffer(key: string, increment: number): void {
    const current = this.metricsBuffer.get(key) || 0
    this.metricsBuffer.set(key, current + increment)
  }

  /**
   * 에러율 계산
   */
  private static calculateErrorRate(): number {
    const total = this.metricsBuffer.get('total_requests') || 0
    const errors = this.metricsBuffer.get('error_count') || 0
    return total > 0 ? errors / total : 0
  }

  /**
   * 기본 메트릭
   */
  private static getDefaultMetrics(): RateLimitMetrics {
    return {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      throttledRequests: 0,
      requestsPerMinute: 0,
      requestsPerHour: 0,
      peakRequestTime: new Date(),
      requestsByAction: new Map(),
      blockedByAction: new Map(),
      patternsDetected: new Map(),
      falsePositives: 0,
      truePositives: 0,
      uniqueUsers: 0,
      topUsers: [],
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      redisLatency: 0,
      memoryUsage: 0,
      errorRate: 0,
    }
  }

  /**
   * 기본 사용자 메트릭
   */
  private static getDefaultUserMetrics(userId: string): UserMetrics {
    return {
      userId,
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      trustScore: 0,
      patterns: [],
      lastActivity: new Date(),
      requestDistribution: new Map(),
    }
  }

  /**
   * 기본 액션 메트릭
   */
  private static getDefaultActionMetrics(
    action: ActionCategory
  ): ActionMetrics {
    return {
      action,
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      averageProcessingTime: 0,
      peakTime: new Date(),
      uniqueUsers: new Set(),
    }
  }

  /**
   * 메트릭 리포트 생성
   */
  static async generateReport(): Promise<string> {
    const metrics = await this.getMetrics()
    const health = await this.getSystemHealth()

    return `
# Rate Limiting Metrics Report
Generated: ${new Date().toISOString()}

## Overview
- Total Requests: ${metrics.totalRequests}
- Allowed: ${metrics.allowedRequests} (${((metrics.allowedRequests / metrics.totalRequests) * 100).toFixed(2)}%)
- Blocked: ${metrics.blockedRequests} (${((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(2)}%)
- Unique Users: ${metrics.uniqueUsers}

## Performance
- Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
- P95 Response Time: ${metrics.p95ResponseTime.toFixed(2)}ms
- P99 Response Time: ${metrics.p99ResponseTime.toFixed(2)}ms
- Redis Latency: ${metrics.redisLatency}ms

## System Health
- Memory Usage: ${(health.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
- Error Rate: ${(metrics.errorRate * 100).toFixed(4)}%
- Redis Connected: ${health.redisConnected ? 'Yes' : 'No'}

## Top Users
${metrics.topUsers
  .slice(0, 5)
  .map((u) => `- ${u.userId}: ${u.requests} requests`)
  .join('\n')}

## Pattern Detection
${Array.from(metrics.patternsDetected.entries())
  .map(([pattern, count]) => `- ${pattern}: ${count} detections`)
  .join('\n')}
    `.trim()
  }
}
