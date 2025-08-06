'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Heart,
  Bookmark,
  MessageSquare,
  Eye,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  FileText,
  User,
} from 'lucide-react'
import { formatCount, getTextColor } from '@/lib/common-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { CommunityCommentSection } from './CommunityCommentSection'

interface Post {
  id: string
  title: string
  content: string
  viewCount: number
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  category: {
    id: string
    name: string
    color: string | null
  } | null
  community: {
    id: string
    name: string
    slug: string
  }
  _count: {
    comments: number
    likes: number
  }
  isLiked: boolean
  isBookmarked: boolean
  files: {
    id: string
    filename: string
    size: number
    mimeType: string
    url: string
  }[]
}

interface CommunityPostDetailProps {
  post: Post
  currentUserId?: string | undefined
}

export function CommunityPostDetail({
  post,
  currentUserId,
}: CommunityPostDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [isDeleting, setIsDeleting] = useState(false)

  // 좋아요 상태 조회
  const { data: isLiked = post.isLiked } = useQuery({
    queryKey: ['communityPostLike', post.community.id, post.id],
    queryFn: async () => {
      if (!currentUserId) return false
      const res = await fetch(
        `/api/communities/${post.community.id}/posts/${post.id}/like/status`
      )
      if (!res.ok) return false
      const data = await res.json()
      return data.isLiked || false
    },
    enabled: !!currentUserId,
    initialData: post.isLiked,
    staleTime: Infinity,
  })

  // 북마크 상태 조회
  const { data: isBookmarked = post.isBookmarked } = useQuery({
    queryKey: ['communityPostBookmark', post.community.id, post.id],
    queryFn: async () => {
      if (!currentUserId) return false
      const res = await fetch(
        `/api/communities/${post.community.id}/posts/${post.id}/bookmark/status`
      )
      if (!res.ok) return false
      const data = await res.json()
      return data.isBookmarked || false
    },
    enabled: !!currentUserId,
    initialData: post.isBookmarked,
    staleTime: Infinity,
  })

  const isAuthor = currentUserId === post.author.id

  // 조회수 증가 mutation
  const viewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/communities/${post.community.id}/posts/${post.id}/view`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error('Failed to increment view')
      return res.json()
    },
  })

  // 조회수 증가 (Redis 버퍼링)
  useEffect(() => {
    viewMutation.mutate()
  }, [viewMutation])

  // 좋아요 토글 mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/communities/${post.community.id}/posts/${post.id}/like`,
        {
          method: isLiked ? 'DELETE' : 'POST',
        }
      )
      if (!res.ok) throw new Error('좋아요 처리 실패')
      return res.json()
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['communityPostLike', post.community.id, post.id],
      })
      const previousLike = queryClient.getQueryData([
        'communityPostLike',
        post.community.id,
        post.id,
      ])

      queryClient.setQueryData(
        ['communityPostLike', post.community.id, post.id],
        !isLiked
      )
      setLikeCount((prev) => (!isLiked ? prev + 1 : prev - 1))

      return { previousLike }
    },
    onError: (err, variables, context) => {
      if (context?.previousLike !== undefined) {
        queryClient.setQueryData(
          ['communityPostLike', post.community.id, post.id],
          context.previousLike
        )
        setLikeCount((prev) => (context.previousLike ? prev : prev - 1))
      }
      toast.error('좋아요 처리에 실패했습니다.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['communityPostLike', post.community.id, post.id],
      })
    },
  })

  const handleLike = () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }
    likeMutation.mutate()
  }

  // 북마크 토글 mutation
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/communities/${post.community.id}/posts/${post.id}/bookmark`,
        {
          method: isBookmarked ? 'DELETE' : 'POST',
        }
      )
      if (!res.ok) throw new Error('북마크 처리 실패')
      return res.json()
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['communityPostBookmark', post.community.id, post.id],
      })
      const previousBookmark = queryClient.getQueryData([
        'communityPostBookmark',
        post.community.id,
        post.id,
      ])

      queryClient.setQueryData(
        ['communityPostBookmark', post.community.id, post.id],
        !isBookmarked
      )

      return { previousBookmark }
    },
    onError: (err, variables, context) => {
      if (context?.previousBookmark !== undefined) {
        queryClient.setQueryData(
          ['communityPostBookmark', post.community.id, post.id],
          context.previousBookmark
        )
      }
      toast.error('북마크 처리에 실패했습니다.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['communityPostBookmark', post.community.id, post.id],
      })
      toast.success(
        !isBookmarked ? '북마크에 저장되었습니다.' : '북마크가 해제되었습니다.'
      )
    },
  })

  const handleBookmark = () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }
    bookmarkMutation.mutate()
  }

  // 게시글 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/communities/${post.community.id}/posts/${post.id}`,
        {
          method: 'DELETE',
        }
      )
      if (!res.ok) throw new Error('삭제 실패')
      return res.json()
    },
    onMutate: () => {
      setIsDeleting(true)
    },
    onError: (error) => {
      console.error('Failed to delete post:', error)
      toast.error('게시글 삭제에 실패했습니다.')
      setIsDeleting(false)
    },
    onSuccess: () => {
      toast.success('게시글이 삭제되었습니다.')
      // 게시글 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityPosts', post.community.id],
      })
      router.push(`/communities/${post.community.slug}/posts`)
    },
  })

  const handleDelete = () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }
    deleteMutation.mutate()
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('링크가 복사되었습니다.')
    } catch (error) {
      console.error('Failed to share post:', error)
      toast.error('링크 복사에 실패했습니다.')
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="space-y-4">
            {/* Category and Title */}
            <div>
              {post.category && (
                <Badge
                  variant="secondary"
                  className="mb-3 border-2 font-bold"
                  style={{
                    backgroundColor: post.category.color || '#6366f1',
                    color: getTextColor(post.category.color || '#6366f1'),
                    borderColor: post.category.color || '#6366f1',
                    boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
                  }}
                >
                  {post.category.name}
                </Badge>
              )}
              <h1 className="text-3xl font-black mb-4">{post.title}</h1>
            </div>

            {/* Author Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-black">
                  <AvatarImage src={post.author.image || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {post.author.image
                      ? null
                      : post.author.name?.[0]?.toUpperCase() ||
                        post.author.email?.[0]?.toUpperCase() || (
                          <User className="h-5 w-5" />
                        )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{post.author.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/communities/${post.community.slug}/posts/${post.id}/edit`}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          수정
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? '삭제중...' : '삭제'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatCount(post.viewCount)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {formatCount(likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {formatCount(post._count.comments)}
              </span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{post.content}</div>
          </div>

          {/* Files */}
          {post.files.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h3 className="font-bold text-sm mb-3">첨부파일</h3>
                {post.files.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/download?url=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.filename)}`}
                    className="flex items-center gap-3 p-3 rounded-lg border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                <Heart
                  className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`}
                />
                {isLiked ? '좋아요 취소' : '좋아요'}
              </Button>
              <Button
                variant={isBookmarked ? 'default' : 'outline'}
                size="sm"
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                <Bookmark
                  className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`}
                />
                {isBookmarked ? '북마크 해제' : '북마크'}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              공유
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <CommunityCommentSection
        postId={post.id}
        communityId={post.community.id}
        currentUserId={currentUserId}
      />
    </div>
  )
}
