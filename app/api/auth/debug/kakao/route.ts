import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    // 환경 변수 체크
    env: {
      hasClientId: !!process.env.AUTH_KAKAO_ID,
      hasClientSecret: !!process.env.AUTH_KAKAO_SECRET,
      clientIdLength: process.env.AUTH_KAKAO_ID?.length || 0,
      clientSecretLength: process.env.AUTH_KAKAO_SECRET?.length || 0,
      authUrl: process.env.AUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    },

    // 카카오 OAuth URLs
    urls: {
      authorization: 'https://kauth.kakao.com/oauth/authorize',
      token: 'https://kauth.kakao.com/oauth/token',
      userinfo: 'https://kapi.kakao.com/v2/user/me',
      callback: `${process.env.AUTH_URL || 'https://devcom.kr'}/api/auth/callback/kakao`,
    },

    // 카카오 앱 설정 체크리스트
    checklist: {
      '1_카카오_개발자_콘솔': 'https://developers.kakao.com/console/app',
      '2_Redirect_URI_등록': 'https://devcom.kr/api/auth/callback/kakao',
      '3_활성화_상태': 'ON',
      '4_Client_Secret_발급': '보안 탭에서 생성 필요',
      '5_동의항목': '이메일은 선택사항으로 설정',
    },

    // 테스트 토큰 생성 (실제 OAuth flow 시뮬레이션)
    testAuth: {
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        grant_type: 'authorization_code',
        client_id: process.env.AUTH_KAKAO_ID ? '설정됨' : '미설정',
        client_secret: process.env.AUTH_KAKAO_SECRET ? '설정됨' : '미설정',
        redirect_uri: 'https://devcom.kr/api/auth/callback/kakao',
        code: '테스트용_더미_코드',
      },
      authorizationUrl: '',
      status: '',
      error: '',
    },

    timestamp: new Date().toISOString(),
  }

  // 실제 카카오 API 연결 테스트 (선택적)
  if (process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET) {
    try {
      // 카카오 앱 정보 조회 (토큰 없이 가능한 테스트)
      const testUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.AUTH_KAKAO_ID}&redirect_uri=${encodeURIComponent('https://devcom.kr/api/auth/callback/kakao')}&response_type=code`

      config.testAuth.authorizationUrl = testUrl
      config.testAuth.status = 'Ready for OAuth flow'
    } catch (error) {
      config.testAuth.error =
        error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return NextResponse.json(config, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
