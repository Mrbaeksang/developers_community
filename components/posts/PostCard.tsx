'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MessageSquare, Heart, Eye, Clock } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

interface PostCardProps {
  post: Post
  className?: string
}

const postTypeMap = {
  ARTICLE: { label: '아티클', color: 'bg-blue-500/10 text-blue-600' },
  QUESTION: { label: 'Q&A', color: 'bg-green-500/10 text-green-600' },
  DISCUSSION: { label: '토론', color: 'bg-purple-500/10 text-purple-600' },
  TUTORIAL: { label: '튜토리얼', color: 'bg-orange-500/10 text-orange-600' },
  NEWS: { label: '뉴스', color: 'bg-red-500/10 text-red-600' },
}

export function PostCard({ post, className }: PostCardProps) {
  const postType = post.type ? postTypeMap[post.type] : postTypeMap.ARTICLE
  const publishedDate = post.createdAt
  const formattedDate = formatDistanceToNow(new Date(publishedDate), {
    addSuffix: true,
    locale: ko,
  })

  // 읽는 시간 계산 (대략 분당 200단어)
  const readingTime = Math.max(1, Math.ceil(post.content.length / 1000))

  return (
    <Card className={cn('h-full hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <Badge className={cn('px-2 py-0.5 text-xs', postType.color)}>
            {postType.label}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>{readingTime}분</span>
          </div>
        </div>

        <Link href={`/main/posts/${post.id}`} className="group">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="pb-3">
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {post.excerpt}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((postTag) => (
              <span
                key={postTag.tag.id}
                className="text-xs px-2 py-0.5 rounded-md bg-secondary"
              >
                #{postTag.tag.name}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-muted-foreground px-1">
                +{post.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback>
                {post.author.name?.[0] || post.author.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium line-clamp-1">
                {post.author.name || '익명'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="size-4" />
              <span>{post.viewCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="size-4" />
              <span>{post._count?.likes || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="size-4" />
              <span>{post._count?.comments || 0}</span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
