'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, Eye, MessageCircle, Heart, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Post {
  id: string
  title: string
  excerpt: string
  viewCount: number
  createdAt: string
  isPinned?: boolean
  author: {
    id: string
    name: string | null
    image: string | null
  }
  category: {
    id: string
    name: string
    slug: string
  }
  _count: {
    comments: number
    likes: number
  }
}

export function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentPosts()
  }, [])

  const fetchRecentPosts = async () => {
    try {
      // 메인 사이트의 모든 카테고리 게시글 가져오기 (커뮤니티 글 제외)
      const response = await fetch('/api/main/posts?limit=10&sort=latest')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setPosts(data.posts)
    } catch (error) {
      console.error('Failed to fetch recent posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="border-b-2 border-black bg-blue-50">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="text-xl font-bold">최근 게시글</h2>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader className="border-b-2 border-black bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="text-xl font-bold">최근 게시글</h2>
          </div>
          <Link
            href="/main/posts"
            className="text-sm font-bold hover:underline"
          >
            전체보기 →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {posts.slice(0, 5).map((post) => (
            <article
              key={post.id}
              className="group border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              <Link href={`/main/posts/${post.id}`}>
                <div className="flex items-center gap-2 mb-2">
                  {post.isPinned && (
                    <Badge className="text-xs bg-yellow-500 text-white">
                      📌
                    </Badge>
                  )}
                  <Badge
                    variant={
                      post.category.slug === 'free' ? 'default' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {post.category.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.author.name || '익명'} ·
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
                <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {post.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post._count.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post._count.likes}
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Button asChild variant="outline" className="group">
            <Link href="/main/posts">
              모든 게시글 보기
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
