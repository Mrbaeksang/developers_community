'use client'

import Script from 'next/script'

export function GoogleAdsense() {
  // 개발 환경에서는 광고 스크립트 로드하지 않음
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <Script
      id="google-adsense"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8287266902600032"
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  )
}
