'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  MessageSquare,
  Send,
  Edit,
  Trash2,
  MoreVertical,
  AlertCircle,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Comment {
  id: string
  content: string
  createdAt: string
  isEdited?: boolean
  author: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: string
  initialComments: Comment[]
}

export default function CommentSection({
  postId,
  initialComments,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const router = useRouter()

  // 댓글 목록 가져오기 (initialComments가 비어있을 때만)
  useEffect(() => {
    if (initialComments.length > 0) {
      return // 이미 서버에서 받아온 데이터가 있으면 스킵
    }
    
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/main/posts/${postId}/comments`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments)
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error)
      }
    }

    fetchComments()
  }, [postId, initialComments.length])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    // 로그인 체크
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '댓글을 작성하려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/signin')
      return
    }

    if (!newComment.trim()) {
      toast({
        title: '댓글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/main/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments([data.comment, ...comments])
        toast({
          title: '댓글이 작성되었습니다',
        })
        setNewComment('')
      } else {
        const error = await res.json()
        throw new Error(error.error || '댓글 작성에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
      toast({
        title: '댓글 작성에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId: string) => {
    if (status === 'unauthenticated') {
      toast({
        title: '로그인이 필요합니다',
        description: '답글을 작성하려면 로그인해주세요.',
        variant: 'destructive',
      })
      router.push('/signin')
      return
    }

    if (!replyContent.trim()) {
      toast({
        title: '답글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/main/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentId: parentId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // 답글을 해당 댓글의 replies 배열에 추가
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.comment]
            }
          }
          return comment
        }))
        toast({
          title: '답글이 작성되었습니다',
        })
        setReplyingToId(null)
        setReplyContent('')
      } else {
        const error = await res.json()
        throw new Error(error.error || '답글 작성에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to create reply:', error)
      toast({
        title: '답글 작성에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: '댓글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await fetch(`/api/main/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(
          comments.map((comment) =>
            comment.id === commentId
              ? { ...comment, content: data.comment.content, isEdited: true }
              : comment
          )
        )
        toast({
          title: '댓글이 수정되었습니다',
        })
        setEditingCommentId(null)
        setEditContent('')
      } else {
        const error = await res.json()
        throw new Error(error.error || '댓글 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      toast({
        title: '댓글 수정에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/main/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setComments(comments.filter((comment) => comment.id !== commentId))
        toast({
          title: '댓글이 삭제되었습니다',
        })
      } else {
        const error = await res.json()
        throw new Error(error.error || '댓글 삭제에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast({
        title: '댓글 삭제에 실패했습니다',
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      setDeleteCommentId(null)
    }
  }

  const CommentItem = ({
    comment,
    depth = 0,
  }: {
    comment: Comment
    depth?: number
  }) => {
    const isAuthor = session?.user?.id === comment.author.id
    const isEditing = editingCommentId === comment.id

    return (
      <div className={`${depth > 0 ? 'ml-12' : ''}`}>
        <div className="flex gap-3 mb-4">
          <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-black">
            <AvatarImage src={comment.author.image || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {comment.author.name?.[0] || comment.author.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">
                    {comment.author.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                  {comment.isEdited && (
                    <span className="text-xs text-muted-foreground">
                      (수정됨)
                    </span>
                  )}
                </div>
                {isAuthor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCommentId(comment.id)
                          setEditContent(comment.content)
                        }}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteCommentId(comment.id)}
                        className="text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="border-2 border-black"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEditComment(comment.id)}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                    >
                      수정 완료
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingCommentId(null)
                        setEditContent('')
                      }}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
            
            {/* 답글 버튼 */}
            {depth === 0 && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold hover:bg-gray-100"
                  onClick={() => {
                    if (replyingToId === comment.id) {
                      setReplyingToId(null)
                      setReplyContent('')
                    } else {
                      setReplyingToId(comment.id)
                      setReplyContent('')
                    }
                  }}
                >
                  {replyingToId === comment.id ? '취소' : '답글 달기'}
                </Button>
              </div>
            )}
            
            {/* 답글 작성 폼 */}
            {replyingToId === comment.id && (
              <div className="mt-3 ml-12">
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 작성해주세요..."
                    className="flex-1 min-h-[80px] border-2 border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      답글 작성
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingToId(null)
                        setReplyContent('')
                      }}
                      className="border-2 border-black"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {comment.replies?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
        ))}
      </div>
    )
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
              disabled={isSubmitting}
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
              <CommentItem key={comment.id} comment={comment} />
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
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              취소
            </Button>
            <Button
              onClick={() => handleDeleteComment(deleteCommentId!)}
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
