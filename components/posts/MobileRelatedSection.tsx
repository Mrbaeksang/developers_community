'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Eye,
  Heart,
  MessageSquare,
  Sparkles,
  Bot,
  BookOpen,
  Flame,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCount, getTextColor } from '@/lib/common/types'
import { useRef } from 'react'

interface RelatedPost {
  id: string
  title: string
  slug: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  author: {
    name: string | null
    image: string | null
  }
  category: {
    name: string
    slug: string
    color: string
  }
}

interface WeeklyPost {
  id: string
  title: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  category?: {
    name: string
    color: string
  }
}

interface MobileRelatedSectionProps {
  postId: string
}

// 관련 게시글 가져오기
const fetchRelatedPosts = async (postId: string): Promise<RelatedPost[]> => {
  const res = await fetch(`/api/main/posts/${postId}/related?limit=5`)
  if (!res.ok) throw new Error('Failed to fetch related posts')
  const data = await res.json()
  if (data.success && data.data) {
    return data.data.posts || []
  }
  return data.posts || []
}

// 주간 인기 게시글 가져오기
const fetchWeeklyTrending = async (): Promise<WeeklyPost[]> => {
  const res = await fetch('/api/main/posts/weekly-trending?limit=5')
  if (!res.ok) throw new Error('Failed to fetch weekly trending')
  const data = await res.json()
  if (data.success && data.data) {
    return data.data.posts || []
  }
  return data.posts || []
}

export default function MobileRelatedSection({
  postId,
}: MobileRelatedSectionProps) {
  const relatedScrollRef = useRef<HTMLDivElement>(null)
  const weeklyScrollRef = useRef<HTMLDivElement>(null)

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['relatedPosts', postId],
    queryFn: () => fetchRelatedPosts(postId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!postId,
  })

  const { data: weeklyPosts = [] } = useQuery({
    queryKey: ['weeklyTrending'],
    queryFn: fetchWeeklyTrending,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  return (
    <div className="space-y-6 mt-8">
      {/* CTA 버튼들 - 가로 스크롤 */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2">
          {/* 모든 게시글 보러가기 */}
          <Link
            href="/main/posts"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 border-2 border-black"
          >
            <BookOpen className="h-5 w-5" />
            <span>모든 게시글 보러가기</span>
          </Link>

          {/* Q&A GPT-5 답변받기 */}
          <Link
            href="/main/categories/qa"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 border-2 border-black"
          >
            <Bot className="h-5 w-5" />
            <span>Q&A 질문하고 GPT-5 답변받기</span>
          </Link>
        </div>
      </div>

      {/* 주간 인기 게시글 - 가로 스크롤 */}
      {weeklyPosts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            주간 인기 게시글
          </h3>
          <div ref={weeklyScrollRef} className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {weeklyPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/main/posts/${post.id}`}
                  className="flex-shrink-0 w-[280px]"
                >
                  <article className="bg-white border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">
                        {index === 0
                          ? '🥇'
                          : index === 1
                            ? '🥈'
                            : index === 2
                              ? '🥉'
                              : '🏆'}
                      </span>
                      {post.category && (
                        <Badge
                          className="border-2 font-bold text-xs"
                          style={{
                            backgroundColor: post.category.color,
                            color: getTextColor(post.category.color),
                            borderColor: post.category.color,
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-bold text-sm mb-2 line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatCount(post.viewCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatCount(post.likeCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {formatCount(post.commentCount || 0)}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 관련 게시글 - 가로 스크롤 */}
      {relatedPosts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            관련 게시글
          </h3>
          <div
            ref={relatedScrollRef}
            className="overflow-x-auto scrollbar-hide"
          >
            <div className="flex gap-3 pb-2">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/main/posts/${post.id}`}
                  className="flex-shrink-0 w-[280px]"
                >
                  <article className="bg-white border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 h-full">
                    <Badge
                      className="mb-2 border-2 font-bold text-xs"
                      style={{
                        backgroundColor: post.category.color,
                        color: getTextColor(post.category.color),
                        borderColor: post.category.color,
                      }}
                    >
                      {post.category.name}
                    </Badge>
                    <h4 className="font-bold text-sm mb-2 line-clamp-2">
                      {post.title}
                    </h4>
                    <div className="text-xs text-muted-foreground mb-2">
                      {post.author.name || 'Unknown'} ·{' '}
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {formatCount(post.viewCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatCount(post.likeCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {formatCount(post.commentCount || 0)}
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
