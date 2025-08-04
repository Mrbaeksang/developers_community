import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { generateCSRFToken } from '@/lib/csrf'

// 추적하지 않을 경로
const excludedPaths = [
  '/_next',
  '/api',
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

  // 제외 경로 체크
  if (
    excludedPaths.some((path) => pathname.startsWith(path)) ||
    staticExtensions.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next()
  }

  // 방문자 세션 ID 생성 또는 가져오기
  const response = NextResponse.next()
  const sessionId = request.cookies.get('visitor_session')?.value || nanoid()

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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
