'use client'

import { useEffect } from 'react'

interface GoogleAdsenseProps {
  adSlot?: string
  adFormat?: string
  style?: React.CSSProperties
  className?: string
  nonce?: string
}

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>
  }
}

// Google AdSense 커포넌트 - CSP nonce 지원
export function GoogleAdsense({
  adSlot,
  adFormat = 'auto',
  style,
  className,
  nonce,
}: GoogleAdsenseProps = {}) {
  const adClient = 'ca-pub-8287266902600032' // 고정값

  useEffect(() => {
    // 디스플레이 광고일 경우만 push
    if (typeof window !== 'undefined' && adSlot) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (err) {
        console.error('AdSense push error:', err)
      }
    }
  }, [adSlot])

  // 개발 환경에서는 아무것도 렌더링하지 않음
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  // 자동 광고 (헤드에 스크립트만 삽입)
  if (!adSlot) {
    return (
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
        nonce={nonce}
      />
    )
  }

  // 디스플레이 광고
  return (
    <>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
        crossOrigin="anonymous"
        nonce={nonce}
      />
      <ins
        className={`adsbygoogle ${className || ''}`}
        style={style || { display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
      {/* nonce를 사용한 인라인 스크립트 */}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `(adsbygoogle = window.adsbygoogle || []).push({});`,
        }}
      />
    </>
  )
}
