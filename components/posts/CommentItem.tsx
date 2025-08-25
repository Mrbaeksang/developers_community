'use client'

import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { CommentForm } from '@/components/comments/CommentForm'
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
  onReplySubmit: (parentId: string, content?: string) => void
  onReplyCancel: (commentId: string) => void
  onEditClick: (commentId: string, content: string) => void
  onEditChange: (content: string) => void
  onEditSubmit: (commentId: string, content: string) => void
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
  // comment이나 author가 없는 경우 early return
  if (!comment || !comment.author) {
    return null
  }

  const isAuthor = currentUserId === comment.author.id
  const isEditing = editingCommentId === comment.id
  const isReplying = replyingToId === comment.id

  return (
    <div className={`${depth > 0 ? 'ml-8 sm:ml-12' : ''}`}>
      <div className="flex gap-2 sm:gap-3 mb-4">
        <div className="flex-shrink-0">
          <AuthorAvatar
            author={comment.author}
            size="md"
            enableDropdown
            dropdownAlign="start"
          />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="bg-white border-2 border-black rounded-lg p-3 lg:p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 overflow-hidden">
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
              <CommentForm
                postId="" // 수정 모드에서는 postId 불필요
                commentId={comment.id}
                mode="edit"
                initialContent={editContent}
                onSubmit={async (content) => {
                  // onEditSubmit이 Promise를 반환하도록 수정 필요
                  onEditChange(content)
                  await onEditSubmit(comment.id, content)
                }}
                onCancel={onEditCancel}
                placeholder="댓글을 수정하세요..."
                buttonText="수정 완료"
                showToolbar={true}
                enableDraft={false}
                autoFocus={true}
              />
            ) : (
              <div
                className="prose prose-sm max-w-none text-xs sm:text-sm break-words overflow-hidden 
                [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_br]:block 
                [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline [&_a]:cursor-pointer [&_a]:break-all 
                [&_code]:px-1 [&_code]:py-0.5 [&_code]:bg-gray-100 [&_code]:text-red-600 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:break-words 
                [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-md [&_pre]:text-[10px] sm:[&_pre]:text-xs [&_pre]:my-3 [&_pre]:border [&_pre]:border-gray-700
                [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_pre_code]:block [&_pre_code]:w-max [&_pre_code]:min-w-full
                [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 
                [&_ul]:list-disc [&_ul]:ml-4 sm:[&_ul]:ml-6 [&_ul]:space-y-1 
                [&_ol]:list-decimal [&_ol]:ml-4 sm:[&_ol]:ml-6 [&_ol]:space-y-1 
                [&_li]:pl-1 [&_li]:break-words
                [&_h1]:font-bold [&_h1]:text-sm sm:[&_h1]:text-base [&_h1]:mt-4 [&_h1]:mb-2
                [&_h2]:font-bold [&_h2]:text-sm sm:[&_h2]:text-base [&_h2]:mt-3 [&_h2]:mb-2
                [&_h3]:font-bold [&_h3]:text-xs sm:[&_h3]:text-sm [&_h3]:mt-2 [&_h3]:mb-1
                [&_h4]:font-bold [&_h4]:text-xs sm:[&_h4]:text-sm 
                [&_h5]:font-bold [&_h5]:text-xs sm:[&_h5]:text-sm 
                [&_h6]:font-bold [&_h6]:text-xs sm:[&_h6]:text-sm 
                [&_strong]:font-bold [&_em]:italic 
                [&>*]:max-w-full"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
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
            <div className="mt-3 ml-0 sm:ml-12">
              <CommentForm
                postId={comment.id}
                parentId={comment.id}
                mode="reply"
                onSubmit={async (content) => {
                  // content를 직접 전달하여 낙관적 UI 즉시 실행
                  await onReplySubmit(comment.id, content)
                }}
                onCancel={() => onReplyCancel(comment.id)}
                placeholder="답글을 작성해주세요..."
                buttonText="답글 작성"
                showToolbar={true}
                enableDraft={false}
                autoFocus={true}
              />
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              isSubmitting={isSubmitting}
              replyingToId={replyingToId}
              replyContent={replyContent}
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
        </>
      )}
    </div>
  )
}
