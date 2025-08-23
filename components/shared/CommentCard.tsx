'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  MessageSquare,
  Heart,
  MessageCircle,
  Pin,
  Edit,
  MoreVertical,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/core/utils'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { formatCount } from '@/lib/common/types'
import { getCategoryIcon } from '@/lib/post/display'
import type { CommentFormatted } from '@/lib/comment/types'

interface CommentCardProps {
  comment: CommentFormatted
  showPost?: boolean
  showAuthor?: boolean
  variant?: 'default' | 'compact' | 'minimal'
  className?: string
  onReply?: (commentId: string) => void
  onLike?: (commentId: string) => void
  onEdit?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  currentUserId?: string
}

// CommentCard를 memo로 감싸서 최적화
export const CommentCard = memo(function CommentCard({
  comment,
  showPost = false,
  showAuthor = true,
  variant = 'default',
  className,
  onReply,
  onLike,
  onEdit,
  onDelete,
  currentUserId,
}: CommentCardProps) {
  // 날짜 포맷팅 최적화
  const formattedDate = useMemo(() => {
    return formatDistanceToNow(new Date(comment.createdAt), {
      addSuffix: true,
      locale: ko,
    })
  }, [comment.createdAt])

  // 게시글 링크 생성
  const postHref = useMemo(() => {
    if (!comment.post) return '#'

    return comment.post.type === 'COMMUNITY'
      ? `/communities/${comment.post.communityId}/posts/${comment.post.id}`
      : `/main/posts/${comment.post.id}`
  }, [comment.post])

  // 작성자 본인 여부 확인
  const isAuthor = currentUserId && comment.author?.id === currentUserId

  // Minimal variant - 가장 간단한 형태
  if (variant === 'minimal') {
    return (
      <div
        className={cn('py-2 border-b last:border-0 overflow-hidden', className)}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          {showAuthor && comment.author && (
            <AuthorAvatar author={comment.author} size="xs" showName={false} />
          )}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
              {showAuthor && comment.author && (
                <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                  {comment.author.name || '익명'}
                </span>
              )}
              <span
                className="text-xs text-muted-foreground whitespace-nowrap"
                suppressHydrationWarning
              >
                {formattedDate}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground">(수정됨)</span>
              )}
            </div>
            <div
              className="text-sm text-gray-700 break-words overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Compact variant - 목록용
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all',
          'bg-white overflow-hidden',
          className
        )}
      >
        <Link href={postHref} className="block">
          <CardContent className="p-3 sm:p-4 space-y-2">
            {/* 게시글 정보 */}
            {showPost && comment.post && (
              <div className="flex items-start sm:items-center gap-2 flex-wrap sm:flex-nowrap">
                <Badge
                  variant="outline"
                  className="border-2 border-black font-bold shrink-0 flex items-center gap-1 text-xs"
                  style={{
                    backgroundColor:
                      comment.post.type === 'COMMUNITY'
                        ? '#8B5CF6'
                        : comment.post.categoryColor || '#6366f1',
                    color: 'white',
                  }}
                >
                  {comment.post.type === 'MAIN' &&
                    comment.post.categoryIcon &&
                    (() => {
                      const CategoryIcon = getCategoryIcon(
                        comment.post.categoryIcon
                      )
                      return <CategoryIcon className="h-3 w-3" />
                    })()}
                  <span className="max-w-[80px] sm:max-w-none truncate">
                    {comment.post.type === 'COMMUNITY'
                      ? comment.post.communityName || '커뮤니티'
                      : comment.post.categoryName || '메인'}
                  </span>
                </Badge>
                <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                  {comment.post.title}
                </span>
              </div>
            )}

            {/* 댓글 내용 */}
            <div
              className="text-sm line-clamp-2 break-words"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />

            {/* 하단 정보 */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                {showAuthor && comment.author && (
                  <>
                    <AuthorAvatar
                      author={comment.author}
                      size="xs"
                      showName={false}
                    />
                    <span className="font-medium text-gray-700 truncate max-w-[100px] sm:max-w-none">
                      {comment.author.name || '익명'}
                    </span>
                  </>
                )}
                <span className="whitespace-nowrap" suppressHydrationWarning>
                  {formattedDate}
                </span>
              </div>

              {comment.stats && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                  {comment.stats.likeCount > 0 && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Heart className="h-3 w-3" />
                      {formatCount(comment.stats.likeCount)}
                    </span>
                  )}
                  {comment.stats.replyCount && comment.stats.replyCount > 0 && (
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <MessageCircle className="h-3 w-3" />
                      {formatCount(comment.stats.replyCount)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Link>
      </Card>
    )
  }

  // Default variant - 상세 보기용
  return (
    <Card
      className={cn(
        'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all',
        'bg-white overflow-hidden',
        className
      )}
    >
      <CardHeader className="p-3 sm:p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {showAuthor && comment.author && (
              <AuthorAvatar
                author={comment.author}
                size="sm"
                showName
                showDate
                date={formattedDate}
                enableDropdown={false}
              />
            )}

            {/* 배지들 */}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {comment.isPinned && (
                <Badge className="h-5 sm:h-6 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-500 text-white">
                  <Pin className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                  고정
                </Badge>
              )}
              {comment.isEdited && (
                <Badge
                  variant="outline"
                  className="h-5 sm:h-6 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs"
                >
                  <Edit className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-0.5 sm:mr-1" />
                  수정됨
                </Badge>
              )}
              {comment.author?.badge && (
                <Badge
                  variant="secondary"
                  className="h-5 sm:h-6 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold"
                >
                  {comment.author.badge}
                </Badge>
              )}
            </div>
          </div>

          {/* 더보기 메뉴 */}
          {isAuthor && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(comment.id)}>
                    수정
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 게시글 정보 */}
        {showPost && comment.post && (
          <Link
            href={postHref}
            className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <Badge
                variant="outline"
                className="border-2 border-black font-bold shrink-0 flex items-center gap-1 text-[10px] sm:text-xs"
                style={{
                  backgroundColor:
                    comment.post.type === 'COMMUNITY'
                      ? '#8B5CF6'
                      : comment.post.categoryColor || '#6366f1',
                  color: 'white',
                }}
              >
                {comment.post.type === 'MAIN' &&
                  comment.post.categoryIcon &&
                  (() => {
                    const CategoryIcon = getCategoryIcon(
                      comment.post.categoryIcon
                    )
                    return (
                      <CategoryIcon className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    )
                  })()}
                <span className="max-w-[60px] sm:max-w-none truncate">
                  {comment.post.type === 'COMMUNITY'
                    ? comment.post.communityName || '커뮤니티'
                    : comment.post.categoryName || '메인'}
                </span>
              </Badge>
              <span className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
                {comment.post.title}
              </span>
            </div>
          </Link>
        )}
      </CardHeader>

      <CardContent className="px-3 sm:px-4 pb-3">
        {/* 댓글 내용 */}
        <div
          className={cn(
            'text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words overflow-wrap-anywhere prose prose-sm max-w-none',
            comment.depth &&
              comment.depth > 0 &&
              'pl-3 sm:pl-4 border-l-2 border-gray-200'
          )}
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      </CardContent>

      {/* 액션 버튼들 */}
      {(onLike || onReply) && (
        <CardFooter className="px-3 sm:px-4 pt-2 sm:pt-3 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
            <div className="flex items-center gap-1 sm:gap-2">
              {onLike && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(comment.id)}
                  className={cn(
                    'h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-1.5 text-xs',
                    comment.stats?.isLiked && 'text-red-500'
                  )}
                >
                  <Heart
                    className={cn(
                      'h-3 sm:h-4 w-3 sm:w-4',
                      comment.stats?.isLiked && 'fill-current'
                    )}
                  />
                  <span className="font-medium">
                    {comment.stats?.likeCount
                      ? formatCount(comment.stats.likeCount)
                      : '좋아요'}
                  </span>
                </Button>
              )}

              {onReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReply(comment.id)}
                  className="h-7 sm:h-8 px-2 sm:px-3 gap-1 sm:gap-1.5 text-xs"
                >
                  <MessageCircle className="h-3 sm:h-4 w-3 sm:w-4" />
                  <span className="font-medium">
                    {comment.stats?.replyCount
                      ? `답글 ${formatCount(comment.stats.replyCount)}`
                      : '답글'}
                  </span>
                </Button>
              )}
            </div>

            {/* 통계 정보 */}
            {comment.stats &&
              (comment.stats.likeCount > 0 || comment.stats.replyCount) && (
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">
                    좋아요 {formatCount(comment.stats.likeCount || 0)}
                  </span>
                  {comment.stats.replyCount && comment.stats.replyCount > 0 && (
                    <span className="whitespace-nowrap">
                      답글 {formatCount(comment.stats.replyCount)}
                    </span>
                  )}
                </div>
              )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
})
