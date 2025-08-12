'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/core/utils'

interface DashboardHeaderProps {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    bio: string | null
    createdAt: Date
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '좋은 아침이에요'
    if (hour < 18) return '좋은 오후에요'
    return '좋은 저녁이에요'
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 아바타 */}
        <Avatar className="h-24 w-24 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <AvatarImage
            src={user.image || undefined}
            alt={user.name || 'User'}
          />
          <AvatarFallback className="bg-primary/20 text-2xl font-black">
            {user.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* 사용자 정보 */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-muted-foreground">{getGreeting()},</p>
            <h1 className="text-3xl font-black">{user.name || '사용자'}님!</h1>
          </div>

          {user.bio && <p className="text-muted-foreground">{user.bio}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {user.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(user.createdAt)} 가입</span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2">
          <Button
            asChild
            variant="default"
            className={cn(
              'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
              'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
              'transition-all'
            )}
          >
            <Link href="/posts/write">새 게시글 작성</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className={cn(
              'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
              'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
              'transition-all'
            )}
          >
            <Link href={`/profile/${user.id}`}>
              <User className="h-4 w-4 mr-2" />내 프로필
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
