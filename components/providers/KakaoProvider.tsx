'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Kakao: any
  }
}

export function KakaoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Kakao SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      // 실제 앱 키로 교체 필요
      window.Kakao.init(
        process.env.NEXT_PUBLIC_KAKAO_APP_KEY || 'YOUR_KAKAO_APP_KEY'
      )
      console.log('Kakao SDK initialized:', window.Kakao.isInitialized())
    }
  }, [])

  return <>{children}</>
}
