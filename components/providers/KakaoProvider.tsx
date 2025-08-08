'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Share?: {
        sendDefault: (settings: object) => void
      }
    }
  }
}

export function KakaoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        const appKey = process.env['NEXT_PUBLIC_KAKAO_APP_KEY']
        if (appKey) {
          try {
            window.Kakao.init(appKey)
          } catch (error) {
            console.error('Failed to initialize Kakao SDK:', error)
          }
        } else {
          console.error('Kakao App Key is not configured')
        }
      }
    }

    // SDK 로드 체크
    if (window.Kakao) {
      initKakao()
    } else {
      // SDK가 아직 로드되지 않았다면 잠시 기다린 후 재시도
      const checkInterval = setInterval(() => {
        if (window.Kakao) {
          clearInterval(checkInterval)
          initKakao()
        }
      }, 100)

      // 5초 후에도 로드되지 않으면 중단
      setTimeout(() => {
        clearInterval(checkInterval)
        if (!window.Kakao) {
          console.error('Failed to load Kakao SDK')
        }
      }, 5000)
    }
  }, [])

  return <>{children}</>
}
