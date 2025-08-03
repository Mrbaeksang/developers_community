'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { MessageSquare, Send, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface Author {
  id: string
  name: string | null
  email: string
  image: string | null
}

interface Comment {
  id: string
  content: string
  isEdited: boolean
  createdAt: string
  author: Author
  parentId: string | null
  replies?: Comment[]
}

interface CommunityCommentSectionProps {
  postId: string
  communityId: string
  currentUserId?: string
}

export function CommunityCommentSection({
  postId,
  communityId,
  currentUserId,
}: CommunityCommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId, communityId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `/api/communities/${communityId}/posts/${postId}/comments`
      )
      if (!res.ok) throw new Error('Failed to fetch comments')

      const data = await res.json()

      // 새로운 응답 형식 처리: { success: true, data: { comments } }
      const comments = data.success && data.data ? data.data.comments : []
      setComments(comments)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
      toast.error('댓글을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) {
      toast.error('댓글 내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(
        `/api/communities/${communityId}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newComment.trim() }),
        }
      )

      if (!res.ok) throw new Error('Failed to create comment')

      const data = await res.json()

      // 새로운 응답 형식 처리: { success: true, data: commentData }
      const commentData = data.success && data.data ? data.data : data
      setComments([commentData, ...comments])
      setNewComment('')
      toast.success('댓글이 작성되었습니다.')
    } catch (error) {
      console.error('Failed to create comment:', error)
      toast.error('댓글 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }

    if (!replyContent.trim()) {
      toast.error('답글 내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(
        `/api/communities/${communityId}/posts/${postId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: replyContent.trim(),
            parentId,
          }),
        }
      )

      if (!res.ok) throw new Error('Failed to create reply')

      await fetchComments()
      setReplyTo(null)
      setReplyContent('')
      toast.success('답글이 작성되었습니다.')
    } catch (error) {
      console.error('Failed to create reply:', error)
      toast.error('답글 작성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error('댓글 내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(
        `/api/communities/${communityId}/comments/${commentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      )

      if (!res.ok) throw new Error('Failed to update comment')

      await fetchComments()
      setEditingId(null)
      setEditContent('')
      toast.success('댓글이 수정되었습니다.')
    } catch (error) {
      console.error('Failed to update comment:', error)
      toast.error('댓글 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return
    }

    try {
      const res = await fetch(
        `/api/communities/${communityId}/comments/${commentId}`,
        {
          method: 'DELETE',
        }
      )

      if (!res.ok) throw new Error('Failed to delete comment')

      await fetchComments()
      toast.success('댓글이 삭제되었습니다.')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      toast.error('댓글 삭제에 실패했습니다.')
    }
  }

  const renderComment = (comment: Comment, level: number = 0) => {
    const isAuthor = currentUserId === comment.author.id
    const isEditing = editingId === comment.id
    const isReplying = replyTo === comment.id

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-12' : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 border-2 border-black">
            <AvatarImage src={comment.author.image || undefined} />
            <AvatarFallback className="font-bold text-xs">
              {comment.author.name?.[0] ||
                comment.author.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm">
                  {comment.author.name || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                  {comment.isEdited && ' (수정됨)'}
                </p>
              </div>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditContent(comment.content)
                      }}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={isSubmitting}
                    className="text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setEditContent('')
                    }}
                    className="text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {comment.content}
                </p>
                {currentUserId && level < 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyTo(comment.id)
                      setReplyContent('')
                    }}
                    className="text-xs mt-1 h-6 px-2"
                  >
                    답글
                  </Button>
                )}
              </>
            )}

            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  className="min-h-[60px] text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={isSubmitting}
                    className="text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    답글 작성
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyTo(null)
                      setReplyContent('')
                    }}
                    className="text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    취소
                  </Button>
                </div>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) =>
                  renderComment(reply, level + 1)
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            댓글
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          댓글 {comments.length > 0 && `(${comments.length})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment Form */}
        {currentUserId ? (
          <div className="space-y-3 mb-6">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="min-h-[80px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <Send className="h-4 w-4 mr-2" />
              댓글 작성
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 mb-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              댓글을 작성하려면 로그인해주세요.
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              첫 번째 댓글을 작성해보세요!
            </p>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
