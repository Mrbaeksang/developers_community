'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, Heart, MessageSquare, Bookmark, Share2, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'
import ShareModal from './ShareModal'
import { formatCount, getTextColor } from '@/lib/post-format-utils'

interface PostDetailProps {
  post: {
    id: string
    title: string
    content: string
    excerpt?: string | null
    status?: string
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
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [showShareModal, setShowShareModal] = useState(false)
  const { toast } = useToast()
  const { status } = useSession()
  const router = useRouter()

  // 로그인한 경우 좋아요/북마크 상태 확인
  useEffect(() => {
    if (status === 'authenticated') {
      // 좋아요 상태 확인
      fetch(`/api/main/posts/${post.id}/like`)
        .then((res) => res.json())
        .then((data) => setIsLiked(data.liked))
        .catch(console.error)

      // 북마크 상태 확인
      fetch(`/api/main/posts/${post.id}/bookmark`)
        .then((res) => res.json())
        .then((data) => setIsBookmarked(data.bookmarked))
        .catch(console.error)
    }
  }, [status, post.id])

  // 조회수 증가 (Redis 버퍼링)
  useEffect(() => {
    // 조회수 증가 API 호출
    fetch(`/api/main/posts/${post.id}/view`, {
      method: 'POST',
    }).catch(console.error)
  }, [post.id])

  const handleLike = async () => {
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '좋아요를 누르려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/signin')
      return
    }

    try {
      const res = await fetch(`/api/main/posts/${post.id}/like`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to toggle like')

      const data = await res.json()
      setIsLiked(data.liked)
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))

      toast({
        title: data.liked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다',
      })
    } catch (error) {
      console.error('Failed to toggle like:', error)
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    }
  }

  const handleBookmark = async () => {
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '북마크에 저장하려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/signin')
      return
    }

    try {
      const res = await fetch(`/api/main/posts/${post.id}/bookmark`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to toggle bookmark')

      const data = await res.json()
      setIsBookmarked(data.bookmarked)

      toast({
        title: data.bookmarked
          ? '북마크에 저장했습니다'
          : '북마크를 취소했습니다',
      })
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    }
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  return (
    <article className="bg-card rounded-lg p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="secondary"
            style={{
              backgroundColor: post.category.color,
              color: getTextColor(post.category.color),
              borderColor: post.category.color,
              boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
            }}
            className="border-2 font-bold"
          >
            {post.category.name}
          </Badge>
          {post.status && post.status !== 'PUBLISHED' && (
            <Badge
              variant={post.status === 'DRAFT' ? 'outline' : 'default'}
              className={
                post.status === 'DRAFT'
                  ? 'border-gray-500'
                  : 'bg-yellow-500 text-white'
              }
            >
              {post.status === 'DRAFT' ? '📝 초안' : '⏳ 검토 대기중'}
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10 border-2 border-black">
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {post.author.image
                    ? null
                    : post.author.name?.[0]?.toUpperCase() ||
                      post.author.username?.[0]?.toUpperCase() || (
                        <User className="h-5 w-5" />
                      )}
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
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{formatCount(post.viewCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{formatCount(likeCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{formatCount(post._count.comments)}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{
                  backgroundColor: tag.color,
                  color: getTextColor(tag.color),
                  borderColor: tag.color,
                  boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
                }}
                className="text-xs border-2 font-bold"
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Separator className="my-6" />

      {/* Content */}
      <div
        className="prose prose-sm dark:prose-invert max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <Separator className="my-6" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant={isLiked ? 'default' : 'outline'}
          size="sm"
          onClick={handleLike}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
          좋아요 {likeCount > 0 && `(${formatCount(likeCount)})`}
        </Button>
        <Button
          variant={isBookmarked ? 'default' : 'outline'}
          size="sm"
          onClick={handleBookmark}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <Bookmark
            className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`}
          />
          북마크
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <Share2 className="h-4 w-4 mr-2" />
          공유
        </Button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={post.title}
      />
    </article>
  )
}
