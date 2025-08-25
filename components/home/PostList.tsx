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
import { EmptyState } from '@/components/shared/EmptyState'
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
  PenSquare,
  ChevronDown,
  ChevronUp,
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
}

// 메인 게시글 가져오기 함수

export function PostList({
  initialPosts = [],
  categories: initialCategories = [],
  isLoading: externalLoading = false,
}: PostListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL 파라미터에서 직접 값 읽기 (상태 관리 제거)
  const categoryFromUrl = searchParams.get('category') || 'all'
  const sortFromUrl = searchParams.get('sort') || 'latest'
  const page = searchParams.get('page') || '1'

  // 로컬 상태는 UI 컨트롤용으로만 사용 - 기본값을 list로 변경
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [isFilterOpen, setIsFilterOpen] = useState(false) // 모바일 필터 토글 상태

  // React Query로 데이터 가져오기 - URL 파라미터 직접 사용
  const { data, isLoading } = useMainPosts(
    {
      category: categoryFromUrl === 'all' ? undefined : categoryFromUrl,
      sort: sortFromUrl as 'latest' | 'popular' | 'views' | 'comments',
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
    // replace 대신 push 사용하되, scroll: false 옵션 추가
    router.push(
      `/main/posts${current.toString() ? `?${current.toString()}` : ''}`,
      { scroll: false }
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

  // 카테고리로 필터링된 게시물 - useMemo로 최적화 (URL 파라미터 사용)
  const filteredPosts = useMemo(() => {
    return categoryFromUrl === 'all'
      ? posts
      : posts.filter(
          (post: MainPostFormatted) => post.category?.slug === categoryFromUrl
        )
  }, [posts, categoryFromUrl])

  // 정렬된 게시물 목록 (고정 게시글 우선 정렬) - useMemo로 최적화 (URL 파라미터 사용)
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      // 1. 고정 게시글이 항상 먼저
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 2. 둘 다 고정이거나 둘 다 일반이면 선택한 정렬 방식으로
      switch (sortFromUrl) {
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
  }, [filteredPosts, sortFromUrl])

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
    <div className="space-y-6 w-full">
      {/* 브레드크럼 네비게이션 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto scrollbar-hide">
        <button
          onClick={() => router.push('/')}
          className="hover:text-foreground transition-colors"
        >
          홈
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">게시물</span>
        {categoryFromUrl !== 'all' && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {getCategoryName(categoryFromUrl)}
            </span>
          </>
        )}
      </div>

      {/* 헤더 섹션 - 모바일에서 더 컴팩트하게 */}
      <div className="relative border rounded-lg p-3 sm:p-6 bg-white shadow-sm border-border">
        {/* 모바일 컴팩트 헤더 */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {getCategoryName(categoryFromUrl)} ({filteredPosts.length})
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-7 w-7"
              >
                <LayoutList className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-7 w-7"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* 모바일 필터 토글 버튼 - 더 작게 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full h-8 text-xs flex items-center justify-between border border-border"
          >
            <span className="font-medium">
              {categoryFromUrl === 'all'
                ? '전체'
                : getCategoryName(categoryFromUrl)}{' '}
              ·{' '}
              {sortFromUrl === 'latest'
                ? '최신순'
                : sortFromUrl === 'popular'
                  ? '인기순'
                  : '댓글순'}
            </span>
            {isFilterOpen ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>

          {/* 모바일 필터 드롭다운 */}
          {isFilterOpen && (
            <div className="flex gap-2 pt-2 border-t">
              <Select
                value={categoryFromUrl}
                onValueChange={(value) => {
                  updateURL({ category: value })
                  setIsFilterOpen(false)
                }}
              >
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortFromUrl}
                onValueChange={(value) => {
                  updateURL({ sort: value })
                  setIsFilterOpen(false)
                }}
              >
                <SelectTrigger className="flex-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="popular">인기순</SelectItem>
                  <SelectItem value="discussed">댓글순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* 데스크톱 헤더 - 기존 유지 */}
        <div className="hidden sm:flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted flex-shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {getCategoryName(categoryFromUrl)} 게시물
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
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg flex-shrink-0">
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

        {/* 데스크톱 필터 섹션 */}
        <div className="hidden sm:flex items-center gap-3 mt-4">
          {/* 카테고리 선택 - 데스크톱 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground flex-shrink-0">
              <Filter className="h-4 w-4" />
              <span>카테고리</span>
            </div>
            <Select
              value={categoryFromUrl}
              onValueChange={(value) => {
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

          {/* 정렬 선택 - 데스크톱 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground flex-shrink-0">
              <SortAsc className="h-4 w-4" />
              <span>정렬</span>
            </div>
            <Select
              value={sortFromUrl}
              onValueChange={(value) => {
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

          {/* 글쓰기 버튼 - 데스크톱에서만 */}
          <div className="ml-auto">
            <Button
              onClick={() => {
                const category =
                  categoryFromUrl !== 'all' ? categoryFromUrl : ''
                router.push(
                  `/main/write${category ? `?category=${category}` : ''}`
                )
              }}
              className="flex items-center gap-2"
            >
              <PenSquare className="h-4 w-4" />
              글쓰기
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 border sm:border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-brutal h-9 sm:h-10">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-xs sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <FileText className="hidden sm:block h-4 w-4" />
              <span>전체</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="trending"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-bold text-xs sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="hidden sm:block h-4 w-4" />
              <span>인기</span>
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-bold text-xs sm:text-sm"
          >
            <span className="flex items-center gap-2">
              <Clock className="hidden sm:block h-4 w-4" />
              <span>24시간</span>
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-4 md:grid-cols-2'
                : 'space-y-4 max-w-4xl mx-auto'
            }
          >
            {sortedPosts.length > 0 ? (
              sortedPosts.map((post: MainPostFormatted) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="col-span-2">
                <EmptyState
                  icon={FileText}
                  title="아직 게시물이 없습니다"
                  description="첫 번째 게시물을 작성해보세요"
                  size="lg"
                />
              </div>
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
              <div className="col-span-2">
                <EmptyState
                  icon={TrendingUp}
                  title="아직 트렌딩 게시물이 없습니다"
                  description="인기 게시물이 여기에 표시됩니다"
                  size="lg"
                />
              </div>
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
              <div className="col-span-2">
                <EmptyState
                  icon={Clock}
                  title="최근 24시간 동안 작성된 게시물이 없습니다"
                  description="새로운 게시물이 작성되면 여기에 표시됩니다"
                  size="lg"
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
