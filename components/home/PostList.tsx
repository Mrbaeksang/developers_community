'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PostCard } from '@/components/posts/PostCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { PageLoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  ChevronRight,
  TrendingUp,
  Clock,
  FileText,
  Sparkles,
  Filter,
  SortAsc,
  LayoutGrid,
  LayoutList,
} from 'lucide-react'
import type { MainPostFormatted } from '@/lib/post/types'
import { useMainPosts } from '@/lib/hooks/usePostQuery'

interface Category {
  id: string
  name: string
  slug: string
  postCount: number
}

interface PostListProps {
  initialPosts?: MainPostFormatted[]
  categories?: Category[]
  isLoading?: boolean
  currentCategory?: string
}

// 메인 게시글 가져오기 함수

export function PostList({
  initialPosts = [],
  categories: initialCategories = [],
  isLoading: externalLoading = false,
  currentCategory,
}: PostListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터와 상태 동기화
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest')
  const [selectedCategory, setSelectedCategory] = useState<string>(
    currentCategory || searchParams.get('category') || 'all'
  )
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const page = searchParams.get('page') || '1'

  // React Query로 데이터 가져오기
  const { data, isLoading } = useMainPosts(
    {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      sort: sortBy as 'latest' | 'popular' | 'views' | 'comments',
      page: parseInt(page),
    },
    {
      initialData:
        initialPosts.length > 0
          ? {
              success: true,
              data: {
                items: initialPosts,
                totalCount: initialPosts.length,
                pageInfo: {
                  currentPage: parseInt(page),
                  pageSize: 10,
                  hasNext: false,
                  hasPrev: parseInt(page) > 1,
                },
              },
            }
          : undefined,
    }
  )

  const posts = useMemo(() => {
    return data?.data?.items || initialPosts || []
  }, [data?.data?.items, initialPosts])

  const categories = useMemo(() => {
    return initialCategories || []
  }, [initialCategories])

  // URL 업데이트 함수
  const updateURL = (params: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value === 'all' || value === 'latest') {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })
    router.push(
      `/main/posts${current.toString() ? `?${current.toString()}` : ''}`
    )
  }

  // 카테고리 이름 가져오기
  const getCategoryName = (slug: string | undefined) => {
    if (!slug || slug === 'all') return '모든 카테고리'
    if (slug === 'free') return '자유게시판'
    if (slug === 'qna') return 'Q&A'
    const category = categories.find((c: Category) => c.slug === slug)
    return category?.name || '모든 카테고리'
  }

  // 카테고리로 필터링된 게시물 - useMemo로 최적화
  const filteredPosts = useMemo(() => {
    return selectedCategory === 'all'
      ? posts
      : posts.filter(
          (post: MainPostFormatted) => post.category?.slug === selectedCategory
        )
  }, [posts, selectedCategory])

  // 정렬된 게시물 목록 (고정 게시글 우선 정렬) - useMemo로 최적화
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      // 1. 고정 게시글이 항상 먼저
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 2. 둘 다 고정이거나 둘 다 일반이면 선택한 정렬 방식으로
      switch (sortBy) {
        case 'latest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        case 'popular':
          return b.viewCount - a.viewCount
        case 'discussed':
          return (b.commentCount || 0) - (a.commentCount || 0)
        default:
          return 0
      }
    })
  }, [filteredPosts, sortBy])

  // 탭별 필터링 - useMemo로 최적화
  const { trendingPosts, recentPosts } = useMemo(() => {
    const trending = sortedPosts.filter(
      (post) => post.viewCount > 100 || (post.likeCount || 0) > 10
    )

    const dayAgo = new Date()
    dayAgo.setDate(dayAgo.getDate() - 1)
    const recent = sortedPosts.filter((post) => {
      return new Date(post.createdAt) > dayAgo
    })

    return { trendingPosts: trending, recentPosts: recent }
  }, [sortedPosts])

  if (isLoading || externalLoading) {
    return <PageLoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* 브레드크럼 네비게이션 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push('/')}
          className="hover:text-foreground transition-colors"
        >
          홈
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">게시물</span>
        {selectedCategory !== 'all' && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {getCategoryName(selectedCategory)}
            </span>
          </>
        )}
      </div>

      {/* 헤더 섹션 - 톤다운 버전 */}
      <div className="relative border rounded-lg p-6 bg-white shadow-sm border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {getCategoryName(selectedCategory)} 게시물
                </h2>
                <p className="text-sm text-muted-foreground">
                  총{' '}
                  <span className="font-semibold text-foreground">
                    {filteredPosts.length}개
                  </span>
                  의 게시물이 있어요
                </p>
              </div>
            </div>
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`rounded-md transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted-foreground/10 text-muted-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'hover:bg-muted-foreground/10 text-muted-foreground'
              }`}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 카테고리 선택 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              카테고리
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value)
                updateURL({ category: value })
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    모든 카테고리
                  </div>
                </SelectItem>
                {categories.map((category: Category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                      {category.name}{' '}
                      <span className="text-xs text-muted-foreground">
                        ({category.postCount})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 정렬 선택 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <SortAsc className="h-4 w-4" />
              정렬
            </div>
            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value)
                updateURL({ sort: value })
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    최신순
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                    인기순
                  </div>
                </SelectItem>
                <SelectItem value="discussed">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    댓글 많은 순
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>전체</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold"
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>트렌딩</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>최근 24시간</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div
            className={
              viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'
            }
          >
            {sortedPosts.length > 0 ? (
              sortedPosts.map((post: MainPostFormatted) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div
            className={
              viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'
            }
          >
            {trendingPosts.length > 0 ? (
              trendingPosts.map((post: MainPostFormatted) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <EmptyState message="아직 트렌딩 게시물이 없습니다." />
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div
            className={
              viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'
            }
          >
            {recentPosts.length > 0 ? (
              recentPosts.map((post: MainPostFormatted) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <EmptyState message="최근 24시간 동안 작성된 게시물이 없습니다." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({
  message = '아직 게시물이 없습니다.',
}: {
  message?: string
}) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}
