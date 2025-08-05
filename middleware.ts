import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { generateCSRFToken } from '@/lib/csrf'

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

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')

  // 제외 경로 체크 (API 경로는 제외하지 않음)
  if (
    !isApiRoute &&
    (excludedPaths.some((path) => pathname.startsWith(path)) ||
      staticExtensions.some((ext) => pathname.endsWith(ext)))
  ) {
    return NextResponse.next()
  }

  // 방문자 세션 ID 생성 또는 가져오기
  const response = NextResponse.next()
  const sessionId = request.cookies.get('visitor_session')?.value || nanoid()

  // CSP 헤더 설정
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://dapi.kakao.com https://developers.kakao.com https://t1.daumcdn.net https://t1.kakaocdn.net https://cdn.jsdelivr.net https://va.vercel-scripts.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net;
    font-src 'self' https://fonts.gstatic.com data:;
    img-src 'self' data: blob: https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://source.unsplash.com https://images.unsplash.com https://picsum.photos https://k.kakaocdn.net https://ssl.gstatic.com https://www.gstatic.com;
    connect-src 'self' https://accounts.google.com https://kauth.kakao.com https://kapi.kakao.com https://vitals.vercel-insights.com https://www.google-analytics.com https://analytics.google.com https://va.vercel-scripts.com;
    frame-src 'self' https://accounts.google.com https://kauth.kakao.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim()

  // 보안 헤더 설정
  response.headers.set('Content-Security-Policy', cspHeader)
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
