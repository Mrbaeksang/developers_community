import { NextResponse } from 'next/server'

export async function GET() {
  // 보안을 위해 일부만 노출
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_URL: process.env.AUTH_URL,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasKakaoId: !!process.env.AUTH_KAKAO_ID,
    hasKakaoSecret: !!process.env.AUTH_KAKAO_SECRET,
    kakaoIdLength: process.env.AUTH_KAKAO_ID?.length || 0,
    kakaoSecretLength: process.env.AUTH_KAKAO_SECRET?.length || 0,
    kakaoIdPrefix: process.env.AUTH_KAKAO_ID?.substring(0, 5) || 'none',
    hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
    hasGoogleSecret: !!process.env.AUTH_GOOGLE_SECRET,
    hasGitHubId: !!process.env.AUTH_GITHUB_ID,
    hasGitHubSecret: !!process.env.AUTH_GITHUB_SECRET,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(envCheck)
}
