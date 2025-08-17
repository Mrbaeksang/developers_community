'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CommentItem from './CommentItem'
import { CommentForm } from '@/components/comments/CommentForm'
import { EmptyState } from '@/components/shared/EmptyState'
import {
  TetrisLoading,
  isMobileDevice,
} from '@/components/shared/TetrisLoading'
// Comment type defined locally
type Comment = {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  userId: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  isEdited?: boolean
  parentId: string | null
  replies?: Comment[]
}
import { apiClient } from '@/lib/api/client'

interface CommentSectionProps {
  postId: string
  postType?: 'main' | 'community'
  communityId?: string
  initialComments: Comment[]
  isQAPost?: boolean // Q&A 게시글 여부
  isMember?: boolean // 커뮤니티 멤버 여부
  communityName?: string // 커뮤니티 이름
}

// 댓글 가져오기 함수 생성
const createFetchComments = (postType: string, communityId?: string) => {
  return async (postId: string): Promise<Comment[]> => {
    const endpoint =
      postType === 'community' && communityId
        ? `/api/communities/${communityId}/posts/${postId}/comments`
        : `/api/main/posts/${postId}/comments`

    try {
      const res = await fetch(endpoint)
      if (!res.ok) {
        console.warn(`Failed to fetch comments from ${endpoint}`)
        return [] // 오류 시 빈 배열 반환
      }
      const data = await res.json()
      // API 응답 형식 처리
      if (data.success && data.data) {
        // 새 형식: { success: true, data: { comments: [...] } } 또는 { success: true, data: { items: [...] } }
        return data.data.comments || data.data.items || []
      }
      // 구형 API 응답: { comments: [...] }
      return data.comments || []
    } catch (error) {
      console.error('Error fetching comments:', error)
      return [] // 오류 시 빈 배열 반환
    }
  }
}

export default function CommentSection({
  postId,
  postType = 'main',
  communityId,
  initialComments,
  isQAPost = false,
  isMember = true,
  communityName,
}: CommentSectionProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContents, setReplyContents] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // 댓글 목록 React Query로 관리
  const fetchComments = useMemo(
    () => createFetchComments(postType, communityId),
    [postType, communityId]
  )

  // AI 봇 사용자 ID (환경 변수에서 가져오거나 기본값 사용)
  const AI_BOT_USER_ID = 'cmdri2tj90000u8vgtyir9upy'

  // AI 답변 체크 관련 상태
  const [isCheckingForAI, setIsCheckingForAI] = useState(false)
  const [aiCommentFound, setAiCommentFound] = useState(false)
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const checkCountRef = useRef(0)
  const MAX_CHECKS = 30 // 최대 30번 체크 (60초)
  const CHECK_INTERVAL = 2000 // 2초마다 체크

  // Q&A 게시글인지 확인 (URL 파라미터 또는 localStorage에서)
  const [isWaitingForAI, setIsWaitingForAI] = useState(false)

  // 모바일 여부 체크
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  const { data: comments = initialComments, refetch } = useQuery({
    queryKey: ['comments', postId, postType, communityId],
    queryFn: () => fetchComments(postId),
    initialData: initialComments,
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시
  })

  // AI 댓글 존재 여부 확인
  const hasAIComment = comments.some(
    (comment: Comment) => comment.author.id === AI_BOT_USER_ID
  )

  // Q&A 게시글에서 AI 댓글이 없으면 10초마다 폴링
  useEffect(() => {
    console.error(
      `[Q&A Polling] isQAPost: ${isQAPost}, hasAIComment: ${hasAIComment}`
    )

    if (!isQAPost || hasAIComment) {
      console.error(
        `[Q&A Polling] 폴링 중지 - isQAPost: ${isQAPost}, hasAIComment: ${hasAIComment}`
      )
      return
    }

    console.error('[Q&A Polling] 10초 폴링 시작')
    const interval = setInterval(() => {
      console.error('[Q&A Polling] refetch 실행')
      refetch()
    }, 10000) // 10초마다 폴링

    return () => {
      console.error('[Q&A Polling] 폴링 정리')
      clearInterval(interval)
    }
  }, [isQAPost, hasAIComment, refetch])

  // Q&A 게시글 초기화 및 AI 댓글 확인
  useEffect(() => {
    // 이미 AI 댓글이 있는지 먼저 확인
    const hasAIComment = comments.some(
      (comment) => comment.author.id === AI_BOT_USER_ID
    )

    if (hasAIComment) {
      // 이미 AI 댓글이 있으면 대기 상태 해제
      setAiCommentFound(true)
      setIsCheckingForAI(false)
      setIsWaitingForAI(false)
      return
    }

    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search)
    const qaParam = urlParams.get('qa')

    // localStorage 확인
    const localStorageKey = `qa_post_${postId}`
    const qaFlag = localStorage.getItem(localStorageKey)

    if (qaParam === 'true' || qaFlag === 'true') {
      setIsWaitingForAI(true)
      setIsCheckingForAI(true)

      // URL 파라미터 제거
      if (qaParam) {
        urlParams.delete('qa')
        const newUrl = `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`
        window.history.replaceState({}, '', newUrl)
      }

      // localStorage 정리
      if (qaFlag) {
        localStorage.removeItem(localStorageKey)
      }
    } else if (isQAPost) {
      // props로 전달된 경우
      setIsWaitingForAI(true)
      setIsCheckingForAI(true)
    }
  }, [postId, isQAPost, comments])

  // AI 댓글 체크 함수
  const checkForAIComment = useCallback(
    (commentsToCheck?: Comment[]) => {
      const checkComments = commentsToCheck || comments
      const hasAIComment = checkComments.some(
        (comment) => comment.author.id === AI_BOT_USER_ID
      )

      if (hasAIComment) {
        setAiCommentFound(true)
        setIsCheckingForAI(false)
        setIsWaitingForAI(false)

        // 체크 중지
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }

        // 체크 카운트 리셋
        checkCountRef.current = 0

        // 성공 토스트
        toast({
          title: '✨ AI 답변이 도착했습니다!',
          description: 'AI가 귀하의 질문에 대한 답변을 생성했습니다.',
        })

        return true
      }
      return false
    },
    [comments, toast]
  )

  // AI 댓글 자동 체크 시작
  useEffect(() => {
    if (isWaitingForAI && !aiCommentFound) {
      // 초기 체크
      checkForAIComment()

      // 주기적으로 refetch하여 AI 댓글 확인
      checkIntervalRef.current = setInterval(() => {
        checkCountRef.current += 1

        if (checkCountRef.current >= MAX_CHECKS) {
          // 최대 체크 횟수 도달
          setIsCheckingForAI(false)
          setIsWaitingForAI(false)

          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current)
            checkIntervalRef.current = null
          }

          toast({
            title: 'AI 답변 생성이 지연되고 있습니다',
            description: '잠시 후 페이지를 새로고침해주세요.',
            variant: 'destructive',
          })
        } else {
          // 댓글 refetch 후 결과 직접 체크
          refetch().then((result) => {
            if (result.data) {
              const foundAI = checkForAIComment(result.data)
              if (foundAI) {
                // AI 댓글 찾음 - interval이 이미 정리됨
                return
              }
            }
          })
        }
      }, CHECK_INTERVAL)

      return () => {
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
      }
    }

    return undefined
  }, [isWaitingForAI, aiCommentFound, checkForAIComment, refetch, toast])

  // 답글 작성 mutation (낙관적 UI)
  const createReplyMutation = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string
      parentId: string
    }) => {
      const endpoint =
        postType === 'community' && communityId
          ? `/api/communities/${communityId}/posts/${postId}/comments`
          : `/api/main/posts/${postId}/comments`

      const response = await apiClient<{ comment: Comment }>(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, parentId }),
      })

      if (!response.success) {
        throw new Error(response.error || '답글 작성에 실패했습니다')
      }

      return {
        reply: response.data?.comment || response.data,
        parentId,
      }
    },
    onMutate: async ({ content, parentId }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: ['comments', postId, postType, communityId],
      })

      const previousComments = queryClient.getQueryData<Comment[]>([
        'comments',
        postId,
        postType,
        communityId,
      ])

      // 낙관적 답글 생성
      const optimisticReply: Comment = {
        id: `temp-${Date.now()}`,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: session?.user?.id || '',
        author: {
          id: session?.user?.id || '',
          name: session?.user?.name || 'Unknown',
          image: session?.user?.image || null,
        },
        parentId,
        isEdited: false,
      }

      // 낙관적 업데이트
      queryClient.setQueryData(
        ['comments', postId, postType, communityId],
        (old: Comment[] = []) =>
          old.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), optimisticReply],
              }
            }
            return comment
          })
      )

      // UI 상태 즉시 초기화
      setReplyingToId(null)
      setReplyContents((prev) => {
        const newContents = { ...prev }
        delete newContents[parentId]
        return newContents
      })

      return { previousComments }
    },
    onError: (error, variables, context) => {
      // 롤백
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', postId, postType, communityId],
          context.previousComments
        )
      }

      // UI 상태 복원
      setReplyingToId(variables.parentId)
      setReplyContents((prev) => ({
        ...prev,
        [variables.parentId]: variables.content,
      }))

      console.error('Failed to create reply:', error)
      toast({
        title: '답글 작성에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    },
    onSuccess: ({ reply, parentId }) => {
      // 서버 응답으로 임시 답글 교체
      queryClient.setQueryData(
        ['comments', postId, postType, communityId],
        (old: Comment[] = []) =>
          old.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map((r) =>
                  r.id.startsWith('temp-') ? reply : r
                ),
              }
            }
            return comment
          })
      )
      toast({
        title: '답글이 작성되었습니다',
      })
    },
  })

  const handleReplySubmit = async (parentId: string) => {
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '답글을 작성하려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/auth/signin')
      throw new Error('Unauthenticated')
    }

    const content = replyContents[parentId] || ''
    if (!content.trim()) {
      toast({
        title: '답글 내용을 입력해주세요',
        variant: 'destructive',
      })
      throw new Error('Empty content')
    }

    // mutateAsync를 사용하여 Promise 반환
    await createReplyMutation.mutateAsync({
      content: content.trim(),
      parentId,
    })
  }

  // 댓글 수정 mutation (낙관적 UI)
  const editCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string
      content: string
    }) => {
      const endpoint =
        postType === 'community' && communityId
          ? `/api/communities/${communityId}/comments/${commentId}`
          : `/api/main/comments/${commentId}`
      const method = postType === 'community' ? 'PATCH' : 'PUT'

      const response = await apiClient<{ comment: Comment }>(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.success) {
        throw new Error(response.error || '댓글 수정에 실패했습니다')
      }

      const updatedComment = response.data?.comment || response.data
      return { comment: updatedComment as Comment, commentId }
    },
    onMutate: async ({ commentId, content }) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: ['comments', postId, postType, communityId],
      })

      const previousComments = queryClient.getQueryData<Comment[]>([
        'comments',
        postId,
        postType,
        communityId,
      ])

      // 재귀적으로 댓글 트리를 낙관적으로 업데이트
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              content,
              isEdited: true,
              updatedAt: new Date(),
            }
          }
          if (c.replies && c.replies.length > 0) {
            return {
              ...c,
              replies: updateCommentInTree(c.replies),
            }
          }
          return c
        })
      }

      // 낙관적 업데이트
      queryClient.setQueryData(
        ['comments', postId, postType, communityId],
        (old: Comment[] = []) => updateCommentInTree(old)
      )

      // UI 상태 즉시 초기화
      setEditingCommentId(null)
      setEditContent('')

      return {
        previousComments,
        previousEditingId: commentId,
        previousContent: editContent,
      }
    },
    onError: (error, variables, context) => {
      // 롤백
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', postId, postType, communityId],
          context.previousComments
        )
      }

      // UI 상태 복원
      if (context?.previousEditingId) {
        setEditingCommentId(context.previousEditingId)
        setEditContent(context.previousContent)
      }

      console.error('Failed to update comment:', error)
      toast({
        title: '댓글 수정에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: '댓글이 수정되었습니다',
      })
    },
  })

  // 댓글 삭제 mutation (낙관적 UI)
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const endpoint =
        postType === 'community' && communityId
          ? `/api/communities/${communityId}/comments/${commentId}`
          : `/api/main/comments/${commentId}`

      const response = await apiClient(endpoint, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.error || '댓글 삭제에 실패했습니다')
      }

      return commentId
    },
    onMutate: async (commentId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: ['comments', postId, postType, communityId],
      })

      const previousComments = queryClient.getQueryData<Comment[]>([
        'comments',
        postId,
        postType,
        communityId,
      ])

      // 재귀적으로 댓글을 낙관적으로 삭제
      const deleteCommentFromTree = (comments: Comment[]): Comment[] => {
        return comments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: deleteCommentFromTree(comment.replies),
              }
            }
            return comment
          })
      }

      // 낙관적 업데이트
      queryClient.setQueryData(
        ['comments', postId, postType, communityId],
        (old: Comment[] = []) => deleteCommentFromTree(old)
      )

      // 다이얼로그 즉시 닫기
      setDeleteCommentId(null)

      // 성공 토스트 즉시 표시
      toast({
        title: '댓글이 삭제되었습니다',
      })

      return { previousComments }
    },
    onError: (error, commentId, context) => {
      // 롤백
      if (context?.previousComments) {
        queryClient.setQueryData(
          ['comments', postId, postType, communityId],
          context.previousComments
        )
      }

      console.error('Failed to delete comment:', error)
      toast({
        title: '댓글 삭제에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      // 백그라운드에서 캐시 무효화 - 딜레이를 주어 낙관적 UI 유지
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['comments', postId, postType, communityId],
          refetchType: 'none', // 자동 refetch 방지
        })
      }, 1000) // 1초 딜레이
    },
  })

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMutation.mutate(commentId)
  }

  // Handler functions for CommentItem
  const handleReplyClick = (commentId: string) => {
    if (replyingToId === commentId) {
      setReplyingToId(null)
    } else {
      setReplyingToId(commentId)
    }
  }

  const handleReplyChange = (commentId: string, content: string) => {
    setReplyContents((prev) => ({ ...prev, [commentId]: content }))
  }

  const handleReplyCancel = (commentId: string) => {
    setReplyingToId(null)
    setReplyContents((prev) => {
      const newContents = { ...prev }
      delete newContents[commentId]
      return newContents
    })
  }

  const handleEditClick = (commentId: string, content: string) => {
    setEditingCommentId(commentId)
    setEditContent(content)
  }

  const handleEditChange = (content: string) => {
    setEditContent(content)
  }

  const handleEditSubmit = async (commentId: string, content: string) => {
    if (!content.trim()) {
      toast({
        title: '댓글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return Promise.reject(new Error('Empty content'))
    }

    // mutateAsync를 사용하여 Promise 반환
    return editCommentMutation.mutateAsync({
      commentId,
      content: content.trim(),
    })
  }

  const handleEditCancel = () => {
    setEditingCommentId(null)
    setEditContent('')
  }

  const handleDeleteClick = (commentId: string) => {
    setDeleteCommentId(commentId)
  }

  return (
    <section className="mt-8">
      <div className="bg-white border-2 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          댓글 {comments.length}개
          {isCheckingForAI && (
            <span className="ml-auto text-sm font-normal text-muted-foreground animate-pulse">
              🤖 AI가 답변을 생성하고 있습니다...
            </span>
          )}
        </h2>

        {/* Comment Form */}
        <div className="mb-8">
          <CommentForm
            postId={postId}
            postType={postType}
            communityId={communityId}
            isMember={isMember}
            communityName={communityName}
            onSuccess={() => {
              // 댓글 작성 성공 시 쿼리 갱신
              queryClient.invalidateQueries({
                queryKey: ['comments', postId, postType, communityId],
              })
              toast({
                title: '댓글이 작성되었습니다',
              })
            }}
            placeholder="댓글을 작성해주세요..."
            buttonText="댓글 작성"
            showToolbar={true}
            enableDraft={true}
          />
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          isCheckingForAI ? (
            !isMobile ? (
              <TetrisLoading
                size="sm"
                text="AI가 답변을 생성하고 있습니다..."
                className="py-12"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">
                    AI가 답변을 생성하고 있습니다
                  </p>
                  <p className="text-sm text-muted-foreground">
                    잠시만 기다려주세요... 곧 AI의 상세한 답변이 도착합니다.
                  </p>
                </div>
              </div>
            )
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="아직 댓글이 없습니다"
              description="첫 번째 댓글을 작성해보세요!"
              size="sm"
            />
          )
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={session?.user?.id}
                isSubmitting={
                  createReplyMutation.isPending ||
                  editCommentMutation.isPending ||
                  deleteCommentMutation.isPending
                }
                replyingToId={replyingToId}
                replyContent={replyContents[comment.id] || ''}
                editingCommentId={editingCommentId}
                editContent={editContent}
                onReplyClick={handleReplyClick}
                onReplyChange={handleReplyChange}
                onReplySubmit={handleReplySubmit}
                onReplyCancel={handleReplyCancel}
                onEditClick={handleEditClick}
                onEditChange={handleEditChange}
                onEditSubmit={handleEditSubmit}
                onEditCancel={handleEditCancel}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteCommentId}
        onOpenChange={() => setDeleteCommentId(null)}
      >
        <DialogContent className="border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              댓글 삭제
            </DialogTitle>
            <DialogDescription>
              이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCommentId(null)}
              disabled={deleteCommentMutation.isPending}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              취소
            </Button>
            <Button
              onClick={() =>
                deleteCommentId && handleDeleteComment(deleteCommentId)
              }
              disabled={deleteCommentMutation.isPending}
              className="bg-destructive text-destructive-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
