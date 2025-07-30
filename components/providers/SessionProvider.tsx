'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

interface SessionProviderProps {
  children: React.ReactNode
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 확인
      refetchOnWindowFocus={false} // 윈도우 포커스 시 세션 확인 비활성화
    >
      {children}
    </NextAuthSessionProvider>
  )
}
