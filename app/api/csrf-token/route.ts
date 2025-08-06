import { NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/auth/csrf'

// GET /api/csrf-token - CSRF 토큰 발급
export async function GET() {
  const token = await generateCSRFToken()

  const response = NextResponse.json({
    success: true,
    data: { token },
  })

  // 쿠키 설정
  response.cookies.set('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24시간
  })

  return response
}
