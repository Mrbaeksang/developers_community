'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Send,
  Save,
  X,
  Bold,
  Italic,
  Code,
  Link,
  List,
  Smile,
} from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { debounce } from 'lodash'
import { apiClient } from '@/lib/api/client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface CommentFormProps {
  postId: string
  parentId?: string
  initialContent?: string
  mode?: 'create' | 'edit' | 'reply'
  commentId?: string // for edit mode
  onSubmit?: (content: string) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  autoFocus?: boolean
  placeholder?: string
  buttonText?: string
  minRows?: number
  maxRows?: number
  showToolbar?: boolean
  enableDraft?: boolean
  className?: string
}

// 이모지 팔레트
const EMOJI_LIST = [
  '😊',
  '😂',
  '❤️',
  '👍',
  '🔥',
  '💯',
  '🎉',
  '🤔',
  '😎',
  '🙏',
  '💪',
  '✨',
]

export function CommentForm({
  postId,
  parentId,
  initialContent = '',
  mode = 'create',
  commentId,
  onSubmit,
  onSuccess,
  onCancel,
  autoFocus = false,
  placeholder = '댓글을 작성해주세요...',
  buttonText = '댓글 작성',
  minRows = 3,
  maxRows = 10,
  showToolbar = true,
  enableDraft = true,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent)
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isToolbarInteracting, setIsToolbarInteracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Tiptap editor for rich text editing
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // 댓글에서는 헤딩, 코드블록, 수평선 등 제외
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setContent(html)
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
  })

  // Update editor content when initialContent changes
  useEffect(() => {
    if (editor && initialContent !== content) {
      editor.commands.setContent(initialContent)
      setContent(initialContent)
    }
  }, [editor, initialContent])

  // Auto-focus editor
  useEffect(() => {
    if (autoFocus && editor) {
      editor.commands.focus()
    }
  }, [autoFocus, editor])

  // 포커스 시 확장
  useEffect(() => {
    if (isFocused || content.length > 0 || isToolbarInteracting) {
      setIsExpanded(true)
    } else {
      setIsExpanded(false)
    }
  }, [isFocused, content, isToolbarInteracting])

  // 자동 저장 (로컬스토리지)
  const saveDraft = useCallback(() => {
    if (!enableDraft || !content.trim()) return

    const draftKey = `comment-draft-${postId}${parentId ? `-${parentId}` : ''}`
    localStorage.setItem(draftKey, content)
    setLastSaved(new Date())
    setIsSaving(false)
  }, [content, postId, parentId, enableDraft])

  // Debounced 자동 저장
  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        setIsSaving(true)
        saveDraft()
      }, 1500),
    [saveDraft]
  )

  // 임시저장 불러오기 (create mode only)
  useEffect(() => {
    if (!enableDraft || mode !== 'create') return

    const draftKey = `comment-draft-${postId}${parentId ? `-${parentId}` : ''}`
    const savedDraft = localStorage.getItem(draftKey)
    if (savedDraft && !initialContent) {
      setContent(savedDraft)
      toast({
        title: '임시 저장된 댓글을 불러왔습니다',
      })
    }
  }, [postId, parentId, enableDraft, mode, initialContent, toast])

  // 내용 변경 시 자동 저장
  useEffect(() => {
    if (enableDraft && content) {
      debouncedSave()
    }
  }, [content, enableDraft, debouncedSave])

  // 이모지 삽입 함수
  const insertEmoji = (emoji: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(emoji).run()
  }

  // 폼 제출
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // 이미 제출 중이면 중복 실행 방지
    if (isSubmitting) {
      return
    }

    // 마지막 제출로부터 1초 이내면 방지
    const now = Date.now()
    if (now - lastSubmitTime < 1000) {
      toast({
        title: '잠시 후 다시 시도해주세요',
        variant: 'destructive',
      })
      return
    }

    // Check if editor has content (strip HTML tags for validation)
    const textContent = editor?.getText().trim() || ''
    if (!textContent) {
      toast({
        title: '댓글 내용을 입력해주세요',
        variant: 'destructive',
      })
      return
    }

    // 제출 상태 설정
    setIsSubmitting(true)
    setLastSubmitTime(now)

    // 타임아웃 설정 (10초)
    submitTimeoutRef.current = setTimeout(() => {
      setIsSubmitting(false)
      toast({
        title: '요청 시간이 초과되었습니다',
        description: '다시 시도해주세요',
        variant: 'destructive',
      })
    }, 10000)

    try {
      // Custom submit handler or default API call
      if (onSubmit) {
        await onSubmit(content)
      } else {
        // Default API call for create mode
        const endpoint =
          mode === 'edit' && commentId
            ? `/api/main/comments/${commentId}`
            : `/api/main/posts/${postId}/comments`

        const method = mode === 'edit' ? 'PUT' : 'POST'
        const body = mode === 'edit' ? { content } : { content, parentId }

        const response = await apiClient(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!response.success) {
          throw new Error(
            response.error ||
              `댓글 ${mode === 'edit' ? '수정' : '작성'}에 실패했습니다`
          )
        }
      }

      // 성공 시 타임아웃 클리어
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }

      // Clear draft on success
      if (enableDraft && mode === 'create') {
        const draftKey = `comment-draft-${postId}${parentId ? `-${parentId}` : ''}`
        localStorage.removeItem(draftKey)
      }

      if (mode === 'create') {
        setContent('')
        editor?.commands.setContent('')
        setIsExpanded(false)
      }
      onSuccess?.()
    } catch (error) {
      // 에러 발생 시 타임아웃 클리어
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }

      toast({
        title: `댓글 ${mode === 'edit' ? '수정' : '작성'}에 실패했습니다`,
        description:
          error instanceof Error ? error.message : '다시 시도해주세요.',
        variant: 'destructive',
      })
    } finally {
      // 제출 상태 해제
      setIsSubmitting(false)
    }
  }

  // 임시저장 삭제
  const clearDraft = () => {
    if (enableDraft) {
      const draftKey = `comment-draft-${postId}${parentId ? `-${parentId}` : ''}`
      localStorage.removeItem(draftKey)
    }
    setContent('')
    editor?.commands.setContent('')
    setLastSaved(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tiptap 툴바 */}
      {showToolbar && isExpanded && editor && (
        <div
          ref={toolbarRef}
          className="flex items-center gap-1 p-2 border-2 border-black rounded-lg bg-gray-50"
          onMouseEnter={() => setIsToolbarInteracting(true)}
          onMouseLeave={() => setIsToolbarInteracting(false)}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'h-8 w-8 p-0 hover:bg-gray-200',
              editor.isActive('bold') && 'bg-gray-300'
            )}
            title="굵게 (Ctrl+B)"
            disabled={isSubmitting}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'h-8 w-8 p-0 hover:bg-gray-200',
              editor.isActive('italic') && 'bg-gray-300'
            )}
            title="기울임 (Ctrl+I)"
            disabled={isSubmitting}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'h-8 w-8 p-0 hover:bg-gray-200',
              editor.isActive('code') && 'bg-gray-300'
            )}
            title="인라인 코드"
            disabled={isSubmitting}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'h-8 w-8 p-0 hover:bg-gray-200',
              editor.isActive('bulletList') && 'bg-gray-300'
            )}
            title="목록"
            disabled={isSubmitting}
          >
            <List className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* 이모지 선택기 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-200"
                title="이모지"
                disabled={isSubmitting}
                onFocus={(e) => e.preventDefault()}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onInteractOutside={(e) => {
                // 툴바와의 상호작용인 경우 닫지 않음
                if (toolbarRef.current?.contains(e.target as Node)) {
                  e.preventDefault()
                }
              }}
            >
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    className="h-10 w-10 p-0 hover:bg-gray-100 text-xl"
                    onClick={() => {
                      insertEmoji(emoji)
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* 자동 저장 표시 */}
          {enableDraft && lastSaved && (
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
              {isSaving ? (
                <span>저장 중...</span>
              ) : (
                <>
                  <Save className="h-3 w-3" />
                  <span>자동 저장됨</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tiptap 에디터 영역 */}
      <div className="relative">
        <div
          className={cn(
            'border-2 border-black transition-all duration-200',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            isFocused && 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-50',
            isSubmitting && 'opacity-50 cursor-not-allowed'
          )}
        >
          {editor ? (
            <EditorContent
              editor={editor}
              className={cn(
                'prose prose-sm max-w-none p-3',
                isExpanded ? 'min-h-[100px]' : 'min-h-[60px]',
                '[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[50px]',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
                '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0'
              )}
            />
          ) : (
            <div className="p-3 min-h-[60px] animate-pulse bg-gray-100" />
          )}
        </div>

        {/* 임시저장 삭제 버튼 */}
        {enableDraft && content && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDraft}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-200 z-10"
            title="임시저장 삭제"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* 버튼 영역 */}
      {isExpanded && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onCancel) {
                onCancel()
              } else {
                setContent(initialContent)
                editor?.commands.setContent(initialContent)
                setIsExpanded(false)
                setIsFocused(false)
              }
            }}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!editor?.getText().trim() || isSubmitting}
            className={cn(
              'border-2 border-black font-bold',
              'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
              'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
              'active:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                제출 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {buttonText}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
