/**
 * API URL 유틸리티
 * 개발/프로덕션 환경에 따라 올바른 API URL을 반환합니다.
 */

export function getApiUrl() {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 상대 경로 사용
    return ''
  }

  // 서버 사이드에서는 환경에 따라 절대 경로 사용
  if (process.env.NODE_ENV === 'development') {
    // 개발 환경에서는 포트 확인
    // Next.js는 포트가 사용 중이면 자동으로 다른 포트를 사용하므로
    // 개발 환경에서는 고정 포트 대신 환경 변수 사용
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }

  // 프로덕션 환경
  return (
    process.env.NEXTAUTH_URL || 'https://developers-community-two.vercel.app'
  )
}
