'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Clock } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/core/utils'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { TagBadge } from '@/components/shared/TagBadge'
import { PostStats } from '@/components/shared/PostStats'
import { getCategoryIcon } from '@/lib/post/display'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { Badge } from '@/components/ui/badge'
import type { MainPostFormatted } from '@/lib/post/types'

interface PostCardProps {
  post: MainPostFormatted
  className?: string
}

// PostCard 컴포넌트를 memo로 감싸서 props가 변경되지 않으면 리렌더링 방지
export const PostCard = memo(function PostCard({
  post,
  className,
}: PostCardProps) {
  const publishedDate = post.createdAt
  const formattedDate = formatDistanceToNow(new Date(publishedDate), {
    addSuffix: true,
    locale: ko,
  })

  // API에서 제공된 readingTime 사용, 없으면 직접 계산
  const readingTime = useMemo(() => {
    if (post.readingTime) return post.readingTime

    // 읽는 시간 계산 (한글: 분당 300자, 영문: 분당 250단어)
    const koreanCharCount = (post.content.match(/[가-힣]/g) || []).length
    const englishWordCount = (post.content.match(/[a-zA-Z]+/g) || []).length
    const otherCharCount =
      post.content.length - koreanCharCount - englishWordCount

    return Math.max(
      1,
      Math.ceil(
        koreanCharCount / 300 + englishWordCount / 250 + otherCharCount / 800
      )
    )
  }, [post.content, post.readingTime])

  return (
    <Card
      className={cn(
        'h-full hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Badge className="px-2 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-500 text-white">
                📌 고정
              </Badge>
            )}
            {post.category && (
              <CategoryBadge
                category={post.category}
                icon={getCategoryIcon(post.category.icon) || undefined}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 rounded-full border border-blue-200/50">
            <Clock className="size-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              예상 읽기시간 {readingTime}분
            </span>
          </div>
        </div>

        <Link href={`/main/posts/${post.id}`} className="group">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
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
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 font-semibold flex items-center">
                +{post.tags.length - 3}개 더
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <AuthorAvatar
            author={post.author}
            size="sm"
            showName
            showDate
            date={formattedDate}
            enableDropdown
          />

          <PostStats
            viewCount={post.viewCount}
            likeCount={post.likeCount || 0}
            commentCount={post.commentCount || 0}
            size="sm"
            variant="pill"
          />
        </div>
      </CardFooter>
    </Card>
  )
})
