'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Calendar,
  Eye,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface PostDetailProps {
  post: {
    id: string
    title: string
    content: string
    excerpt?: string | null
    viewCount: number
    likeCount: number
    commentCount: number
    createdAt: string
    updatedAt: string
    author: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
    category: {
      id: string
      name: string
      slug: string
      color: string
    }
    tags: Array<{
      id: string
      name: string
      slug: string
      color: string
    }>
    _count: {
      comments: number
      likes: number
      bookmarks: number
    }
  }
}

export default function PostDetail({ post }: PostDetailProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const { toast } = useToast()

  const handleLike = async () => {
    // TODO: Implement like functionality
    setIsLiked(!isLiked)
    toast({
      title: isLiked ? '좋아요를 취소했습니다' : '좋아요를 눌렀습니다',
    })
  }

  const handleBookmark = async () => {
    // TODO: Implement bookmark functionality
    setIsBookmarked(!isBookmarked)
    toast({
      title: isBookmarked ? '북마크를 취소했습니다' : '북마크에 저장했습니다',
    })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: '링크가 복사되었습니다',
      })
    } catch (error) {
      toast({
        title: '링크 복사에 실패했습니다',
        variant: 'destructive',
      })
    }
  }

  return (
    <article className="bg-card rounded-lg p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/main/categories/${post.category.slug}`}>
            <Badge
              variant="secondary"
              style={{ backgroundColor: post.category.color }}
              className="text-white hover:opacity-80"
            >
              {post.category.name}
            </Badge>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${post.author.id}`}
              className="flex items-center gap-2 hover:opacity-80"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback>
                  {post.author.name?.[0] || post.author.username?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.author.name || post.author.username || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{post._count.likes.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post._count.comments.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/main/tags/${encodeURIComponent(tag.name)}`}
              >
                <Badge
                  variant="outline"
                  style={{ borderColor: tag.color, color: tag.color }}
                  className="hover:opacity-80"
                >
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <Separator className="my-6" />

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      <Separator className="my-6" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant={isLiked ? 'default' : 'outline'}
          size="sm"
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
          좋아요 {post._count.likes > 0 && `(${post._count.likes})`}
        </Button>
        <Button
          variant={isBookmarked ? 'default' : 'outline'}
          size="sm"
          onClick={handleBookmark}
        >
          <Bookmark
            className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`}
          />
          북마크
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          공유
        </Button>
      </div>
    </article>
  )
}
