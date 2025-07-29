'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface CommentItemProps {
  comment: Comment
  depth?: number
  currentUserId?: string
  isSubmitting: boolean
  replyingToId: string | null
  replyContent: string
  editingCommentId: string | null
  editContent: string
  onReplyClick: (commentId: string) => void
  onReplyChange: (commentId: string, content: string) => void
  onReplySubmit: (parentId: string) => void
  onReplyCancel: (commentId: string) => void
  onEditClick: (commentId: string, content: string) => void
  onEditChange: (content: string) => void
  onEditSubmit: (commentId: string) => void
  onEditCancel: () => void
  onDeleteClick: (commentId: string) => void
}

export default function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  isSubmitting,
  replyingToId,
  replyContent,
  editingCommentId,
  editContent,
  onReplyClick,
  onReplyChange,
  onReplySubmit,
  onReplyCancel,
  onEditClick,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  onDeleteClick,
}: CommentItemProps) {
  const isAuthor = currentUserId === comment.author.id
  const isEditing = editingCommentId === comment.id
  const isReplying = replyingToId === comment.id

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
                      onClick={() => onEditClick(comment.id, comment.content)}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteClick(comment.id)}
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
                  onChange={(e) => onEditChange(e.target.value)}
                  className="border-2 border-black"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onEditSubmit(comment.id)}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                  >
                    수정 완료
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEditCancel}
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
                onClick={() => onReplyClick(comment.id)}
              >
                {isReplying ? '취소' : '답글 달기'}
              </Button>
            </div>
          )}

          {/* 답글 작성 폼 */}
          {isReplying && (
            <div className="mt-3 ml-12">
              <div className="flex gap-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => onReplyChange(comment.id, e.target.value)}
                  placeholder="답글을 작성해주세요..."
                  className="flex-1 min-h-[80px] border-2 border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  rows={2}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => onReplySubmit(comment.id)}
                    disabled={isSubmitting || !replyContent.trim()}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    답글 작성
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReplyCancel(comment.id)}
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
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          currentUserId={currentUserId}
          isSubmitting={isSubmitting}
          replyingToId={replyingToId}
          replyContent=""
          editingCommentId={editingCommentId}
          editContent={editContent}
          onReplyClick={onReplyClick}
          onReplyChange={onReplyChange}
          onReplySubmit={onReplySubmit}
          onReplyCancel={onReplyCancel}
          onEditClick={onEditClick}
          onEditChange={onEditChange}
          onEditSubmit={onEditSubmit}
          onEditCancel={onEditCancel}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  )
}
