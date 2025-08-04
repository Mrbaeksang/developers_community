// rate-limiter-flexible에서 필요한 것만 import (Drizzle 관련 제외)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible')
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { redis } from '@/lib/redis'

// Rate Limiter 타입 정의
type RateLimiterInstance =
  | InstanceType<typeof RateLimiterRedis>
  | InstanceType<typeof RateLimiterMemory>

type RateLimiters = {
  general: RateLimiterInstance
  auth: RateLimiterInstance
  post: RateLimiterInstance
  comment: RateLimiterInstance
  upload: RateLimiterInstance
  api: RateLimiterInstance
}

// Rate Limiter를 지연 초기화로 변경
let rateLimitersInstance: RateLimiters | null = null

function getRateLimiters() {
  if (rateLimitersInstance) {
    return rateLimitersInstance
  }

  // Redis 클라이언트 가져오기
  const redisClient = redis()

  // Redis가 없으면 메모리 기반 rate limiter 사용
  if (!redisClient) {
    console.warn('Using memory-based rate limiter as Redis is not available')
    rateLimitersInstance = {
      general: new RateLimiterMemory({
        keyPrefix: 'rl_general',
        points: 60,
        duration: 60,
        blockDuration: 60,
      }),
      auth: new RateLimiterMemory({
        keyPrefix: 'rl_auth',
        points: 5,
        duration: 60,
        blockDuration: 300,
      }),
      post: new RateLimiterMemory({
        keyPrefix: 'rl_post',
        points: 10,
        duration: 60,
        blockDuration: 120,
      }),
      comment: new RateLimiterMemory({
        keyPrefix: 'rl_comment',
        points: 30,
        duration: 60,
        blockDuration: 60,
      }),
      upload: new RateLimiterMemory({
        keyPrefix: 'rl_upload',
        points: 5,
        duration: 60,
        blockDuration: 300,
      }),
      api: new RateLimiterMemory({
        keyPrefix: 'rl_api',
        points: 1000,
        duration: 60,
        blockDuration: 60,
      }),
    }
    return rateLimitersInstance
  }

  // Rate Limiter 설정
  rateLimitersInstance = {
    // IP 기반 일반 요청 제한
    general: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_general',
      points: 60, // 요청 수
      duration: 60, // 초 (1분)
      blockDuration: 60, // 차단 시간 (초)
    }),

    // 로그인/회원가입 제한
    auth: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_auth',
      points: 5,
      duration: 60,
      blockDuration: 300, // 5분 차단
    }),

    // 게시글 작성 제한
    post: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_post',
      points: 10,
      duration: 60,
      blockDuration: 120,
    }),

    // 댓글 작성 제한
    comment: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_comment',
      points: 30,
      duration: 60,
      blockDuration: 60,
    }),

    // 파일 업로드 제한
    upload: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_upload',
      points: 5,
      duration: 60,
      blockDuration: 300,
    }),

    // API 키 기반 제한 (높은 한도)
    api: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl_api',
      points: 1000,
      duration: 60,
      blockDuration: 60,
    }),
  }

  return rateLimitersInstance
}

// Rate Limiter export를 getter로 변경
export const rateLimiters = getRateLimiters

// IP 주소 추출 헬퍼
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  return '127.0.0.1'
}

// Rate Limit 체크 함수
export async function checkRateLimit(
  req: NextRequest,
  limiterType:
    | 'general'
    | 'auth'
    | 'post'
    | 'comment'
    | 'upload'
    | 'api' = 'general'
): Promise<{
  success: boolean
  limit?: number
  remaining?: number
  reset?: Date
}> {
  try {
    const limiters = rateLimiters()
    const limiter = limiters[limiterType]
    const ip = getClientIp(req)

    // 사용자 ID 가져오기 (로그인한 경우)
    const session = await auth()
    const key = session?.user?.id || ip

    const result = await limiter.consume(key)

    return {
      success: true,
      limit: limiter.points,
      remaining: result.remainingPoints,
      reset: new Date(Date.now() + result.msBeforeNext),
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'remainingPoints' in error) {
      const rateLimitError = error as unknown as {
        points: number
        remainingPoints: number
        msBeforeNext: number
      }
      // Rate limit 초과
      return {
        success: false,
        limit: rateLimitError.points,
        remaining: rateLimitError.remainingPoints,
        reset: new Date(Date.now() + rateLimitError.msBeforeNext),
      }
    }

    // Redis 연결 실패 시 메모리 기반 fallback
    console.error('Rate limiter error:', error)
    return { success: true } // Fail open
  }
}

// Rate Limit 응답 헬퍼
export function rateLimitResponse(
  limit: number,
  remaining: number,
  reset: Date
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toISOString(),
        'Retry-After': Math.ceil(
          (reset.getTime() - Date.now()) / 1000
        ).toString(),
      },
    }
  )
}

// Next.js Route Handler 타입
type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context: TContext
) => Promise<Response> | Response

// Next.js Route Handler용 미들웨어
export function withRateLimit<TContext = unknown>(
  handler: RouteHandler<TContext>,
  limiterType: keyof RateLimiters = 'general'
): RouteHandler<TContext> {
  return async function (req: NextRequest, context: TContext) {
    const result = await checkRateLimit(req, limiterType)

    if (!result.success) {
      if (result.limit && result.remaining !== undefined && result.reset) {
        return rateLimitResponse(result.limit, result.remaining, result.reset)
      }
      // Fallback response if rate limit info is missing
      return NextResponse.json(
        { success: false, error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Rate limit 정보를 응답 헤더에 추가
    const response = await handler(req, context)

    if (
      response instanceof Response &&
      result.limit &&
      result.remaining !== undefined &&
      result.reset
    ) {
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.reset.toISOString())
    }

    return response
  }
}
