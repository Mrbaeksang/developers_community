'use client'

import { useEffect } from 'react'

export function MobileLayoutFix() {
  useEffect(() => {
    // CSS 변수로 뷰포트 크기 설정
    const updateViewport = () => {
      const vw = window.innerWidth * 0.01
      const vh = window.innerHeight * 0.01

      document.documentElement.style.setProperty('--vw', `${vw}px`)
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      document.documentElement.style.setProperty(
        '--viewport-width',
        `${window.innerWidth}px`
      )
    }

    // 초기 실행
    updateViewport()

    // 모바일 뷰포트 메타 태그 동적 업데이트
    const metaViewport = document.querySelector('meta[name=viewport]')
    if (metaViewport) {
      metaViewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
      )
    }

    // 리사이즈 시 업데이트
    window.addEventListener('resize', updateViewport)
    window.addEventListener('orientationchange', updateViewport)

    // 하이드레이션 완료 후 레이아웃 강제 재계산
    requestAnimationFrame(() => {
      // 하이드레이션 완료 표시 제거
      document.body.removeAttribute('data-hydrating')

      // 레이아웃 재계산 강제
      document.body.style.display = 'none'
      // Force reflow
      void document.body.offsetHeight
      document.body.style.display = ''
    })

    return () => {
      window.removeEventListener('resize', updateViewport)
      window.removeEventListener('orientationchange', updateViewport)
    }
  }, [])

  return null
}
