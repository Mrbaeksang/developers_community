'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useLayoutEffect,
} from 'react'

interface ViewportContextType {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
  isHydrated: boolean
}

// SSR과 CSR에서 동일한 초기값 사용 (hydration mismatch 방지)
const getInitialViewport = (): ViewportContextType => {
  // 항상 동일한 기본값 사용 (SSR과 초기 CSR이 일치하도록)
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768,
    isHydrated: false,
  }
}

const ViewportContext = createContext<ViewportContextType>(getInitialViewport())

// SSR 안전한 useLayoutEffect
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function ViewportProvider({ children }: { children: React.ReactNode }) {
  // 서버와 클라이언트 모두에서 동일한 초기값 사용
  const [viewport, setViewport] =
    useState<ViewportContextType>(getInitialViewport())

  // Safari 및 다른 브라우저에서 더 빠르게 실행되도록 useLayoutEffect 사용
  useIsomorphicLayoutEffect(() => {
    // 브라우저 환경 체크
    if (typeof window === 'undefined') return

    const handleResize = () => {
      // Safari에서 더 안정적인 값 획득
      const width = window.innerWidth || document.documentElement.clientWidth
      const height = window.innerHeight || document.documentElement.clientHeight

      setViewport({
        width,
        height,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
        isHydrated: true,
      })
    }

    // requestAnimationFrame으로 Safari에서 안정적인 초기화
    const rafId = requestAnimationFrame(() => {
      handleResize()
    })

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', handleResize, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <ViewportContext.Provider value={viewport}>
      {children}
    </ViewportContext.Provider>
  )
}

export const useViewport = () => useContext(ViewportContext)
