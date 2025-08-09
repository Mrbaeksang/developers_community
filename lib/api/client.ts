import { ApiResponse } from './response'

/**
 * API URL 유틸리티
 * 개발/프로덕션 환경에 따라 올바른 API URL을 반환합니다.
 */

export function getApiUrl() {
  if (typeof window !== 'undefined') {
    return ''
  }

  if (process.env.NODE_ENV === 'development') {
    return process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'
  }

  return (
    process.env['NEXTAUTH_URL'] || 'https://developers-community-two.vercel.app'
  )
}

/**
 * CSRF 토큰 가져오기 (클라이언트 사이드)
 */
function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null

  // 쿠키에서 CSRF 토큰 가져오기
  const cookies = document.cookie.split(';')

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrf-token') {
      return value
    }
  }

  return null
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

    // CSRF 토큰 처리
    const method = options.method?.toUpperCase() || 'GET'
    const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)

    if (needsCSRF) {
      let csrfToken = getCSRFToken()

      // CSRF 토큰이 없으면 서버에서 가져오기
      if (!csrfToken) {
        try {
          const tokenResponse = await fetch('/api/csrf-token')
          if (tokenResponse.ok) {
            const data = await tokenResponse.json()
            csrfToken = data.data?.token
          }
        } catch (error) {
          console.error('Failed to fetch CSRF token:', error)
        }
      }

      if (csrfToken) {
        // 헤더에 CSRF 토큰 추가
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': csrfToken,
        }

        // JSON 바디의 경우 _csrf 필드 추가
        if (options.body && typeof options.body === 'string') {
          try {
            const bodyData = JSON.parse(options.body)
            bodyData._csrf = csrfToken
            options.body = JSON.stringify(bodyData)
          } catch {
            // JSON이 아닌 경우 무시
          }
        }
      }
    }

    const response = await fetch(fullUrl, options)

    if (!response.ok) {
      // Content-Type 확인
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json()
          return {
            success: false,
            error: errorData.error || 'API 요청 중 오류가 발생했습니다.',
            message: errorData.message || '서버에서 오류 응답을 반환했습니다',
          }
        } catch {
          // JSON 파싱 실패
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
            message: '서버 오류가 발생했습니다',
          }
        }
      } else {
        // JSON이 아닌 응답 (예: HTML, 텍스트)
        const text = await response.text()
        return {
          success: false,
          error: `HTTP ${response.status}: ${text.substring(0, 100)}`,
          message: '서버 오류가 발생했습니다',
        }
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
