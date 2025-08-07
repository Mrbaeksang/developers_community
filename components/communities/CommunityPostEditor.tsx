'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { TagSelector } from '@/components/forms/TagSelector'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Archive,
  Film,
  Music,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import debounce from 'lodash/debounce'

// Lazy load ReactMarkdown for better performance
const ReactMarkdown = lazy(() => import('react-markdown'))

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface CommunityPostEditorProps {
  communityId: string
  communitySlug?: string
  categories: Category[]
  allowFileUpload: boolean
  maxFileSize: number
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export function CommunityPostEditor({
  communityId,
  communitySlug,
  categories,
  allowFileUpload,
  maxFileSize,
}: CommunityPostEditorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const contentRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])

  // UI state
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 파일 업로드 mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to upload file')

      const data = await res.json()
      return data.success && data.data ? data.data : data
    },
    onSuccess: (fileData) => {
      setFiles((prev) => [...prev, fileData])
      toast.success('파일이 업로드되었습니다.')
    },
    onError: (error) => {
      console.error('File upload error:', error)
      toast.error('파일 업로드에 실패했습니다.')
    },
    onSettled: () => {
      setIsUploading(false)
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    // 파일 크기 확인
    const file = selectedFiles[0]
    if (file.size > maxFileSize) {
      toast.error(
        `파일 크기는 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과할 수 없습니다.`
      )
      return
    }

    setIsUploading(true)
    uploadFileMutation.mutate(file)
  }

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith('video/')) return <Film className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar'))
      return <Archive className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  // Markdown helper functions
  const insertMarkdown = useCallback(
    (type: string) => {
      if (!contentRef.current) return

      const textarea = contentRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = content.substring(start, end)
      let newText = ''
      let cursorPosition = start

      switch (type) {
        case 'bold':
          newText = `**${selectedText || '굵은 텍스트'}**`
          cursorPosition = start + 2
          break
        case 'italic':
          newText = `*${selectedText || '기울임 텍스트'}*`
          cursorPosition = start + 1
          break
        case 'ul':
          newText = `\n- ${selectedText || '목록 항목'}`
          cursorPosition = start + 3
          break
        case 'ol':
          newText = `\n1. ${selectedText || '번호 항목'}`
          cursorPosition = start + 4
          break
        case 'link':
          newText = `[${selectedText || '링크 텍스트'}](url)`
          cursorPosition = start + 1
          break
        case 'code':
          if (selectedText.includes('\n')) {
            newText = `\`\`\`\n${selectedText}\n\`\`\``
            cursorPosition = start + 4
          } else {
            newText = `\`${selectedText || '코드'}\``
            cursorPosition = start + 1
          }
          break
        case 'quote':
          newText = `> ${selectedText || '인용문'}`
          cursorPosition = start + 2
          break
        default:
          return
      }

      const newContent =
        content.substring(0, start) + newText + content.substring(end)
      setContent(newContent)

      // Set cursor position after state update
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(cursorPosition, cursorPosition)
      }, 0)
    },
    [content]
  )

  // Autosave functionality
  const saveToLocalStorage = useCallback(() => {
    if (!title && !content) return

    const draft = {
      title,
      content,
      categoryId,
      tags: selectedTags,
      timestamp: new Date().toISOString(),
    }

    localStorage.setItem(
      `community-draft-${communityId}`,
      JSON.stringify(draft)
    )
    setLastSaved(new Date())
    setIsSaving(false)
  }, [title, content, categoryId, selectedTags, communityId])

  // Debounced autosave
  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        setIsSaving(true)
        saveToLocalStorage()
      }, 2000),
    [saveToLocalStorage]
  )

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`community-draft-${communityId}`)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setTitle(draft.title || '')
        setContent(draft.content || '')
        setCategoryId(draft.categoryId || '')
        setSelectedTags(draft.tags || [])
        toast.info('임시 저장된 글을 불러왔습니다.')
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [communityId])

  // Autosave on content change
  useEffect(() => {
    if (title || content) {
      debouncedSave()
    }
  }, [title, content, categoryId, selectedTags, debouncedSave])

  // Fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  // 게시글 작성 mutation
  const submitMutation = useMutation({
    mutationFn: async (data: {
      title: string
      content: string
      categoryId?: string | null
      tags: string[]
      files: UploadedFile[]
    }) => {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          categoryId: data.categoryId,
          tags: data.tags,
          fileIds: data.files.map((f) => f.id),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '게시글 작성 실패')
      }
      const result = await res.json()
      return result.success && result.data ? result.data : result
    },
    onSuccess: (data) => {
      toast.success('게시글이 작성되었습니다.')
      queryClient.invalidateQueries({
        queryKey: ['communityPosts', communityId],
      })
      router.push(
        `/communities/${communitySlug || communityId}/posts/${data.id}`
      )
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
      toast.error('게시글 작성에 실패했습니다.')
    },
    onSettled: () => {
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }

    if (!content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    // Clear draft on successful submission
    submitMutation.mutate(
      {
        title,
        content,
        categoryId: categoryId === 'none' ? null : categoryId || null,
        tags: selectedTags,
        files,
      },
      {
        onSuccess: () => {
          localStorage.removeItem(`community-draft-${communityId}`)
        },
      }
    )
  }

  return (
    <div
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto' : ''}`}
    >
      <Card
        className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isFullscreen ? 'h-full rounded-none border-0' : ''}`}
      >
        <CardContent className="p-6">
          {/* Autosave indicator */}
          {lastSaved && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
              <Save className="h-4 w-4" />
              {isSaving
                ? '저장 중...'
                : `마지막 저장: ${lastSaved.toLocaleTimeString()}`}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 */}
            {categories.length > 0 && (
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black">
                    <SelectItem value="none" className="cursor-pointer">
                      카테고리 없음
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 제목 */}
            <div>
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                disabled={isSubmitting}
              />
            </div>

            {/* Content with Preview Grid */}
            <div
              className={`grid ${showPreview ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-1'}`}
            >
              {/* Editor Column */}
              <div>
                {/* Markdown Toolbar */}
                <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border-2 border-black bg-gray-50 p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('bold')}
                    className="hover:bg-gray-100"
                    title="굵게"
                    disabled={isSubmitting}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('italic')}
                    className="hover:bg-gray-100"
                    title="기울임"
                    disabled={isSubmitting}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 w-px bg-gray-300" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('ul')}
                    className="hover:bg-gray-100"
                    title="글머리 기호"
                    disabled={isSubmitting}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('ol')}
                    className="hover:bg-gray-100"
                    title="번호 목록"
                    disabled={isSubmitting}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <div className="mx-1 w-px bg-gray-300" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('link')}
                    className="hover:bg-gray-100"
                    title="링크"
                    disabled={isSubmitting}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('code')}
                    className="hover:bg-gray-100"
                    title="코드"
                    disabled={isSubmitting}
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertMarkdown('quote')}
                    className="hover:bg-gray-100"
                    title="인용"
                    disabled={isSubmitting}
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content Textarea */}
                <div>
                  <Label htmlFor="content">내용</Label>
                  <Textarea
                    id="content"
                    ref={contentRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="마크다운 문법을 사용할 수 있습니다."
                    rows={showPreview ? 15 : 10}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] font-mono"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Preview Column */}
              {showPreview && (
                <div className="border-l-2 border-gray-200 pl-6">
                  <h3 className="mb-4 text-lg font-bold">미리보기</h3>
                  <div className="prose prose-sm max-w-none">
                    <h1 className="text-2xl font-bold">
                      {title || '제목을 입력해주세요'}
                    </h1>
                    <Suspense
                      fallback={
                        <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
                      }
                    >
                      <ReactMarkdown>
                        {content || '내용을 입력해주세요'}
                      </ReactMarkdown>
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            {/* 태그 */}
            <div>
              <Label>
                태그
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (최대 10개)
                </span>
              </Label>
              <TagSelector
                value={selectedTags}
                onChange={setSelectedTags}
                maxTags={10}
                placeholder="태그를 입력하고 Enter를 누르세요"
                disabled={isSubmitting}
                showPopularTags={false} // 커뮤니티는 자체 태그 시스템 사용
              />
            </div>

            {/* 파일 업로드 */}
            {allowFileUpload && (
              <div>
                <Label>파일 첨부</Label>
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-black p-8 text-center hover:bg-gray-50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        클릭하거나 파일을 드래그하세요
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        최대 {Math.round(maxFileSize / 1024 / 1024)}MB
                      </p>
                    </div>
                  </label>
                </div>

                {/* 업로드된 파일 목록 */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border-2 border-black rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(file.size / 1024)}KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  title={showPreview ? '미리보기 닫기' : '미리보기 열기'}
                >
                  {showPreview ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {showPreview ? '미리보기 닫기' : '미리보기'}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  title={isFullscreen ? '전체화면 종료' : '전체화면'}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                  <span className="ml-2">
                    {isFullscreen ? '일반 모드' : '전체화면'}
                  </span>
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  {isSubmitting ? '게시 중...' : '게시하기'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  취소
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
