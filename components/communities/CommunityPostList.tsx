'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { MessageSquare, Heart, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatCount, getTextColor } from '@/lib/common/types'

interface Author {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Category {
  id: string
  name: string
  color: string | null
}

interface Post {
  id: string
  title: string
  content: string
  viewCount: number
  createdAt: string
  author: Author
  category: Category | null
  _count: {
    comments: number
    likes: number
  }
  isLiked: boolean
  isBookmarked: boolean
}

interface CommunityPostListProps {
  communityId: string
  communitySlug: string
  page: number
  category?: string | undefined
  search?: string | undefined
  sort?: string
}

// 커뮤니티 게시글 가져오기
const fetchCommunityPosts = async ({
  communityId,
  page,
  category,
  search,
  sort,
}: {
  communityId: string
  page: number
  category?: string
  search?: string
  sort?: string
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '10',
  })

  if (category) params.append('category', category)
  if (search) params.append('search', search)
  if (sort) params.append('sort', sort)

  const res = await fetch(`/api/communities/${communityId}/posts?${params}`)

  if (!res.ok) {
    throw new Error('Failed to fetch posts')
  }

  const data = await res.json()

  // 새로운 응답 형식 처리: { success: true, data: { posts, pagination } }
  if (data.success && data.data) {
    return data.data
  } else {
    // 실패 응답 처리
    throw new Error(data.message || 'Failed to fetch posts')
  }
}

export function CommunityPostList({
  communityId,
  communitySlug,
  page,
  category,
  search,
  sort,
}: CommunityPostListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['communityPosts', communityId, page, category, search, sort],
    queryFn: () =>
      fetchCommunityPosts({ communityId, page, category, search, sort }),
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
  })

  const posts = data?.posts || []
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card
            key={i}
            className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // 에러 처리
  if (error) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-bold text-lg mb-2">
            게시글을 불러올 수 없습니다
          </h3>
          <p className="text-muted-foreground">잠시 후 다시 시도해주세요.</p>
        </CardContent>
      </Card>
    )
  }

  if (!isLoading && (!posts || posts.length === 0)) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-bold text-lg mb-2">게시글이 없습니다</h3>
          <p className="text-muted-foreground">
            {search
              ? '검색 결과가 없습니다.'
              : '첫 번째 게시글을 작성해보세요!'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts?.map((post: Post) => (
        <Card
          key={post.id}
          className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <CardContent className="p-6">
            <Link href={`/communities/${communitySlug}/posts/${post.id}`}>
              <article className="space-y-3">
                {/* Title and Category */}
                <div>
                  <div className="flex items-start gap-3 mb-2">
                    {post.category && (
                      <Badge
                        variant="secondary"
                        className="text-xs border-2 font-bold"
                        style={{
                          backgroundColor: post.category?.color || '#6366f1',
                          color: getTextColor(
                            post.category?.color || '#6366f1'
                          ),
                          borderColor: post.category?.color || '#6366f1',
                          boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
                        }}
                      >
                        {post.category?.name || '일반'}
                      </Badge>
                    )}
                    <h2 className="text-xl font-bold hover:text-primary transition-colors line-clamp-2 flex-1">
                      {post.title}
                    </h2>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                </div>

                {/* Author and Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <AuthorAvatar
                      author={post.author}
                      size="sm"
                      enableDropdown
                      dropdownAlign="start"
                    />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {post.author.name || 'Unknown'}
                      </span>
                      <span>·</span>
                      <time>
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </time>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatCount(post.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart
                        className={`h-4 w-4 ${post.isLiked ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      {formatCount(post._count.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {formatCount(post._count.comments)}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </CardContent>
        </Card>
      ))}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
            (p) => (
              <Button
                key={p}
                variant={p === page ? 'default' : 'outline'}
                size="sm"
                asChild
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                <Link
                  href={`/communities/${communitySlug}/posts?page=${p}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}${sort ? `&sort=${sort}` : ''}`}
                >
                  {p}
                </Link>
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}
