'use client'

import { useState } from 'react'
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
import type { Post } from '@/lib/types'

interface PostListProps {
  initialPosts?: Post[]
  isLoading?: boolean
}

export function PostList({
  initialPosts = [],
  isLoading = false,
}: PostListProps) {
  const [sortBy, setSortBy] = useState('latest')
  const [posts] = useState<Post[]>(initialPosts)

  // 정렬된 게시물 목록
  const sortedPosts = [...posts].sort((a, b) => {
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
    (post) => post.viewCount > 100 || (post._count?.postLikes || 0) > 10
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">게시물</h2>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">최신순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
            <SelectItem value="discussed">토론 많은 순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="trending">트렌딩</TabsTrigger>
          <TabsTrigger value="recent">최근 24시간</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-4">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-6 space-y-4">
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState message="아직 트렌딩 게시물이 없습니다." />
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6 space-y-4">
          {recentPosts.length > 0 ? (
            recentPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyState message="최근 24시간 동안 작성된 게시물이 없습니다." />
          )}
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
