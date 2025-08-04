'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  FileText,
  MessageSquare,
  Heart,
  Loader2,
  User,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface ProfileDropdownProps {
  userId: string
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
}

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  createdAt: string
  _count: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    mainLikes: number
    mainBookmarks: number
  }
}

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`/api/users/${userId}/profile`)
  if (!res.ok) {
    throw new Error('프로필을 불러오는데 실패했습니다.')
  }
  return res.json()
}

export function ProfileDropdown({
  userId,
  children,
  align = 'start',
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: isOpen && !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시
  })

  const totalPosts = profile
    ? profile._count.mainPosts + profile._count.communityPosts
    : 0

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-[320px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : profile ? (
          <div className="p-4 space-y-4">
            {/* 프로필 헤더 */}
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <AvatarImage src={profile.image || undefined} />
                <AvatarFallback className="bg-primary/20 font-bold">
                  {profile.name?.[0] || profile.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">
                  {profile.name || '이름 없음'}
                </p>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">
                    @{profile.username}
                  </p>
                )}
                <p className="text-xs text-muted-foreground truncate">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {profile.bio}
                </p>
              </>
            )}

            <Separator />

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center text-muted-foreground">
                  <FileText className="h-4 w-4" />
                </div>
                <p className="font-bold text-lg">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">게시글</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <p className="font-bold text-lg">
                  {profile._count.mainComments}
                </p>
                <p className="text-xs text-muted-foreground">댓글</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center text-muted-foreground">
                  <Heart className="h-4 w-4" />
                </div>
                <p className="font-bold text-lg">{profile._count.mainLikes}</p>
                <p className="text-xs text-muted-foreground">좋아요</p>
              </div>
            </div>

            <Separator />

            {/* 가입일 */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(profile.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </div>

            {/* 프로필 보기 버튼 */}
            <Button asChild className="w-full font-bold">
              <Link href={`/profile/${profile.id}`}>
                <User className="h-4 w-4 mr-2" />
                전체 프로필 보기
              </Link>
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            프로필을 불러올 수 없습니다.
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
