'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { apiClient } from '@/lib/api'

interface CommentSectionProps {
  postId: string
  initialComments: Comment[]
}

// 댓글 가져오기 함수
const fetchComments = async (postId: string): Promise<Comment[]> => {
  const res = await fetch(`/api/main/posts/${postId}/comments`)
  if (!res.ok) throw new Error('Failed to fetch comments')
  const data = await res.json()
  // 새로운 응답 형식 처리: { success: true, data: { comments } }
  return data.success && data.data ? data.data.comments : data.comments || []
}

export default function CommentSection({
  postId,
  initialComments,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
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
  const { data: comments = initialComments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    initialData: initialComments.length > 0 ? initialComments : undefined,
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시
  })

  // 댓글 작성 mutation
  const createCommentMutation = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string
      parentId: string | null
    }) => {
      const response = await apiClient<{ comment: Comment }>(
        `/api/main/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, parentId }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '댓글 작성에 실패했습니다')
      }

      return response.data?.comment || response.data
    },
    onSuccess: (newComment) => {
      // 댓글 목록 캐시 업데이트
      queryClient.setQueryData(['comments', postId], (old: Comment[] = []) => [
        newComment,
        ...old,
      ])
      toast({
        title: '댓글이 작성되었습니다',
      })
      setNewComment('')
    },
    onError: (error) => {
      console.error('Failed to create comment:', error)
      toast({
        title: '댓글 작성에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    },
  })

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    // 로그인 체크
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '댓글을 작성하려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/auth/signin')
      return
    }

    if (!newComment.trim()) {
      toast({
        title: '댓글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    createCommentMutation.mutate({ content: newComment.trim(), parentId: null })
  }

  // 답글 작성 mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({
      content,
      parentId,
    }: {
      content: string
      parentId: string
    }) => {
      const response = await apiClient<{ comment: Comment }>(
        `/api/main/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, parentId }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '답글 작성에 실패했습니다')
      }

      return {
        reply: response.data?.comment || response.data,
        parentId,
      }
    },
    onSuccess: ({ reply, parentId }) => {
      // 답글을 해당 댓글의 replies 배열에 추가
      queryClient.setQueryData(['comments', postId], (old: Comment[] = []) =>
        old.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), reply],
            }
          }
          return comment
        })
      )
      toast({
        title: '답글이 작성되었습니다',
      })
      setReplyingToId(null)
      setReplyContents((prev) => {
        const newContents = { ...prev }
        delete newContents[parentId]
        return newContents
      })
    },
    onError: (error) => {
      console.error('Failed to create reply:', error)
      toast({
        title: '답글 작성에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
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
      return
    }

    const content = replyContents[parentId] || ''
    if (!content.trim()) {
      toast({
        title: '답글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    createReplyMutation.mutate({ content: content.trim(), parentId })
  }

  // 댓글 수정 mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string
      content: string
    }) => {
      const response = await apiClient<{ comment: Comment }>(
        `/api/main/comments/${commentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '댓글 수정에 실패했습니다')
      }

      const updatedComment = response.data?.comment || response.data
      return { comment: updatedComment as Comment, commentId }
    },
    onSuccess: ({ comment, commentId }) => {
      // 재귀적으로 댓글 트리를 업데이트하는 함수
      const updateCommentInTree = (comments: Comment[]): Comment[] => {
        return comments.map((c) => {
          if (c.id === commentId) {
            return {
              ...c,
              content: comment.content,
              isEdited: true,
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

      queryClient.setQueryData(['comments', postId], (old: Comment[] = []) =>
        updateCommentInTree(old)
      )
      toast({
        title: '댓글이 수정되었습니다',
      })
      setEditingCommentId(null)
      setEditContent('')
    },
    onError: (error) => {
      console.error('Failed to update comment:', error)
      toast({
        title: '댓글 수정에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    },
  })

  const handleEditComment = (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: '댓글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    editCommentMutation.mutate({ commentId, content: editContent.trim() })
  }

  // 댓글 삭제 mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await apiClient(`/api/main/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.error || '댓글 삭제에 실패했습니다')
      }

      return commentId
    },
    onSuccess: (commentId) => {
      // 재귀적으로 댓글을 삭제하는 함수
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

      queryClient.setQueryData(['comments', postId], (old: Comment[] = []) =>
        deleteCommentFromTree(old)
      )
      toast({
        title: '댓글이 삭제되었습니다',
      })
      setDeleteCommentId(null)
    },
    onError: (error) => {
      console.error('Failed to delete comment:', error)
      toast({
        title: '댓글 삭제에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
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

  const handleEditSubmit = (commentId: string) => {
    handleEditComment(commentId)
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
        </h2>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-8">
          <Textarea
            placeholder="댓글을 작성해주세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-3 border-2 border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createCommentMutation.isPending}
              className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              <Send className="h-4 w-4 mr-2" />
              댓글 작성
            </Button>
          </div>
        </form>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={session?.user?.id}
                isSubmitting={
                  createCommentMutation.isPending ||
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
