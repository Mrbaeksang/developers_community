'use client'

import { useEffect } from 'react'

interface KakaoSDK {
  init: (appKey: string) => void
  isInitialized: () => boolean
  Share: {
    sendDefault: (settings: {
      objectType: string
      content: {
        title: string
        description: string
        imageUrl: string
        link: {
          mobileWebUrl: string
          webUrl: string
        }
      }
      buttons?: Array<{
        title: string
        link: {
          mobileWebUrl: string
          webUrl: string
        }
      }>
    }) => void
  }
}

declare global {
  interface Window {
    Kakao: KakaoSDK
  }
}

export function KakaoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Kakao SDK 초기화
    if (window.Kakao && !window.Kakao.isInitialized()) {
      // 실제 앱 키로 교체 필요
      window.Kakao.init(
        process.env['NEXT_PUBLIC_KAKAO_APP_KEY'] || 'YOUR_KAKAO_APP_KEY'
      )
    }
  }, [])

  return <>{children}</>
}
