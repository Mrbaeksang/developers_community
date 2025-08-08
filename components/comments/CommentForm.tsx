'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bold, Italic, Code, Link, Smile, Save, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { debounce } from 'lodash'
import { apiClient } from '@/lib/api/client'
import { ImageUploader } from '@/components/shared/ImageUploader'

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
  const [rows, setRows] = useState(minRows)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isToolbarInteracting, setIsToolbarInteracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // 포커스 시 확장
  useEffect(() => {
    if (isFocused || content.length > 0 || isToolbarInteracting) {
      setIsExpanded(true)
    } else {
      setIsExpanded(false)
    }
  }, [isFocused, content, isToolbarInteracting])

  // 자동 높이 조절
  useEffect(() => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const lineHeight = 24 // 대략적인 줄 높이
    const lines = content.split('\n').length
    const contentLines = Math.ceil(textarea.scrollHeight / lineHeight)
    const newRows = Math.max(
      minRows,
      Math.min(maxRows, Math.max(lines, contentLines))
    )
    setRows(newRows)
  }, [content, minRows, maxRows])

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

  // 이미지 마크다운 삽입
  const handleImageInsert = useCallback(
    (markdown: string) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const newContent =
        content.substring(0, start) + markdown + content.substring(end)
      setContent(newContent)

      // 이미지 마크다운 뒤로 커서 이동
      setTimeout(() => {
        const newPosition = start + markdown.length
        textarea.focus()
        textarea.setSelectionRange(newPosition, newPosition)
      }, 0)
    },
    [content]
  )

  // 마크다운 삽입 함수
  const insertMarkdown = (type: string, text = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = ''
    let cursorPosition = start

    switch (type) {
      case 'bold':
        newText = `**${selectedText || text || '굵은 텍스트'}**`
        cursorPosition = start + 2
        break
      case 'italic':
        newText = `*${selectedText || text || '기울임 텍스트'}*`
        cursorPosition = start + 1
        break
      case 'code':
        newText = `\`${selectedText || text || '코드'}\``
        cursorPosition = start + 1
        break
      case 'link':
        newText = `[${selectedText || text || '링크 텍스트'}](url)`
        cursorPosition = start + 1
        break
      case 'mention':
        newText = `@${text}`
        cursorPosition = start + newText.length
        break
      case 'emoji':
        newText = text
        cursorPosition = start + newText.length
        break
      default:
        return
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)

    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(cursorPosition, cursorPosition)
    }, 0)
  }

  // 이미지 붙여넣기 처리
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue

        // 이미지 업로드 시뮬레이션 (실제로는 API 호출)
        toast({
          title: '이미지 업로드 중...',
        })

        // 실제 구현 시 여기서 이미지 업로드 API 호출
        // const url = await uploadImage(file)
        // insertMarkdown('', `![이미지](${url})`)

        // 임시로 플레이스홀더 삽입
        insertMarkdown('', '![이미지](이미지_URL)')
      }
    }
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

    if (!content.trim()) {
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
        await onSubmit(content.trim())
      } else {
        // Default API call for create mode
        const endpoint =
          mode === 'edit' && commentId
            ? `/api/main/comments/${commentId}`
            : `/api/main/posts/${postId}/comments`

        const method = mode === 'edit' ? 'PUT' : 'POST'
        const body =
          mode === 'edit'
            ? { content: content.trim() }
            : { content: content.trim(), parentId }

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
    setLastSaved(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* 마크다운 툴바 */}
      {showToolbar && isExpanded && (
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
            onClick={() => insertMarkdown('bold')}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="굵게 (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('italic')}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="기울임 (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('code')}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="코드 (Ctrl+`)"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown('link')}
            className="h-8 w-8 p-0 hover:bg-gray-200"
            title="링크 (Ctrl+K)"
          >
            <Link className="h-4 w-4" />
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
                onFocus={(e) => e.preventDefault()}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-2 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              onInteractOutside={(e) => {
                // 툴바나 textarea와의 상호작용인 경우 닫지 않음
                if (
                  toolbarRef.current?.contains(e.target as Node) ||
                  textareaRef.current?.contains(e.target as Node)
                ) {
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
                      insertMarkdown('emoji', emoji)
                      // 이모지 선택 후 textarea로 포커스 이동
                      textareaRef.current?.focus()
                    }}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <ImageUploader
            onImageInsert={handleImageInsert}
            disabled={isSubmitting}
            showPreview={true}
          />

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

      {/* 텍스트 영역 */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={rows}
          autoFocus={autoFocus}
          disabled={isSubmitting}
          className={cn(
            'border-2 border-black transition-all duration-200 resize-none',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            isFocused && 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-50',
            isExpanded && 'min-h-[100px]',
            isSubmitting && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* 임시저장 삭제 버튼 */}
        {enableDraft && content && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearDraft}
            className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-200"
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
            disabled={!content.trim() || isSubmitting}
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
