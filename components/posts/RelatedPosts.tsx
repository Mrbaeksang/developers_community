'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, Heart, MessageSquare, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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

interface RelatedPostsProps {
  postId: string
}

export default function RelatedPosts({ postId }: RelatedPostsProps) {
  const [posts, setPosts] = useState<RelatedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        const res = await fetch(`/api/main/posts/${postId}/related?limit=5`)
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts)
        }
      } catch (error) {
        console.error('Failed to fetch related posts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedPosts()
  }, [postId])

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          관련 게시글
        </h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return null
  }

  return (
    <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        관련 게시글
      </h3>
      <div className="space-y-4">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/main/posts/${post.id}`}
            className="block group"
          >
            <article className="border-2 border-black rounded-lg p-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
              <Badge
                className="mb-2 border-2 border-black font-bold text-xs"
                style={{
                  backgroundColor: post.category.color,
                  color: 'white',
                }}
              >
                {post.category.name}
              </Badge>
              <h4 className="font-bold text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {post.title}
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6 border border-black">
                  <AvatarImage src={post.author.image || undefined} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {post.author.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {post.author.name || 'Unknown'}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {post.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {post.commentCount}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}