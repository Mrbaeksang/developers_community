'use client'

import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Edit, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
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
  onReplySubmit: (parentId: string) => void
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
    <div className={`${depth > 0 ? 'ml-12' : ''}`}>
      <div className="flex gap-3 mb-4">
        <div className="flex-shrink-0">
          <AuthorAvatar
            author={comment.author}
            size="md"
            enableDropdown
            dropdownAlign="start"
          />
        </div>
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
                minRows={3}
                maxRows={10}
                autoFocus={true}
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    // 링크를 새 탭에서 열도록 설정
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {children}
                      </a>
                    ),
                    // 코드 블록 스타일링
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match
                      return isInline ? (
                        <code
                          className="px-1 py-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block p-3 bg-gray-100 rounded-lg text-sm font-mono overflow-x-auto"
                          {...props}
                        >
                          {children}
                        </code>
                      )
                    },
                    // 인용문 스타일링
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                        {children}
                      </blockquote>
                    ),
                    // 리스트 스타일링
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1">
                        {children}
                      </ol>
                    ),
                    // 제목 크기 제한 (댓글에서는 작은 제목만 허용)
                    h1: ({ children }) => (
                      <strong className="text-base">{children}</strong>
                    ),
                    h2: ({ children }) => (
                      <strong className="text-base">{children}</strong>
                    ),
                    h3: ({ children }) => (
                      <strong className="text-sm">{children}</strong>
                    ),
                    h4: ({ children }) => (
                      <strong className="text-sm">{children}</strong>
                    ),
                    h5: ({ children }) => (
                      <strong className="text-sm">{children}</strong>
                    ),
                    h6: ({ children }) => (
                      <strong className="text-sm">{children}</strong>
                    ),
                  }}
                >
                  {comment.content}
                </ReactMarkdown>
              </div>
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
              <CommentForm
                postId={comment.id}
                parentId={comment.id}
                mode="reply"
                onSubmit={async (content) => {
                  // onReplySubmit이 Promise를 반환하도록 수정 필요
                  onReplyChange(comment.id, content)
                  await onReplySubmit(comment.id)
                }}
                onCancel={() => onReplyCancel(comment.id)}
                placeholder="답글을 작성해주세요..."
                buttonText="답글 작성"
                showToolbar={true}
                enableDraft={false}
                minRows={2}
                maxRows={5}
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
