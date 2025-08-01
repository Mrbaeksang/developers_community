'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  TrendingUp,
  Hash,
  Bookmark,
  PenSquare,
  User,
  Clock,
  Flame,
  Award,
  Crown,
  Medal,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface TrendingTag {
  id: string
  name: string
  count: number
  color: string
}

interface ActiveUser {
  id: string
  name: string
  image?: string
  postCount: number
}

interface TrendingPost {
  id: string
  title: string
  viewCount: number
  weeklyViews: number
  author: {
    name: string
  }
}

interface SidebarProps {
  trendingTags?: TrendingTag[]
  activeUsers?: ActiveUser[]
  trendingPosts?: TrendingPost[]
}

export function Sidebar({
  trendingTags = [],
  activeUsers = [],
  trendingPosts = [],
}: SidebarProps) {
  const { data: session } = useSession()
  const [recentViewed, setRecentViewed] = useState<string[]>([])

  useEffect(() => {
    // 최근 본 게시글 로드
    const viewed = localStorage.getItem('recentViewed')
    if (viewed) {
      setRecentViewed(JSON.parse(viewed).slice(0, 3))
    }
  }, [])

  return (
    <aside className="space-y-6">
      {/* 빠른 액션 */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-green-50">
          <CardTitle className="text-lg font-black flex items-center">
            <PenSquare className="mr-2 h-5 w-5 text-green-600" />
            빠른 액션
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <Link href="/main/write" className="block group">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all duration-200 hover:shadow-sm border border-primary/20">
              <div className="p-2 rounded-full bg-primary text-primary-foreground">
                <PenSquare className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm group-hover:text-primary transition-colors">
                  글쓰기
                </p>
                <p className="text-xs text-muted-foreground">
                  새로운 포스트 작성하기
                </p>
              </div>
            </div>
          </Link>

          {session?.user && (
            <>
              <Link href="/users/bookmarks" className="block group">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/80 hover:bg-blue-100/80 transition-all duration-200 hover:shadow-sm border border-blue-200/50">
                  <div className="p-2 rounded-full bg-blue-500 text-white">
                    <Bookmark className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm group-hover:text-blue-600 transition-colors">
                      내 북마크
                    </p>
                    <p className="text-xs text-muted-foreground">
                      저장된 게시글 모아보기
                    </p>
                  </div>
                </div>
              </Link>

              <Link href={`/users/${session.user.id}`} className="block group">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/80 hover:bg-purple-100/80 transition-all duration-200 hover:shadow-sm border border-purple-200/50">
                  <div className="p-2 rounded-full bg-purple-500 text-white">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm group-hover:text-purple-600 transition-colors">
                      내 프로필
                    </p>
                    <p className="text-xs text-muted-foreground">
                      프로필 및 활동 내역
                    </p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {recentViewed.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs font-bold mb-2 flex items-center text-muted-foreground">
                <Clock className="mr-1 h-3 w-3" />
                최근 본 글
              </p>
              <div className="space-y-1">
                {recentViewed.map((title, idx) => (
                  <p
                    key={idx}
                    className="text-xs text-muted-foreground truncate hover:text-primary transition-colors cursor-default"
                  >
                    {title}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 트렌딩 토픽 */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-yellow-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-black flex items-center">
              <Hash className="mr-2 h-5 w-5" />
              트렌딩 토픽
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2 items-start">
            {trendingTags.slice(0, 6).map((tag) => {
              const fontSize = 'text-xs' // 모든 태그 동일한 크기

              // hex 색상을 RGB로 변환하는 함수
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                  hex
                )
                return result
                  ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16),
                    }
                  : { r: 100, g: 100, b: 100 }
              }

              // 밝기 계산 (0-255)
              const getLuminance = (color: string) => {
                const rgb = hexToRgb(color)
                return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
              }

              // 배경색이 밝으면 검은색, 어두우면 흰색 텍스트
              const textColor =
                getLuminance(tag.color) > 128 ? '#000000' : '#ffffff'

              // 숫자 포맷팅 (1000 -> 1K, 1500 -> 1.5K)
              const formatCount = (count: number) => {
                if (count >= 1000) {
                  const formatted = (count / 1000).toFixed(1)
                  return formatted.endsWith('.0')
                    ? `${Math.floor(count / 1000)}K`
                    : `${formatted}K`
                }
                return count.toString()
              }

              return (
                <Link
                  key={tag.id}
                  href={`/main/tags/${encodeURIComponent(tag.name)}`}
                  className={`group inline-flex items-center gap-1 px-3 py-1.5 rounded-full border-2 hover:scale-105 hover:shadow-lg transition-all duration-200 font-semibold ${fontSize} whitespace-nowrap`}
                  style={{
                    backgroundColor: tag.color,
                    borderColor: tag.color,
                    color: textColor,
                    boxShadow: `3px 3px 0px 0px rgba(0,0,0,0.2)`,
                  }}
                >
                  <Hash className="w-3 h-3 flex-shrink-0" />
                  <span className="group-hover:opacity-80 transition-all duration-200">
                    {tag.name}
                  </span>
                  <span
                    className="text-[10px] px-1 py-0 rounded font-bold flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{
                      color: textColor,
                    }}
                  >
                    {formatCount(tag.count)}
                  </span>
                </Link>
              )
            })}
          </div>

          {trendingTags.length === 0 && (
            <div className="text-center py-6">
              <Hash className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                아직 트렌딩 토픽이 없습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이번 주 MVP */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-amber-50">
          <CardTitle className="text-lg font-black flex items-center">
            <Award className="mr-2 h-5 w-5 text-amber-600" />
            이번 주 MVP
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            {activeUsers.slice(0, 3).map((user, index) => {
              const RankIcon =
                index === 0 ? Crown : index === 1 ? Medal : Trophy
              const rankStyle =
                index === 0
                  ? 'text-yellow-600 bg-yellow-100'
                  : index === 1
                    ? 'text-gray-600 bg-gray-100'
                    : 'text-amber-600 bg-amber-100'

              return (
                <div key={user.id}>
                  <Link href={`/profile/${user.id}`} className="block group">
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 hover:shadow-sm">
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${rankStyle}`}>
                          <RankIcon className="h-4 w-4" />
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={user.image || ''} alt={user.name} />
                          <AvatarFallback className="text-sm font-bold bg-primary/20">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                            {user.name}
                          </p>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            #{index + 1}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          이번 주 {user.postCount}개 작성
                        </p>
                      </div>
                    </div>
                  </Link>
                  {index < 2 && (
                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 실시간 인기글 */}
      {trendingPosts && trendingPosts.length > 0 && (
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader className="border-b-2 border-black bg-orange-50">
            <CardTitle className="text-lg font-black flex items-center">
              <Flame className="mr-2 h-5 w-5 text-orange-500" />
              실시간 인기글
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {trendingPosts.slice(0, 3).map((post, index) => {
                const RankIcon =
                  index === 0 ? Crown : index === 1 ? Medal : Trophy
                const rankStyle =
                  index === 0
                    ? 'text-orange-600 bg-orange-100'
                    : index === 1
                      ? 'text-red-600 bg-red-100'
                      : 'text-pink-600 bg-pink-100'

                return (
                  <div key={post.id}>
                    <Link
                      href={`/main/posts/${post.id}`}
                      className="block group"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 hover:shadow-sm">
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${rankStyle}`}>
                            <RankIcon className="h-4 w-4" />
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{post.author.name}</span>
                            <span>•</span>
                            <Flame className="h-3 w-3 text-orange-500" />
                            <span>{post.weeklyViews.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    {index < 2 && (
                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  )
}
