'use client'

import { useEffect } from 'react'

interface AdUnitProps {
  slot: string
  format?: string
  responsive?: boolean
  style?: React.CSSProperties
}

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[]
  }
}

export function AdUnit({
  slot,
  format = 'auto',
  responsive = true,
  style = { display: 'block' },
}: AdUnitProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  // 개발 환경에서는 placeholder 표시
  if (process.env.NODE_ENV !== 'production') {
    return (
      <div
        style={{
          ...style,
          background: '#f0f0f0',
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
          color: '#666',
          fontSize: '14px',
        }}
      >
        광고 영역 (slot: {slot})
      </div>
    )
  }

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client="ca-pub-8287266902600032"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  )
}
