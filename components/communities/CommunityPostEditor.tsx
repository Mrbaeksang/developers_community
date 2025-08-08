'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { TagSelector } from '@/components/forms/TagSelector'
import { CategorySelector } from '@/components/forms/CategorySelector'
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Archive,
  Film,
  Music,
  Maximize2,
  Minimize2,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { debounce } from 'lodash'
import { RichTextEditor } from '@/components/shared/RichTextEditor'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  color: string
  icon?: string | null
  isActive?: boolean
  communityId?: string
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

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [files, setFiles] = useState<UploadedFile[]>([])

  // UI state
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 파일 업로드 mutation

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf-token='))
        ?.split('=')[1]

      const headers: Record<string, string> = {}
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers,
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
                <CategorySelector
                  value={categoryId === 'none' ? null : categoryId}
                  onChange={(value) => setCategoryId(value || 'none')}
                  categories={categories}
                  disabled={isSubmitting}
                  allowNone={true}
                  showDescription={false}
                  groupByApproval={false}
                />
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

            {/* Rich Text Editor */}
            <div>
              <Label>내용</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="내용을 입력하세요..."
                disabled={isSubmitting}
              />
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
