import { ApiResponse } from './types'

/**
 * API URL 유틸리티
 * 개발/프로덕션 환경에 따라 올바른 API URL을 반환합니다.
 */

export function getApiUrl() {
  if (typeof window !== 'undefined') {
    return ''
  }

  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }

  return (
    process.env.NEXTAUTH_URL || 'https://developers-community-two.vercel.app'
  )
}

/**
 * API 클라이언트 함수
 * 새로운 응답 형식(성공: { success: true, data, message }, 실패: { success: false, error, message })을 처리합니다.
 */
export async function apiClient<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const baseUrl = getApiUrl()
    const fullUrl = `${baseUrl}${url}`
    const response = await fetch(fullUrl, options)

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'API 요청 중 오류가 발생했습니다.',
        message: errorData.message || '서버에서 오류 응답을 반환했습니다',
      }
    }

    const data = await response.json()
    return { success: true, ...data }
  } catch (error) {
    console.error('API 호출 오류:', error)
    return {
      success: false,
      error: '네트워크 오류',
      message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요',
    }
  }
}
