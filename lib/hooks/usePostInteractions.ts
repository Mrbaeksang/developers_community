import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface UsePostInteractionsProps {
  postId: string
  postType: 'main' | 'community'
  communityId?: string
  initialLikeCount?: number
  initialIsLiked?: boolean
  initialIsBookmarked?: boolean
  currentUserId?: string
}

export function usePostInteractions({
  postId,
  postType,
  communityId,
  initialLikeCount = 0,
  initialIsLiked = false,
  initialIsBookmarked = false,
  currentUserId,
}: UsePostInteractionsProps) {
  const queryClient = useQueryClient()
  const [likeCount, setLikeCount] = useState(initialLikeCount)

  const isCommunityPost = postType === 'community'
  const apiBasePath =
    isCommunityPost && communityId
      ? `/api/communities/${communityId}/posts/${postId}`
      : `/api/main/posts/${postId}`

  // 좋아요 상태 조회
  const { data: isLiked = initialIsLiked } = useQuery({
    queryKey: [postType + 'PostLike', postId],
    queryFn: async () => {
      if (!currentUserId) return false
      const endpoint = isCommunityPost
        ? `${apiBasePath}/like/status`
        : `${apiBasePath}/like`

      const response = await apiClient<{ isLiked?: boolean; liked?: boolean }>(
        endpoint
      )
      if (!response.success) return false
      return response.data?.isLiked || response.data?.liked || false
    },
    enabled: !!currentUserId,
    initialData: initialIsLiked,
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 북마크 상태 조회
  const { data: isBookmarked = initialIsBookmarked } = useQuery({
    queryKey: [postType + 'PostBookmark', postId],
    queryFn: async () => {
      if (!currentUserId) return false
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
    enabled: !!currentUserId,
    initialData: initialIsBookmarked,
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 좋아요 토글
  const likeMutation = useMutation({
    mutationFn: async () => {
      // 메인: POST만 사용 (토글), 커뮤니티: POST/DELETE 구분
      const method = isCommunityPost ? (isLiked ? 'DELETE' : 'POST') : 'POST'
      const response = await apiClient(`${apiBasePath}/like`, { method })
      if (!response.success)
        throw new Error(response.error || '좋아요 처리 실패')
      return response.data
    },
    onMutate: async () => {
      // Optimistic Update
      await queryClient.cancelQueries({
        queryKey: [postType + 'PostLike', postId],
      })
      const previousLike = queryClient.getQueryData([
        postType + 'PostLike',
        postId,
      ])

      queryClient.setQueryData([postType + 'PostLike', postId], !isLiked)
      setLikeCount((prev) => (!isLiked ? prev + 1 : Math.max(0, prev - 1)))

      return { previousLike }
    },
    onError: (err, variables, context) => {
      // 롤백
      if (context?.previousLike !== undefined) {
        queryClient.setQueryData(
          [postType + 'PostLike', postId],
          context.previousLike
        )
        setLikeCount((prev) =>
          context.previousLike ? prev : Math.max(0, prev - 1)
        )
      }
      toast.error('좋아요 처리에 실패했습니다.')
    },
    onSuccess: (data) => {
      // 서버 응답으로 최종 상태 업데이트
      queryClient.invalidateQueries({
        queryKey: [postType + 'PostLike', postId],
      })

      // 메인 게시글의 경우 응답에서 liked 상태 확인
      if (
        !isCommunityPost &&
        data &&
        typeof data === 'object' &&
        'liked' in data
      ) {
        toast.success(
          data.liked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다'
        )
      }
    },
  })

  // 북마크 토글
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      // 메인: POST만 사용 (토글), 커뮤니티: POST/DELETE 구분
      const method = isCommunityPost
        ? isBookmarked
          ? 'DELETE'
          : 'POST'
        : 'POST'
      const response = await apiClient(`${apiBasePath}/bookmark`, { method })
      if (!response.success)
        throw new Error(response.error || '북마크 처리 실패')
      return response.data
    },
    onMutate: async () => {
      // Optimistic Update
      await queryClient.cancelQueries({
        queryKey: [postType + 'PostBookmark', postId],
      })
      const previousBookmark = queryClient.getQueryData([
        postType + 'PostBookmark',
        postId,
      ])

      queryClient.setQueryData(
        [postType + 'PostBookmark', postId],
        !isBookmarked
      )

      return { previousBookmark }
    },
    onError: (err, variables, context) => {
      // 롤백
      if (context?.previousBookmark !== undefined) {
        queryClient.setQueryData(
          [postType + 'PostBookmark', postId],
          context.previousBookmark
        )
      }
      toast.error('북마크 처리에 실패했습니다.')
    },
    onSuccess: (data) => {
      // 서버 응답으로 최종 상태 업데이트
      queryClient.invalidateQueries({
        queryKey: [postType + 'PostBookmark', postId],
      })

      // 성공 메시지
      const message =
        !isCommunityPost &&
        data &&
        typeof data === 'object' &&
        'bookmarked' in data
          ? data.bookmarked
            ? '북마크에 저장했습니다'
            : '북마크를 취소했습니다'
          : !isBookmarked
            ? '북마크에 저장되었습니다'
            : '북마크가 해제되었습니다'

      toast.success(message)
    },
  })

  const handleLike = () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }
    likeMutation.mutate()
  }

  const handleBookmark = () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }
    bookmarkMutation.mutate()
  }

  return {
    likeCount,
    isLiked,
    isBookmarked,
    likeMutation,
    bookmarkMutation,
    handleLike,
    handleBookmark,
  }
}
