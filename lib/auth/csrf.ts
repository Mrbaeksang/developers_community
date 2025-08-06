import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// CSRF 토큰 쿠키 이름
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

// CSRF 토큰 생성 (Edge Runtime 호환)
export async function generateCSRFToken(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  )
}

// CSRF 토큰 쿠키 설정
export async function setCSRFCookie(response: NextResponse): Promise<void> {
  const token = await generateCSRFToken()

  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24시간
  })
}

// CSRF 토큰 가져오기 (서버 컴포넌트용)
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null
}

// CSRF 토큰 검증
export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  // GET, HEAD, OPTIONS 요청은 CSRF 검증 제외
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  // 쿠키에서 토큰 가져오기
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  if (!cookieToken) {
    return false
  }

  // 헤더에서 토큰 가져오기
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // 바디에서 토큰 가져오기 (폼 데이터의 경우)
  let bodyToken: string | null = null

  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.clone().json()
      bodyToken = body._csrf
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.clone().formData()
      bodyToken = formData.get('_csrf') as string | null
    }
  } catch {
    // 바디 파싱 실패는 무시
  }

  // 헤더 또는 바디의 토큰이 쿠키 토큰과 일치하는지 확인
  const submittedToken = headerToken || bodyToken

  if (!submittedToken) {
    return false
  }

  // 일정 시간 비교 (timing attack 방지)
  return timingSafeEqual(cookieToken, submittedToken)
}

// Timing-safe 문자열 비교 (Edge Runtime 호환)
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// CSRF 에러 응답
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'CSRF token validation failed',
      message:
        'CSRF 토큰이 유효하지 않습니다. 페이지를 새로고침하고 다시 시도해주세요.',
    },
    { status: 403 }
  )
}

// Route Handler용 CSRF 미들웨어
type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context: TContext
) => Promise<Response> | Response

export function withCSRFProtection<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async function (req: NextRequest, context: TContext) {
    const isValid = await verifyCSRFToken(req)

    if (!isValid) {
      return csrfErrorResponse()
    }

    return handler(req, context)
  }
}
