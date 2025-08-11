/**
 * Unified Security Middleware
 * 통합 보안 미들웨어 - Rate Limiting과 CSRF를 하나로
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyCSRFToken, csrfErrorResponse } from '@/lib/auth/csrf'
import { AbuseTracker, AbuseType } from './abuse-tracker'
import { PatternDetector } from './pattern-detector'
import { ActionCategory, getActionFromPath } from './actions'

export interface SecurityOptions {
  // Rate Limiting 옵션
  action?: ActionCategory
  skipAuth?: boolean
  skipTrustScore?: boolean
  maxRequests?: number
  windowMs?: number
  bypassForAdmin?: boolean // ADMIN 역할 Rate Limiting 우회

  // CSRF 옵션
  requireCSRF?: boolean
  skipCSRF?: boolean

  // 고급 옵션
  enablePatternDetection?: boolean
  enableAbuseTracking?: boolean
  customKeyGenerator?: (req: NextRequest) => string
}

export interface RouteContext {
  params: Promise<Record<string, string | string[]>>
}

/**
 * 통합 보안 미들웨어 - 타입 안전성과 호환성 보장
 */
export function withSecurity<T extends RouteContext = RouteContext>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  return async (req: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // 1. CSRF 검증 (POST, PUT, DELETE 등에만 적용)
      const method = req.method.toUpperCase()
      const needsCSRF = !['GET', 'HEAD', 'OPTIONS'].includes(method)

      if (needsCSRF && !options.skipCSRF && options.requireCSRF !== false) {
        const csrfValid = await verifyCSRFToken(req)
        if (!csrfValid) {
          console.error('CSRF validation failed for:', req.url)
          return csrfErrorResponse()
        }
      }

      // 2. Rate Limiting 검증
      const action =
        options.action ||
        getActionFromPath(req.method, req.nextUrl.pathname) ||
        ActionCategory.POST_READ

      // Rate limit 헤더 확인 (Edge Runtime에서 처리된 경우)
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

      // 3. 패턴 감지 (옵션)
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

      // 4. 핸들러 실행
      const response = await handler(req, context)

      // 5. 성공 로깅 (옵션)
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
      console.error('Security middleware error:', error)

      // 에러 발생 시에도 요청은 통과시킴 (fail open)
      return handler(req, context)
    }
  }
}

/**
 * Rate Limiting 전용 래퍼 (하위 호환성)
 */
export function withRateLimiting<T extends RouteContext = RouteContext>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>,
  options: Omit<SecurityOptions, 'requireCSRF' | 'skipCSRF'> = {}
) {
  return withSecurity(handler, {
    ...options,
    skipCSRF: true, // Rate limiting만 적용
  })
}

/**
 * CSRF 전용 래퍼 (하위 호환성)
 */
export function withCSRFProtection<T extends RouteContext = RouteContext>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
) {
  return withSecurity(handler, {
    requireCSRF: true,
    skipAuth: true, // CSRF만 적용
  })
}

/**
 * 사용자 ID 추출 헬퍼
 */
async function getUserId(req: NextRequest): Promise<string | null> {
  // 1. Authorization 헤더
  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    return `auth:${simpleHash(authHeader)}`
  }

  // 2. 세션 쿠키
  const sessionCookie =
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token')
  if (sessionCookie) {
    return `session:${simpleHash(sessionCookie.value)}`
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
function getClientIp(req: NextRequest): string {
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
