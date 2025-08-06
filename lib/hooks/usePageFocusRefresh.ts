import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * 페이지 포커스 시 자동으로 데이터를 새로고침하는 훅
 * @param queryKey - 새로고침할 React Query 키
 * @param enabled - 훅 활성화 여부 (기본값: true)
 */
export function usePageFocusRefresh(
  queryKey: string | string[],
  enabled: boolean = true
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      // 페이지가 포커스를 받으면 데이터를 새로고침
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      })
    }

    // 페이지 포커스 이벤트 리스너 등록
    window.addEventListener('focus', handleFocus)

    // visibilitychange 이벤트도 처리 (모바일 브라우저 대응)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 클린업
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [queryClient, queryKey, enabled])
}
