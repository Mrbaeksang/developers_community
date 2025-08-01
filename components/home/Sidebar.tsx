'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Hash,
  Bookmark,
  PenSquare,
  User,
  Clock,
  Flame,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface TrendingTag {
  id: string
  name: string
  count: number
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
            <PenSquare className="mr-2 h-5 w-5" />
            빠른 액션
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <Link href="/main/posts/new" className="block">
            <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <PenSquare className="mr-2 h-4 w-4" />
              글쓰기
            </Button>
          </Link>

          {session?.user && (
            <>
              <Link href="/users/bookmarks" className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-secondary/50 transition-colors"
                >
                  <Bookmark className="mr-2 h-4 w-4" />내 북마크
                </Button>
              </Link>

              <Link href={`/users/${session.user.id}`} className="block">
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-secondary/50 transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />내 프로필
                </Button>
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
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag, index) => {
              const maxCount = Math.max(...trendingTags.map((t) => t.count))
              const size = tag.count / maxCount
              const fontSize =
                size > 0.8 ? 'text-base' : size > 0.5 ? 'text-sm' : 'text-xs'

              return (
                <Link
                  key={tag.id}
                  href={`/main/tags/${encodeURIComponent(tag.name)}`}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full hover:opacity-80 transition-opacity ${
                    index % 3 === 0
                      ? 'bg-yellow-200'
                      : index % 3 === 1
                        ? 'bg-blue-200'
                        : 'bg-green-200'
                  } font-bold ${fontSize}`}
                >
                  #{tag.name}
                  <span className="text-xs opacity-70">({tag.count})</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 이번 주 MVP */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-amber-50">
          <CardTitle className="text-lg font-black flex items-center">
            <Award className="mr-2 h-5 w-5" />
            이번 주 MVP
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {activeUsers.slice(0, 3).map((user, index) => (
              <Link
                key={user.id}
                href={`/profile/${user.id}`}
                className="block group"
              >
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image || ''} alt={user.name} />
                      <AvatarFallback className="text-sm font-bold bg-primary/20">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                        index === 0
                          ? 'bg-yellow-400'
                          : index === 1
                            ? 'bg-gray-300'
                            : 'bg-amber-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.postCount}개 작성 • 기여도 #{index + 1}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
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
            <div className="space-y-3">
              {trendingPosts.slice(0, 3).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/main/posts/${post.id}`}
                  className="block group"
                >
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                        index === 0
                          ? 'bg-yellow-400'
                          : index === 1
                            ? 'bg-gray-300'
                            : 'bg-orange-300'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {post.author.name} • 조회수{' '}
                        {post.weeklyViews.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </aside>
  )
}
