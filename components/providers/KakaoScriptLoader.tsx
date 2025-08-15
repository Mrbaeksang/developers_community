'use client'

import Script from 'next/script'

export function KakaoScriptLoader() {
  return (
    <Script
      src="https://developers.kakao.com/sdk/js/kakao.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.Kakao && !window.Kakao.isInitialized()) {
          const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY
          if (appKey) {
            try {
              window.Kakao.init(appKey)
            } catch (error) {
              console.error('Failed to initialize Kakao SDK:', error)
            }
          }
        }
      }}
    />
  )
}
