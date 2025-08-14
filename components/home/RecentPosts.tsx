'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { TagBadge } from '@/components/shared/TagBadge'
import { PostStats } from '@/components/shared/PostStats'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { usePageFocusRefresh } from '@/lib/hooks/usePageFocusRefresh'
import type { CommonMainPost } from '@/lib/common/types'

// API 응답에서 추가된 필드들을 포함한 타입
interface PostWithCalculatedFields extends CommonMainPost {
  readingTime?: number
  likeCount?: number
  commentCount?: number
  tags: Array<{
    id: string
    name: string
    slug: string
    color?: string | null
  }>
}

// 최근 게시글 가져오기 함수
const fetchRecentPosts = async (): Promise<PostWithCalculatedFields[]> => {
  const response = await fetch(
    '/api/main/posts?limit=10&sort=latest&excludeCategories=true'
  )
  if (!response.ok) throw new Error('Failed to fetch recent posts')
  const result = await response.json()

  // API 응답 구조에 따라 적절히 처리
  if (Array.isArray(result)) {
    return result
  }

  // compressedPaginatedResponse의 중첩 구조 처리
  if (result.data) {
    // data가 직접 배열인 경우
    if (Array.isArray(result.data)) {
      return result.data
    }
    // data.data가 배열인 경우 (압축된 응답의 중첩 구조)
    if (result.data.data && Array.isArray(result.data.data)) {
      return result.data.data
    }
  }

  if (result.posts && Array.isArray(result.posts)) {
    return result.posts
  }

  // 예상치 못한 구조인 경우 빈 배열 반환
  console.warn('Unexpected API response structure:', result)
  return []
}

export function RecentPosts() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['recentPosts'],
    queryFn: fetchRecentPosts,
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 60 * 1000, // 1분간 캐시
    refetchInterval: 30 * 1000, // 30초마다 자동 새로고침
  })

  // 페이지 포커스 시 자동 새로고침
  usePageFocusRefresh('recentPosts')

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black">최근 게시글</h2>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <SkeletonLoader lines={5} />
        </CardContent>
      </Card>
    )
  }

  // posts가 배열이 아닌 경우 방어
  if (!Array.isArray(posts) || posts.length === 0) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black">최근 게시글</h2>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <EmptyState
            icon={Clock}
            title="아직 게시글이 없습니다"
            description="새로운 게시글이 작성되면 여기에 표시됩니다"
            size="sm"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
      <CardHeader className="border-b-2 border-black bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-black">최근 게시글</h2>
          </div>
          <Link
            href="/main/posts"
            className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:translate-x-1 transition-all duration-200 flex items-center gap-1"
          >
            전체보기
            <span className="text-lg">→</span>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y-2 divide-gray-200">
          {posts.slice(0, 5).map((post) => {
            const readingTime = post.readingTime || 1
            return (
              <Link
                key={post.id}
                href={`/main/posts/${post.id}`}
                className="block p-4 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200 group relative"
              >
                <div className="flex items-start gap-4">
                  {/* 작성자 아바타 */}
                  <AuthorAvatar
                    author={post.author}
                    size="lg"
                    avatarClassName="border-gray-200"
                  />

                  {/* 게시글 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 카테고리 뱃지와 읽기 시간 */}
                    <div className="flex items-center gap-3 mb-2">
                      {post.category && (
                        <CategoryBadge
                          category={{
                            ...post.category,
                            color: post.category.color || '#808080',
                          }}
                          showIcon={true}
                          clickable={false}
                          className="text-xs px-2.5 py-0.5"
                        />
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{readingTime}분</span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>

                    {/* 태그 */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <TagBadge
                            key={tag.id}
                            tag={{
                              ...tag,
                              color: tag.color || '#808080',
                            }}
                            size="sm"
                            showIcon={true}
                            clickable={false}
                            className="text-[10px] px-2 py-0.5"
                          />
                        ))}
                        {post.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-3 text-xs">
                      {/* 작성자 이름 */}
                      <span className="font-medium text-gray-700">
                        {post.author.name || '익명'}
                      </span>

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
                    <PostStats
                      viewCount={post.viewCount}
                      likeCount={post.likeCount || 0}
                      commentCount={post.commentCount || 0}
                      size="sm"
                      variant="minimal"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* 호버 시 우측 화살표 */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-2xl text-blue-500">→</span>
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
