'use client'

import { useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, Grid3X3, List, TrendingUp, Clock } from 'lucide-react'
import type { Post } from '@/lib/types'

interface Category {
  id: string
  name: string
  slug: string
  postCount: number
}

interface PostListProps {
  initialPosts?: Post[]
  categories?: Category[]
  isLoading?: boolean
  currentCategory?: string
}

export function PostList({
  initialPosts = [],
  categories = [],
  isLoading = false,
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
  const [posts] = useState<Post[]>(initialPosts)

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
    const category = categories.find((c) => c.slug === slug)
    return category?.name || '모든 카테고리'
  }

  // 카테고리로 필터링된 게시물
  const filteredPosts =
    selectedCategory === 'all'
      ? posts
      : posts.filter((post) => post.category?.slug === selectedCategory)

  // 정렬된 게시물 목록
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'latest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'popular':
        return b.viewCount - a.viewCount
      case 'discussed':
        return (b._count?.comments || 0) - (a._count?.comments || 0)
      default:
        return 0
    }
  })

  // 탭별 필터링
  const trendingPosts = sortedPosts.filter(
    (post) => post.viewCount > 100 || (post._count?.likes || 0) > 10
  )
  const recentPosts = sortedPosts.filter((post) => {
    const dayAgo = new Date()
    dayAgo.setDate(dayAgo.getDate() - 1)
    return new Date(post.createdAt) > dayAgo
  })

  if (isLoading) {
    return <PostListSkeleton />
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

      {/* 헤더 섹션 */}
      <div className="border-2 border-black rounded-lg p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {getCategoryName(selectedCategory)} 게시물
            </h2>
            <p className="text-muted-foreground">
              총 {filteredPosts.length}개의 게시물
            </p>
          </div>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 카테고리 선택 */}
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value)
              updateURL({ category: value })
            }}
          >
            <SelectTrigger className="w-[180px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name} ({category.postCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 정렬 선택 */}
          <Select
            value={sortBy}
            onValueChange={(value) => {
              setSortBy(value)
              updateURL({ sort: value })
            }}
          >
            <SelectTrigger className="w-[180px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
              <SelectItem value="discussed">댓글 많은 순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold"
          >
            <span className="flex items-center gap-2">
              <span>전체</span>
              <Badge variant="secondary" className="ml-1">
                {sortedPosts.length}
              </Badge>
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
              sortedPosts.map((post) => <PostCard key={post.id} post={post} />)
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
              trendingPosts.map((post) => (
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
              recentPosts.map((post) => <PostCard key={post.id} post={post} />)
            ) : (
              <EmptyState message="최근 24시간 동안 작성된 게시물이 없습니다." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PostListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
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
