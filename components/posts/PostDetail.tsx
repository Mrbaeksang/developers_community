'use client'

import { useRouter } from 'next/navigation'
import { formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Eye, Heart, MessageSquare, Bookmark, Share2, User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'
import ShareModal from './ShareModal'
import { formatCount, getTextColor } from '@/lib/post-format-utils'
import { apiClient } from '@/lib/api'

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
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)
  const [showShareModal, setShowShareModal] = useState(false)
  const { toast } = useToast()
  const { status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // 좋아요 상태 확인
  const { data: likeData } = useQuery({
    queryKey: ['postLike', post.id],
    queryFn: async () => {
      const response = await apiClient<{ liked: boolean }>(
        `/api/main/posts/${post.id}/like`
      )
      if (!response.success) throw new Error('Failed to fetch like status')
      return response.data?.liked || false
    },
    enabled: status === 'authenticated',
    staleTime: Infinity,
  })

  // 북마크 상태 확인
  const { data: bookmarkData } = useQuery({
    queryKey: ['postBookmark', post.id],
    queryFn: async () => {
      const response = await apiClient<{ bookmarked: boolean }>(
        `/api/main/posts/${post.id}/bookmark`
      )
      if (!response.success) throw new Error('Failed to fetch bookmark status')
      return response.data?.bookmarked || false
    },
    enabled: status === 'authenticated',
    staleTime: Infinity,
  })

  const isLiked = likeData || false
  const isBookmarked = bookmarkData || false

  // 조회수 증가 mutation
  const viewMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient(`/api/main/posts/${post.id}/view`, {
        method: 'POST',
      })
      if (!response.success)
        throw new Error(response.error || 'Failed to increment view')
      return response.data
    },
  })

  // 조회수 증가 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    viewMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 빈 dependency array로 마운트 시에만 실행

  // 좋아요 토글 mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient(`/api/main/posts/${post.id}/like`, {
        method: 'POST',
      })
      if (!response.success)
        throw new Error(response.error || 'Failed to toggle like')
      return response.data
    },
    onMutate: async () => {
      // 캐시 업데이트 전에 현재 상태 백업
      await queryClient.cancelQueries({ queryKey: ['postLike', post.id] })
      const previousLike = queryClient.getQueryData(['postLike', post.id])

      // Optimistic update
      queryClient.setQueryData(['postLike', post.id], !isLiked)
      setLikeCount((prev) => (!isLiked ? prev + 1 : prev - 1))

      return { previousLike }
    },
    onError: (err, variables, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousLike !== undefined) {
        queryClient.setQueryData(['postLike', post.id], context.previousLike)
        setLikeCount((prev) => (context.previousLike ? prev : prev - 1))
      }
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    },
    onSuccess: (data) => {
      // 서버 응답으로 최종 상태 업데이트
      if (data && typeof data === 'object' && 'liked' in data) {
        queryClient.setQueryData(['postLike', post.id], data.liked)
        setLikeCount((prev) => {
          const currentIsLiked = queryClient.getQueryData(['postLike', post.id])
          return currentIsLiked ? prev : prev - 1
        })
        toast({
          title: data.liked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다',
        })
      }
    },
  })

  const handleLike = () => {
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '좋아요를 누르려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/auth/signin')
      return
    }

    likeMutation.mutate()
  }

  // 북마크 토글 mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient(`/api/main/posts/${post.id}/bookmark`, {
        method: 'POST',
      })
      if (!response.success)
        throw new Error(response.error || 'Failed to toggle bookmark')
      return response.data
    },
    onMutate: async () => {
      // 캐시 업데이트 전에 현재 상태 백업
      await queryClient.cancelQueries({ queryKey: ['postBookmark', post.id] })
      const previousBookmark = queryClient.getQueryData([
        'postBookmark',
        post.id,
      ])

      // Optimistic update
      queryClient.setQueryData(['postBookmark', post.id], !isBookmarked)

      return { previousBookmark }
    },
    onError: (err, variables, context) => {
      // 에러 시 이전 상태로 롤백
      if (context?.previousBookmark !== undefined) {
        queryClient.setQueryData(
          ['postBookmark', post.id],
          context.previousBookmark
        )
      }
      toast({
        title: '오류가 발생했습니다',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      })
    },
    onSuccess: (data) => {
      // 서버 응답으로 최종 상태 업데이트
      if (data && typeof data === 'object' && 'bookmarked' in data) {
        queryClient.setQueryData(['postBookmark', post.id], data.bookmarked)
        toast({
          title: data.bookmarked
            ? '북마크에 저장했습니다'
            : '북마크를 취소했습니다',
        })
      }
    },
  })

  const handleBookmark = () => {
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '북마크에 저장하려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/auth/signin')
      return
    }

    bookmarkMutation.mutate()
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
              backgroundColor: post.category?.color || '#e5e7eb',
              color: getTextColor(post.category?.color || '#e5e7eb'),
              borderColor: post.category?.color || '#e5e7eb',
              boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
            }}
            className="border-2 font-bold"
          >
            {post.category?.name || '미분류'}
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
                <AvatarImage src={post.author?.image || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {post.author?.image
                    ? null
                    : post.author?.name?.[0]?.toUpperCase() ||
                      post.author?.username?.[0]?.toUpperCase() || (
                        <User className="h-5 w-5" />
                      )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {post.author?.name || post.author?.username || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    try {
                      const date =
                        typeof post.createdAt === 'string'
                          ? parseISO(post.createdAt)
                          : new Date(post.createdAt)

                      if (!isValid(date)) {
                        return '날짜 정보 없음'
                      }

                      return formatDistanceToNow(date, {
                        addSuffix: true,
                        locale: ko,
                      })
                    } catch (error) {
                      console.error('Date formatting error:', error)
                      return '날짜 정보 없음'
                    }
                  })()}
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
