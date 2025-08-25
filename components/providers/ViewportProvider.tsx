'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface ViewportContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
  isHydrated: boolean
}

const ViewportContext = createContext<ViewportContextType>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  width: 1024,
  height: 768,
  isHydrated: false,
})

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  // 서버 사이드에서도 안전한 기본값 설정
  const [viewport, setViewport] = useState<ViewportContextType>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768,
    isHydrated: false,
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setViewport({
        width,
        height,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
        isHydrated: true,
      })
    }

    // 초기 실행 (hydration 완료 표시)
    handleResize()

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ViewportContext.Provider value={viewport}>
      {children}
    </ViewportContext.Provider>
  )
}

export const useViewport = () => useContext(ViewportContext)
