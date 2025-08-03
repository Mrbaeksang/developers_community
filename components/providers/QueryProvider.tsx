'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 데이터가 "신선한" 상태로 유지되는 시간 (5분)
            staleTime: 5 * 60 * 1000,
            // 캐시에 데이터가 유지되는 시간 (10분) - v5에서는 gcTime으로 변경
            gcTime: 10 * 60 * 1000,
            // 실패 시 재시도 횟수
            retry: 1,
            // 윈도우 포커스 시 자동 리페치 비활성화
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
