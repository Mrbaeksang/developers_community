import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { generateCSRFToken } from '@/lib/auth/csrf'
import {
  initRateLimitMiddleware,
  createRateLimitRule,
  ActionCategory,
} from '@/lib/security/middleware'

// 추적하지 않을 경로
const excludedPaths = [
  '/_next',
  '/favicon.ico',
  '/.well-known',
  '/robots.txt',
  '/sitemap.xml',
]

// 정적 파일 확장자
const staticExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
]

// Rate Limiting 미들웨어 초기화
const rateLimiter = initRateLimitMiddleware({
  enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  bypassPaths: [
    ...excludedPaths,
    '/api/track',
    '/api/activities',
    '/api/visitors',
    '/api/notifications/read-all', // 알림 읽음 처리 제외
  ], // 모니터링 API 제외
  trustScoreBonus: true,
  enablePatternDetection: true,
  enableAbuseTracking: true,
  // 커스텀 룰 설정
  customRules: new Map([
    // 인증 관련 엄격한 제한
    [ActionCategory.AUTH_LOGIN, createRateLimitRule(60000, 5)], // 1분에 5회
    [ActionCategory.AUTH_REGISTER, createRateLimitRule(3600000, 3)], // 1시간에 3회
    [ActionCategory.AUTH_RESET_PASSWORD, createRateLimitRule(3600000, 3)], // 1시간에 3회

    // 좋아요/북마크 제한
    [ActionCategory.POST_LIKE, createRateLimitRule(60000, 30)], // 1분에 30회
    [ActionCategory.POST_BOOKMARK, createRateLimitRule(60000, 20)], // 1분에 20회

    // 콘텐츠 생성 제한 - 프로덕션 기준 안전한 설정
    [ActionCategory.POST_CREATE, createRateLimitRule(3600000, 5)], // 1시간에 5개 (스팸 방지)
    [ActionCategory.COMMENT_CREATE, createRateLimitRule(60000, 30)], // 1분에 30개

    // 파일 업로드 제한 - 프로덕션 기준 안전한 설정
    [ActionCategory.FILE_UPLOAD, createRateLimitRule(3600000, 10)], // 1시간에 10개 (리소스 보호)

    // 채팅 타이핑 인디케이터 - 실시간 채팅 지원
    [ActionCategory.CHAT_TYPING, createRateLimitRule(60000, 100)], // 1분에 100회
    [ActionCategory.CHAT_MESSAGE_SEND, createRateLimitRule(60000, 60)], // 1분에 60개 (초당 1개)
  ]),
})

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')

  // 모바일 브라우저 감지
  const userAgent = request.headers.get('user-agent') || ''
  const isMobile = /Mobile|Android|iPhone|iPad|Samsung/i.test(userAgent)

  // 제외 경로 체크 (API 경로는 제외하지 않음)
  if (
    !isApiRoute &&
    (excludedPaths.some((path) => pathname.startsWith(path)) ||
      staticExtensions.some((ext) => pathname.endsWith(ext)))
  ) {
    return NextResponse.next()
  }

  // API 경로에 대한 Rate Limiting 체크
  if (isApiRoute) {
    const rateLimitResult = await rateLimiter.handle(request)
    if (rateLimitResult) {
      // Rate limit 초과 시 응답 반환
      return rateLimitResult
    }
  }

  // 방문자 세션 ID 생성 또는 가져오기
  const response = NextResponse.next()
  const sessionId = request.cookies.get('visitor_session')?.value || nanoid()

  // 모바일 브라우저인 경우 CSR 모드 설정
  if (isMobile && !isApiRoute) {
    response.headers.set('x-render-mode', 'csr')
  }

  // CSP nonce 생성 (Google AdSense용)
  const nonce = nanoid(16)
  response.headers.set('x-nonce', nonce)

  // CSP 헤더 설정 - Google AdSense 가이드라인 준수
  const cspHeader = `
    object-src 'none';
    script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:;
    base-uri 'none';
    frame-ancestors 'none';
    ${process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests;' : ''}
  `
    .replace(/\s{2,}/g, ' ')
    .trim()

  response.headers.set('Content-Security-Policy', cspHeader)

  // 기타 보안 헤더
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // 프로덕션 환경에서만 HSTS 적용
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  // 새 세션인 경우 쿠키 설정
  if (!request.cookies.get('visitor_session')) {
    response.cookies.set('visitor_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24시간
    })
  }

  // CSRF 토큰 설정 (없는 경우에만)
  if (!request.cookies.get('csrf-token')) {
    const csrfToken = await generateCSRFToken()
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24시간
    })
  }

  // Redis를 사용한 방문자 추적은 API 라우트에서 처리
  // (미들웨어에서 직접 Redis 접근은 Edge Runtime 제약으로 불가)

  // 방문자 정보를 헤더에 추가하여 API에서 활용
  response.headers.set('x-visitor-session', sessionId)
  response.headers.set('x-visitor-path', pathname)

  // CSP nonce 정보 전달 (SSR에서 사용)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are now included for monitoring
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
