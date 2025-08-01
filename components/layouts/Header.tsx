'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Home,
  Search,
  Menu,
  LogOut,
  Settings,
  Users,
  User,
  CheckCircle,
  Shield,
  PenSquare,
  Sparkles,
  Zap,
  Code2,
  MessageCircle,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import { SearchModal } from '@/components/search/SearchModal'
import NotificationDropdown from '@/components/notifications/NotificationDropdown'

export function Header() {
  const { data: session, status } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const navigation = [
    { name: '홈', href: '/', icon: Home },
    { name: '메인 게시글', href: '/main/posts', icon: Sparkles },
    {
      name: '자유게시판',
      href: '/main/posts?category=free',
      icon: MessageCircle,
    },
    {
      name: 'Q&A 게시판',
      href: '/main/posts?category=qna',
      icon: HelpCircle,
    },
    { name: '커뮤니티', href: '/communities', icon: Users },
  ]

  // 관리자 전용 네비게이션 메뉴
  const adminNavigation = [{ name: '관리자', href: '/admin', icon: Shield }]

  // 관리자 여부 확인
  const isAdmin =
    session?.user &&
    (session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER')

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white text-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-2 mr-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group"
        >
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <Code2 className="h-6 w-6" />
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="font-black text-xl text-black leading-tight">
              Dev
            </span>
            <span className="font-bold text-xs text-muted-foreground -mt-1">
              Community
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-3 text-sm font-bold">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="relative group">
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-white">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-black">{item.name}</span>
              </div>
            </Link>
          ))}
          {/* 관리자 전용 네비게이션 */}
          {isAdmin
            ? adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="relative group"
                >
                  <div className="relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-white">
                    <item.icon className="h-4 w-4 text-destructive" />
                    <span className="text-black">{item.name}</span>
                  </div>
                </Link>
              ))
            : null}
        </nav>

        {/* Search */}
        <div className="w-80 mx-4">
          <Button
            variant="outline"
            className="w-full justify-start font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] bg-white"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">검색하기...</span>
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border-2 border-black bg-muted px-1.5 font-mono text-[10px] font-bold text-muted-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
          ) : session ? (
            <>
              {/* Write button */}
              <Button asChild className="hidden sm:flex">
                <Link href="/main/write" className="font-bold">
                  <PenSquare className="h-4 w-4 mr-2" />새 글 작성
                </Link>
              </Button>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:scale-105 transition-transform"
                  >
                    <Avatar className="h-10 w-10 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                      <AvatarImage
                        src={session.user?.image || ''}
                        alt={session.user?.name || ''}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-bold">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none">
                        {session.user?.name}
                      </p>
                      <p className="text-xs font-medium leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${session.user.id}`}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />내 프로필
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      대시보드
                    </Link>
                  </DropdownMenuItem>
                  {/* 관리자 메뉴 */}
                  {session.user?.role === 'ADMIN' ||
                  session.user?.role === 'MANAGER' ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/pending" className="cursor-pointer">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          게시글 승인
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          관리자 페이지
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() =>
                signIn(undefined, { callbackUrl: window.location.pathname })
              }
              className="font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Zap className="mr-2 h-4 w-4" />
              로그인
            </Button>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-4 border-black bg-white">
          <nav className="container py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all duration-200 border-2 border-transparent hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-white">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-black">{item.name}</span>
                </div>
              </Link>
            ))}
            {/* 관리자 전용 모바일 네비게이션 */}
            {isAdmin
              ? adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="relative group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all duration-200 border-2 border-transparent hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-white">
                      <item.icon className="h-4 w-4 text-destructive" />
                      <span className="text-black">{item.name}</span>
                    </div>
                  </Link>
                ))
              : null}
            {session && (
              <Link
                href="/main/write"
                className="relative group"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg font-bold transition-all duration-200 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] bg-primary text-primary-foreground">
                  <PenSquare className="h-4 w-4" />
                  <span>새 글 작성</span>
                </div>
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  )
}
