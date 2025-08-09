'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Settings, Users, Bell, User, LogOut, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { signOut } from 'next-auth/react'

interface DashboardQuickLinksProps {
  userId: string
}

export function DashboardQuickLinks({ userId }: DashboardQuickLinksProps) {
  const quickLinks = [
    {
      category: '내 활동',
      links: [{ href: `/profile/${userId}`, label: '내 프로필', icon: User }],
    },
    {
      category: '커뮤니티',
      links: [
        { href: '/communities', label: '커뮤니티 둘러보기', icon: Users },
        { href: '/communities/new', label: '커뮤니티 만들기', icon: Users },
      ],
    },
    {
      category: '설정',
      links: [
        { href: '/settings/profile', label: '프로필 편집', icon: User },
        { href: '/settings/account', label: '계정 설정', icon: Settings },
        { href: '/settings/notifications', label: '알림 설정', icon: Bell },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {quickLinks.map((section, index) => (
        <Card
          key={index}
          className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{section.category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {section.links.map((link, linkIndex) => {
              const Icon = link.icon
              return (
                <Link
                  key={linkIndex}
                  href={link.href}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg',
                    'hover:bg-secondary transition-colors',
                    'group'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground',
                      'group-hover:translate-x-1 transition-transform'
                    )}
                  />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      ))}

      {/* 로그아웃 버튼 */}
      <Button
        onClick={() => signOut({ callbackUrl: '/' })}
        variant="outline"
        className={cn(
          'w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
          'transition-all'
        )}
      >
        <LogOut className="h-4 w-4 mr-2" />
        로그아웃
      </Button>
    </div>
  )
}
