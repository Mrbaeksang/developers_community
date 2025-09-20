'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

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

const ADSENSE_CLIENT_ID = 'ca-pub-8287266902600032'
const ADSENSE_SCRIPT_ID = 'nextjs-adsense-loader'

// Google AdSense 컴포넌트 - 초기 하이드레이션 단계에서 DOM 변형을 막기 위해 클라이언트 마운트 이후에만 스크립트 로드
export function GoogleAdsense({
  adSlot,
  adFormat = 'auto',
  style,
  className,
  nonce,
}: GoogleAdsenseProps = {}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !adSlot) return

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense push error:', err)
    }
  }, [mounted, adSlot])

  if (process.env.NODE_ENV === 'development') {
    return null
  }

  // SSR 단계에서는 아무것도 렌더링하지 않아 하이드레이션 불일치를 방지
  if (!mounted) {
    return null
  }

  const scriptSrc = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`

  // 자동 광고: 스크립트만 로드
  if (!adSlot) {
    return (
      <Script
        id={ADSENSE_SCRIPT_ID}
        src={scriptSrc}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        nonce={nonce}
      />
    )
  }

  // 디스플레이 광고: 스크립트 로드 후 광고 영역 렌더링
  return (
    <>
      <Script
        id={ADSENSE_SCRIPT_ID}
        src={scriptSrc}
        strategy="afterInteractive"
        crossOrigin="anonymous"
        nonce={nonce}
      />
      <ins
        className={`adsbygoogle ${className || ''}`}
        style={style || { display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </>
  )
}
