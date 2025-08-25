'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  lazy,
  Suspense,
} from 'react'
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
import { formatCount, getTextColor } from '@/lib/common/types'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'
import ShareModal from '@/components/posts/ShareModal'
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
import { useSession } from 'next-auth/react'
import type { UnifiedPostDetail as UnifiedPostDetailType } from '@/lib/post/display'
import { apiClient } from '@/lib/api/client'

// Lazy load MobileRelatedSection for better performance
const MobileRelatedSection = lazy(
  () => import('@/components/posts/MobileRelatedSection')
)

interface UnifiedPostDetailProps {
  post: UnifiedPostDetailType
  postType?: 'main' | 'community'
  currentUserId?: string
}

export function UnifiedPostDetail({
  post,
  postType = 'main',
  currentUserId,
}: UnifiedPostDetailProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [likeCount, setLikeCount] = useState(
    post.likeCount || post._count?.likes || 0
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessingLike, setIsProcessingLike] = useState(false)
  const [isProcessingBookmark, setIsProcessingBookmark] = useState(false)
  const likeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bookmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (likeTimeoutRef.current) {
        clearTimeout(likeTimeoutRef.current)
      }
      if (bookmarkTimeoutRef.current) {
        clearTimeout(bookmarkTimeoutRef.current)
      }
    }
  }, [])

  const effectiveUserId = currentUserId || session?.user?.id
  const isAuthor = effectiveUserId === post.author.id
  const isCommunityPost = postType === 'community' || !!post.community

  // API 경로 결정
  const apiBasePath =
    isCommunityPost && post.community
      ? `/api/communities/${post.community.id}/posts/${post.id}`
      : `/api/main/posts/${post.id}`

  // 좋아요 상태 조회
  const { data: isLiked = post.isLiked || false } = useQuery({
    queryKey: [postType + 'PostLike', post.id],
    queryFn: async () => {
      if (!effectiveUserId) return false
      const endpoint = isCommunityPost
        ? `${apiBasePath}/like/status`
        : `${apiBasePath}/like`

      const response = await apiClient<{ isLiked?: boolean; liked?: boolean }>(
        endpoint
      )
      if (!response.success) return false
      return response.data?.isLiked || response.data?.liked || false
    },
    enabled: !!effectiveUserId,
    initialData: post.isLiked || false,
    staleTime: Infinity,
  })

  // 북마크 상태 조회
  const { data: isBookmarked = post.isBookmarked || false } = useQuery({
    queryKey: [postType + 'PostBookmark', post.id],
    queryFn: async () => {
      if (!effectiveUserId) return false
      const endpoint = isCommunityPost
        ? `${apiBasePath}/bookmark/status`
        : `${apiBasePath}/bookmark`

      const response = await apiClient<{
        isBookmarked?: boolean
        bookmarked?: boolean
      }>(endpoint)
      if (!response.success) return false
      return response.data?.isBookmarked || response.data?.bookmarked || false
    },
    enabled: !!effectiveUserId,
    initialData: post.isBookmarked || false,
    staleTime: Infinity,
  })

  // 조회수 증가
  useEffect(() => {
    const incrementView = async () => {
      // CSRF 토큰 가져오기
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf-token='))
        ?.split('=')[1]

      await fetch(`${apiBasePath}/view`, {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken || '',
        },
      })
    }
    incrementView()
  }, [apiBasePath])

  // 좋아요 토글
  const likeMutation = useMutation({
    mutationFn: async () => {
      const method = isCommunityPost ? (isLiked ? 'DELETE' : 'POST') : 'POST'
      const response = await apiClient(`${apiBasePath}/like`, { method })
      if (!response.success) throw new Error('좋아요 처리 실패')
      return response.data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [postType + 'PostLike', post.id],
      })
      const previousLike = queryClient.getQueryData([
        postType + 'PostLike',
        post.id,
      ])

      queryClient.setQueryData([postType + 'PostLike', post.id], !isLiked)
      setLikeCount((prev) => (!isLiked ? prev + 1 : prev - 1))

      return { previousLike }
    },
    onError: (err, variables, context) => {
      if (context?.previousLike !== undefined) {
        queryClient.setQueryData(
          [postType + 'PostLike', post.id],
          context.previousLike
        )
        setLikeCount((prev) => (context.previousLike ? prev : prev - 1))
      }
      toast.error('좋아요 처리에 실패했습니다.')
    },
    onSuccess: () => {
      // 딜레이를 주어 낙관적 UI 유지
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [postType + 'PostLike', post.id],
          refetchType: 'none', // 자동 refetch 방지
        })
      }, 500) // 500ms 딜레이 (좋아요는 빠른 피드백 필요)
    },
  })

  const handleLike = useCallback(() => {
    if (!effectiveUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }

    // 중복 클릭 방지
    if (isProcessingLike) return

    // debounce 처리 (300ms)
    if (likeTimeoutRef.current) {
      clearTimeout(likeTimeoutRef.current)
    }

    setIsProcessingLike(true)

    likeTimeoutRef.current = setTimeout(() => {
      likeMutation.mutate(undefined, {
        onSettled: () => {
          setIsProcessingLike(false)
        },
      })
    }, 300)
  }, [effectiveUserId, isProcessingLike, likeMutation])

  // 북마크 토글
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const method = isCommunityPost
        ? isBookmarked
          ? 'DELETE'
          : 'POST'
        : 'POST'
      const response = await apiClient(`${apiBasePath}/bookmark`, { method })
      if (!response.success) throw new Error('북마크 처리 실패')
      return response.data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [postType + 'PostBookmark', post.id],
      })
      const previousBookmark = queryClient.getQueryData([
        postType + 'PostBookmark',
        post.id,
      ])

      queryClient.setQueryData(
        [postType + 'PostBookmark', post.id],
        !isBookmarked
      )

      return { previousBookmark }
    },
    onError: (err, variables, context) => {
      if (context?.previousBookmark !== undefined) {
        queryClient.setQueryData(
          [postType + 'PostBookmark', post.id],
          context.previousBookmark
        )
      }
      toast.error('북마크 처리에 실패했습니다.')
    },
    onSuccess: () => {
      toast.success(
        !isBookmarked ? '북마크에 저장되었습니다.' : '북마크가 해제되었습니다.'
      )
      // 딜레이를 주어 낙관적 UI 유지
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [postType + 'PostBookmark', post.id],
          refetchType: 'none', // 자동 refetch 방지
        })
      }, 500) // 500ms 딜레이
    },
  })

  const handleBookmark = useCallback(() => {
    if (!effectiveUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }

    // 중복 클릭 방지
    if (isProcessingBookmark) return

    // debounce 처리 (300ms)
    if (bookmarkTimeoutRef.current) {
      clearTimeout(bookmarkTimeoutRef.current)
    }

    setIsProcessingBookmark(true)

    bookmarkTimeoutRef.current = setTimeout(() => {
      bookmarkMutation.mutate(undefined, {
        onSettled: () => {
          setIsProcessingBookmark(false)
        },
      })
    }, 300)
  }, [effectiveUserId, isProcessingBookmark, bookmarkMutation])

  // 게시글 삭제 (낙관적 UI)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient(apiBasePath, { method: 'DELETE' })
      if (!response.success) throw new Error('삭제 실패')
      return response.data
    },
    onMutate: async () => {
      // 낙관적 업데이트를 위한 준비
      setIsDeleting(true)

      // usePostQuery.ts의 정확한 쿼리 키 패턴 사용
      // mainPosts는 ['posts', 'main', params] 형태
      // communityPosts는 ['posts', 'community', communityId, params] 형태
      const queryKeyPattern = isCommunityPost
        ? ['posts', 'community']
        : ['posts', 'main']

      // 모든 관련 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: queryKeyPattern,
        exact: false,
      })

      // 모든 관련 쿼리의 이전 데이터 백업
      const previousQueries = new Map()
      const queries = queryClient.getQueryCache().findAll({
        queryKey: queryKeyPattern,
        exact: false,
      })

      queries.forEach((query) => {
        previousQueries.set(query.queryKey, query.state.data)
      })

      // 모든 관련 쿼리에서 해당 게시글 즉시 제거 (낙관적 UI)
      queries.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (old: unknown) => {
          if (!old) return old

          // useMainPosts/useCommunityPosts의 응답 형태
          // PostListResponse: { success: true, data: { items: [...], pageInfo: {...} } }
          if (typeof old === 'object' && old !== null) {
            const response = old as {
              data?: {
                items?: Array<{ id: string }>
                pageInfo?: { total?: number }
              }
              items?: Array<{ id: string }>
            }

            // data.items 구조인 경우 (목록 페이지)
            if (response.data?.items && Array.isArray(response.data.items)) {
              return {
                ...response,
                data: {
                  ...response.data,
                  items: response.data.items.filter((p) => p.id !== post.id),
                  pageInfo: {
                    ...response.data.pageInfo,
                    total: Math.max(
                      0,
                      (response.data.pageInfo?.total || 0) - 1
                    ),
                  },
                },
              }
            }

            // 직접 items 배열인 경우
            if (response.items && Array.isArray(response.items)) {
              return {
                ...response,
                items: response.items.filter((p) => p.id !== post.id),
              }
            }
          }

          // 직접 배열인 경우 (트렌딩, 최근 게시글 등)
          if (Array.isArray(old)) {
            return old.filter((p: { id: string }) => p.id !== post.id)
          }

          return old
        })
      })

      // 리다이렉트 URL 준비
      const redirectUrl = post.community
        ? `/communities/${post.community.id}/posts`
        : '/main/posts'

      // 토스트 메시지 표시
      toast.success('게시글이 삭제되었습니다.')

      // 즉시 리다이렉트 (낙관적 UI가 이미 적용됨)
      router.push(redirectUrl)

      return { previousQueries }
    },
    onError: (error, variables, context) => {
      console.error('Failed to delete post:', error)

      // 롤백 - 모든 백업된 쿼리 복원
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data)
        })
      }

      toast.error('게시글 삭제에 실패했습니다.')
      setIsDeleting(false)
    },
    onSuccess: () => {
      // 백그라운드에서 캐시 새로고침 (사용자가 목록 페이지에 있을 때를 위해)
      // refetchType: 'active'로 현재 보이는 쿼리만 새로고침
      setTimeout(() => {
        const queryKeyPattern = isCommunityPost
          ? ['posts', 'community']
          : ['posts', 'main']

        queryClient.invalidateQueries({
          queryKey: queryKeyPattern,
          exact: false,
          refetchType: 'active', // 현재 활성화된 쿼리만 refetch
        })
      }, 500) // 500ms 딜레이
    },
    onSettled: () => {
      // 최종 정리
      setIsDeleting(false)
    },
  })

  const handleDelete = () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }
    deleteMutation.mutate()
  }

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')

  // 클라이언트 사이드에서만 URL 설정
  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  // HTML 내 이미지를 최적화 (lazy loading, WebP 포맷 힌트 추가)
  const optimizeImagesInContent = (html: string) => {
    // img 태그에 loading="lazy" 추가
    return html.replace(
      /<img([^>]*?)(?<!loading=["'][^"']*["'])([^>]*?)>/gi,
      '<img$1 loading="lazy"$2>'
    )
  }

  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] lg:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] !py-0">
        <CardContent className="p-4 sm:p-6 md:p-8">
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
                    {useMemo(
                      () =>
                        formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        }),
                      [post.createdAt]
                    )}
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
                          href={
                            post.community
                              ? `/communities/${post.community.id}/posts/${post.id}/edit`
                              : `/main/posts/${post.id}/edit`
                          }
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
                {formatCount(post.commentCount || post._count?.comments || 0)}
              </span>
            </div>

            {/* Tags (메인 게시글만) */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color || '#808080',
                      color: getTextColor(tag.color || '#808080'),
                      borderColor: tag.color || '#808080',
                      boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.2)',
                    }}
                    className="text-xs border-2 font-bold"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Content */}
          <div
            className="prose prose-sm max-w-none overflow-x-hidden [&_p]:my-6 [&_p]:leading-relaxed [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-8 [&_h1]:leading-tight [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-6 [&_h2]:leading-tight [&_h3]:text-lg [&_h3]:font-bold [&_h3]:my-5 [&_h3]:leading-tight [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-6 [&_li]:my-2 [&_li]:leading-relaxed [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6 [&_code]:px-1 [&_code]:py-0.5 [&_code]:bg-gray-100 [&_code]:text-red-600 [&_code]:rounded [&_code]:text-sm [&_code]:break-words [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:max-w-full [&_pre_code]:bg-transparent [&_pre_code]:text-gray-100 [&_pre_code]:p-0 [&_strong]:font-bold [&_em]:italic [&_a]:text-blue-600 [&_a]:underline [&_a]:break-all [&_a:hover]:text-blue-800 [&_table]:w-full [&_table]:border-collapse [&_table]:my-6 [&_table]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_thead]:bg-gray-50 [&_thead]:border-b-2 [&_thead]:border-gray-200 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-gray-900 [&_th]:border [&_th]:border-gray-200 [&_td]:px-4 [&_td]:py-3 [&_td]:border [&_td]:border-gray-200 [&_tbody_tr]:bg-white [&_tbody_tr:hover]:bg-gray-50 [&_tbody_tr]:transition-colors"
            dangerouslySetInnerHTML={{
              __html: optimizeImagesInContent(post.content),
            }}
          />

          {/* Files (커뮤니티 게시글만) */}
          {post.files && post.files.length > 0 && (
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
                disabled={likeMutation.isPending || isProcessingLike}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                {likeMutation.isPending || isProcessingLike ? (
                  <ButtonSpinner />
                ) : (
                  <Heart
                    className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`}
                  />
                )}
                {isLiked ? '좋아요 취소' : '좋아요'}
              </Button>
              <Button
                variant={isBookmarked ? 'default' : 'outline'}
                size="sm"
                onClick={handleBookmark}
                disabled={bookmarkMutation.isPending || isProcessingBookmark}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
              >
                {bookmarkMutation.isPending || isProcessingBookmark ? (
                  <ButtonSpinner />
                ) : (
                  <Bookmark
                    className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`}
                  />
                )}
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

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        url={currentUrl}
        title={post.title}
      />

      {/* Mobile Related Section - Only show on mobile for main posts */}
      {postType === 'main' && (
        <div className="lg:hidden">
          <Suspense
            fallback={
              <div className="mt-8 space-y-4">
                <div className="h-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-32 bg-gray-200 rounded animate-pulse" />
              </div>
            }
          >
            <MobileRelatedSection postId={post.id} />
          </Suspense>
        </div>
      )}
    </div>
  )
}
