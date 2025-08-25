'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  Home,
  Sparkles,
  MessageCircle,
  HelpCircle,
  User,
  LogIn,
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activePattern?: RegExp
  requireAuth?: boolean
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // 네비게이션 아이템 정의
  const navItems: NavItem[] = [
    {
      name: '홈',
      href: '/',
      icon: Home,
      activePattern: /^\/$/,
    },
    {
      name: '메인',
      href: '/main/posts',
      icon: Sparkles,
      activePattern: /^\/main/,
    },
    {
      name: '자유',
      href: '/main/posts?category=free',
      icon: MessageCircle,
      activePattern: /\/main\/posts\?category=free/,
    },
    {
      name: 'Q&A',
      href: '/main/posts?category=qna',
      icon: HelpCircle,
      activePattern: /\/main\/posts\?category=qna/,
    },
    {
      name: session ? '내정보' : '로그인',
      href: session ? `/profile/${session.user.id}` : '/auth/signin',
      icon: session ? User : LogIn,
      activePattern: session ? /^\/(profile|dashboard|settings)/ : /^\/auth/,
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // 스크롤이 최상단이면 항상 표시
      if (currentScrollY === 0) {
        setIsVisible(true)
        setLastScrollY(currentScrollY)
        return
      }

      // 스크롤 방향 감지 (위로: 표시, 아래로: 숨김)
      if (currentScrollY < lastScrollY) {
        // 위로 스크롤
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // 아래로 스크롤 (100px 이상일 때만 숨김)
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)

      // 스크롤 멈춤 감지 - 1초 후 자동으로 표시
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
    }

    // 스크롤 이벤트 리스너 (passive 옵션으로 성능 최적화)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [lastScrollY])

  // 현재 경로가 활성화된 탭인지 확인
  const isActive = (item: NavItem) => {
    if (item.activePattern) {
      return item.activePattern.test(pathname)
    }
    return pathname === item.href
  }

  // PC에서는 렌더링하지 않음
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 lg:hidden',
        'bg-white border-t-4 border-black',
        'shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]',
        'transition-transform duration-300 ease-in-out',
        isVisible ? 'translate-y-0' : 'translate-y-full',
        // iOS 안전 영역 처리
        'pb-[env(safe-area-inset-bottom)]'
      )}
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-screen-sm mx-auto">
        {navItems.map((item) => {
          const isItemActive = isActive(item)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full',
                'transition-all duration-200 relative group',
                'min-w-0 max-w-[80px]' // 뷰포트 벗어남 방지
              )}
            >
              {/* 활성 상태 배경 */}
              {isItemActive && (
                <div className="absolute inset-0 bg-primary/10 border-t-4 border-primary" />
              )}

              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-1',
                  'transition-all duration-200',
                  isItemActive
                    ? 'scale-110 translate-y-[-2px]'
                    : 'group-active:scale-95'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isItemActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold transition-colors',
                    'whitespace-nowrap overflow-hidden text-ellipsis',
                    'max-w-[60px]', // 텍스트 최대 너비 제한
                    isItemActive
                      ? 'text-primary'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {item.name}
                </span>
              </div>

              {/* 활성 상태 인디케이터 */}
              {isItemActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
