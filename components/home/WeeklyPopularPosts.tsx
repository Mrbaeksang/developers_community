'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  MessageCircle,
  Heart,
  Flame,
  Crown,
  Medal,
  Trophy,
  User,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatCount, getLuminance } from '@/lib/post-format-utils'

interface Post {
  id: string
  title: string
  excerpt: string
  viewCount: number
  weeklyViews: number
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
    color?: string
    icon?: string | null
  }
  tags?: Array<{
    id: string
    name: string
    slug: string
    color?: string
  }>
  _count: {
    comments: number
    likes: number
  }
}

export function WeeklyPopularPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklyTrending()
  }, [])

  const fetchWeeklyTrending = async () => {
    try {
      const response = await fetch('/api/main/posts/weekly-trending?limit=5')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      // successResponse 형식으로 오는 경우 data 필드에서 실제 데이터 추출
      setPosts(result.data?.posts || [])
    } catch (error) {
      console.error('Failed to fetch weekly trending:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardTitle className="text-lg font-black flex items-center">
            <Flame className="mr-2 h-5 w-5 text-orange-600 animate-pulse" />
            주간 인기 게시글
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600 animate-pulse" />
            <h2 className="text-xl font-bold">주간 인기 게시글 🔥</h2>
          </div>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-3">
            <Flame className="h-12 w-12 text-gray-300" />
            <p>아직 인기 게시글이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-orange-50 to-yellow-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black">주간 인기 게시글</h2>
          </div>
          <Link
            href="/main/posts?sort=popular"
            className="text-sm font-bold text-orange-600 hover:text-orange-700 hover:translate-x-1 transition-all duration-200 flex items-center gap-1"
          >
            전체보기
            <span className="text-lg">→</span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y-2 divide-gray-200">
          {posts.map((post, index) => {
            const CategoryIcon =
              post.category.icon &&
              Icons[post.category.icon as keyof typeof Icons]
                ? (Icons[
                    post.category.icon as keyof typeof Icons
                  ] as React.ComponentType<{ className?: string }>)
                : null

            const categoryBgColor = post.category.color || '#6366f1'
            const categoryTextColor =
              getLuminance(categoryBgColor) > 128 ? '#000000' : '#FFFFFF'

            return (
              <Link
                key={post.id}
                href={`/main/posts/${post.id}`}
                className="block p-4 hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-yellow-50/30 transition-all duration-200 group relative"
              >
                <div className="flex items-start gap-4">
                  {/* 순위 뱃지 */}
                  <div className="flex-shrink-0">
                    {index === 0 ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <Crown className="h-6 w-6 text-white drop-shadow-sm" />
                      </div>
                    ) : index === 1 ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <Medal className="h-6 w-6 text-white drop-shadow-sm" />
                      </div>
                    ) : index === 2 ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-orange-400 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <Trophy className="h-6 w-6 text-white drop-shadow-sm" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center font-black text-base group-hover:bg-gray-50 transition-colors">
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* 게시글 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 카테고리 뱃지 */}
                    <Badge
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2 hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: categoryBgColor,
                        color: categoryTextColor,
                        borderColor: '#000',
                      }}
                    >
                      {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                      {post.category.name}
                    </Badge>

                    {/* 제목 */}
                    <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {post.title}
                    </h3>

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.tags.slice(0, 3).map((tag) => {
                          const tagBgColor = tag.color || '#6366f1'
                          const tagTextColor =
                            getLuminance(tagBgColor) > 128
                              ? '#000000'
                              : '#FFFFFF'

                          return (
                            <span
                              key={tag.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border-2 hover:scale-105 transition-all duration-200"
                              style={{
                                backgroundColor: tagBgColor,
                                color: tagTextColor,
                                borderColor: tagBgColor,
                                boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
                              }}
                            >
                              #<span>{tag.name}</span>
                            </span>
                          )
                        })}
                        {post.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-3 text-xs">
                      {/* 작성자 정보 */}
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5 border border-gray-200">
                          <AvatarImage src={post.author.image || undefined} />
                          <AvatarFallback className="text-[10px] bg-gray-100">
                            {post.author.name ? (
                              post.author.name[0].toUpperCase()
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-700">
                          {post.author.name || '익명'}
                        </span>
                      </div>

                      <span className="text-gray-400">•</span>

                      {/* 시간 */}
                      <span className="text-gray-500">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>

                    {/* 통계 정보 */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Eye className="h-3.5 w-3.5 text-orange-500" />
                        <span className="font-medium">
                          {formatCount(post.weeklyViews)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <MessageCircle className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium">
                          {formatCount(post._count.comments)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Heart className="h-3.5 w-3.5 text-red-500" />
                        <span className="font-medium">
                          {formatCount(post._count.likes)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 호버 시 우측 화살표 */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-2xl text-orange-500">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
