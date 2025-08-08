'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast as sonnerToast } from 'sonner'
import { TagSelector } from '@/components/forms/TagSelector'
import { CategorySelector } from '@/components/forms/CategorySelector'
import {
  AlertCircle,
  Maximize2,
  Minimize2,
  Upload,
  X,
  FileText,
  Archive,
  Film,
  Music,
  Image as ImageIcon,
} from 'lucide-react'
import {
  LoadingSpinner,
  ButtonSpinner,
} from '@/components/shared/LoadingSpinner'
import { RichTextEditor } from '@/components/shared/RichTextEditor'

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  color: string
  icon?: string | null
  isActive?: boolean
  requiresApproval?: boolean
}

interface PostEditorProps {
  userRole?: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

// Character limits based on database schema
const CHARACTER_LIMITS = {
  title: 200,
  content: 10000,
  excerpt: 300,
  tag: 50,
}

// 카테고리 가져오기 함수
const fetchCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/main/categories')
  if (!res.ok) throw new Error('Failed to fetch categories')
  const result = await res.json()
  // API가 { data: { items: [...], pagination: {...} } } 형식으로 반환
  return result.data?.items || []
}

export function PostEditor({ userRole }: PostEditorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitState, setSubmitState] = useState<
    'idle' | 'submitting' | 'redirecting'
  >('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  // Real-time validation states
  const [validationErrors, setValidationErrors] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
  })

  // Validate input field in real-time (defined early for use in other functions)
  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'title':
        if (!value) return '제목은 필수입니다.'
        if (value.length < 5) return '제목은 5자 이상이어야 합니다.'
        if (value.length > CHARACTER_LIMITS.title)
          return `제목은 ${CHARACTER_LIMITS.title}자 이하여야 합니다.`
        return ''
      case 'content':
        if (!value) return '내용은 필수입니다.'
        if (value.length < 10) return '내용은 10자 이상이어야 합니다.'
        if (value.length > CHARACTER_LIMITS.content)
          return `내용은 ${CHARACTER_LIMITS.content}자 이하여야 합니다.`
        return ''
      case 'excerpt':
        if (value.length > CHARACTER_LIMITS.excerpt)
          return `요약은 ${CHARACTER_LIMITS.excerpt}자 이하여야 합니다.`
        return ''
      case 'category':
        if (!value) return '카테고리를 선택해주세요.'
        return ''
      default:
        return ''
    }
  }, [])

  // 카테고리 조회
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10분간 fresh
    gcTime: 30 * 60 * 1000, // 30분간 캐시
  })

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: {
      title: string
      content: string
      excerpt: string
      categoryId: string
      tags: string[]
    }) => {
      const slug =
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100) +
        '-' +
        Date.now()

      const res = await fetch('/api/main/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          slug,
          status: 'DRAFT',
        }),
      })

      if (!res.ok) throw new Error('Auto-save failed')
      return res.json()
    },
    onSuccess: () => {
      sonnerToast.success('자동 저장되었습니다.', {
        duration: 2000,
      })
    },
    onError: (error) => {
      console.error('Auto-save failed:', error)
    },
  })

  // Auto-save function (defined before usage)
  const handleAutoSave = useCallback(() => {
    if (!title || !content || !categoryId) return

    autoSaveMutation.mutate({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      categoryId,
      tags: selectedTags,
    })
  }, [title, content, excerpt, categoryId, selectedTags, autoSaveMutation])

  // 게시글 작성 mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: {
      title: string
      content: string
      excerpt: string
      categoryId: string
      tags: string[]
      status: 'DRAFT' | 'PENDING'
    }) => {
      // Generate slug
      const baseSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100)

      // Check for duplicate slug
      const checkSlugRes = await fetch(
        `/api/main/posts/check-slug?slug=${baseSlug}`
      )
      const { exists } = await checkSlugRes.json()

      const slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug

      // Auto-generate SEO metadata
      const metaTitle =
        data.title.length > 60
          ? data.title.substring(0, 57) + '...'
          : data.title
      const metaDescription =
        data.excerpt || data.content.substring(0, 155).replace(/\n/g, ' ')

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf-token='))
        ?.split('=')[1]

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }

      const response = await fetch('/api/main/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...data,
          excerpt: data.excerpt || data.content.substring(0, 200),
          slug,
          metaTitle,
          metaDescription,
          isPinned: false,
          fileIds: uploadedFiles.map((f) => f.id),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '게시글 작성에 실패했습니다')
      }

      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || '게시글 작성에 실패했습니다')
      }

      return { post: result.data, status: data.status }
    },
    onSuccess: ({ post, status }) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['mainPosts'] })
      queryClient.invalidateQueries({ queryKey: ['recentPosts'] })

      if (status === 'DRAFT') {
        sonnerToast.success('게시글이 임시저장되었습니다.')
      } else if (userRole === 'ADMIN') {
        sonnerToast.success('게시글이 성공적으로 작성되었습니다.')
      } else {
        sonnerToast.info('게시글이 관리자 승인을 기다리고 있습니다.')
      }

      // 게시글 상세 페이지로 이동
      if (post && post.id) {
        setSubmitState('redirecting')
        sonnerToast.loading('게시글 페이지로 이동 중...')
        setTimeout(() => {
          router.push(`/main/posts/${post.id}`)
        }, 500)
      }
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
      sonnerToast.error(
        error instanceof Error ? error.message : '게시글 작성에 실패했습니다'
      )
    },
    onSettled: () => {
      if (submitState !== 'redirecting') {
        setSubmitState('idle')
      }
      setIsSubmitting(false)
    },
  })

  // Submit handler (defined before usage)
  const handleSubmit = useCallback(
    (submitStatus: 'DRAFT' | 'PENDING') => {
      // Validate all fields
      const errors = {
        title: validateField('title', title),
        content: validateField('content', content),
        excerpt: validateField('excerpt', excerpt),
        category: validateField('category', categoryId),
      }

      setValidationErrors(errors)

      if (Object.values(errors).some((error) => error)) {
        sonnerToast.error('입력한 내용을 확인해주세요.')
        return
      }

      setSubmitState('submitting')
      setIsSubmitting(true)
      createPostMutation.mutate({
        title,
        content,
        excerpt,
        categoryId,
        tags: selectedTags,
        status: submitStatus,
      })
    },
    [
      title,
      content,
      excerpt,
      categoryId,
      selectedTags,
      validateField,
      createPostMutation,
    ]
  )

  // File upload mutation
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
      setUploadedFiles((prev) => [...prev, fileData])
      sonnerToast.success('파일이 업로드되었습니다.')
    },
    onError: (error) => {
      console.error('File upload error:', error)
      sonnerToast.error('파일 업로드에 실패했습니다.')
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    // 파일 크기 확인 (10MB)
    const file = selectedFiles[0]
    if (file.size > 10 * 1024 * 1024) {
      sonnerToast.error('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    uploadFileMutation.mutate(file)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith('video/')) return <Film className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar'))
      return <Archive className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (hasUnsavedChanges && title && content) {
        handleAutoSave()
      }
    }, 300000) // 5 minutes

    return () => clearInterval(autoSave)
  }, [hasUnsavedChanges, title, content, handleAutoSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter: Submit
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault()
        handleSubmit('PENDING')
      }
      // Ctrl+S: Save draft
      else if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSubmit('DRAFT')
      }
      // F11: Toggle fullscreen
      else if (e.key === 'F11') {
        e.preventDefault()
        setIsFullscreen(!isFullscreen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen, handleSubmit])

  // 폼 데이터 변경 감지
  useEffect(() => {
    const hasData = title || content || excerpt || selectedTags.length > 0
    setHasUnsavedChanges(!!hasData)
  }, [title, content, excerpt, selectedTags])

  // 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSubmitting) {
        e.preventDefault()
        e.returnValue =
          '작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, isSubmitting])

  const editorClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 overflow-auto'
    : 'min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-4 lg:p-8 relative'

  return (
    <div className={editorClasses}>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center space-y-4">
            <LoadingSpinner size="xl" />
            <div className="text-center">
              <p className="text-lg font-bold">
                {submitState === 'submitting' &&
                  '게시글을 작성하고 있습니다...'}
                {submitState === 'redirecting' && '페이지로 이동 중...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-black">
            게시글 작성하기
          </h1>
          <p className="text-gray-600">당신의 이야기를 세상과 공유해보세요</p>
        </div>

        <div className="bg-white rounded-lg border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 lg:p-10">
          <div className="grid gap-6">
            {/* Editor Column */}
            <div>
              {/* Title input */}
              <div className="mb-6">
                <Label
                  htmlFor="title"
                  className="mb-2 block text-lg font-bold text-black"
                >
                  제목 <span className="text-red-500">*</span>
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({title.length}/{CHARACTER_LIMITS.title})
                  </span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    const error = validateField('title', e.target.value)
                    setValidationErrors((prev) => ({ ...prev, title: error }))
                  }}
                  placeholder="눈길을 끄는 멋진 제목을 작성해주세요"
                  className={`border-2 border-black text-lg font-medium focus:ring-4 focus:ring-blue-200 ${
                    validationErrors.title
                      ? 'border-red-500 focus:ring-red-200'
                      : ''
                  }`}
                  disabled={isSubmitting}
                />
                {validationErrors.title && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.title}
                  </p>
                )}
              </div>

              {/* Category selection */}
              <div className="mb-6">
                <Label
                  htmlFor="category"
                  className="mb-2 block text-lg font-bold text-black"
                >
                  카테고리 <span className="text-red-500">*</span>
                </Label>
                <CategorySelector
                  value={categoryId}
                  onChange={(value) => {
                    setCategoryId(value || '')
                    const error = validateField('category', value || '')
                    setValidationErrors((prev) => ({
                      ...prev,
                      category: error,
                    }))
                  }}
                  categories={categories || []}
                  disabled={isSubmitting}
                  allowNone={false}
                  showDescription={true}
                  groupByApproval={true}
                  className={validationErrors.category ? 'border-red-500' : ''}
                />
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.category}
                  </p>
                )}
              </div>

              {/* Rich Text Editor */}
              <div className="mb-6">
                <Label
                  htmlFor="content"
                  className="mb-2 block text-lg font-bold text-black"
                >
                  내용 <span className="text-red-500">*</span>
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({content.length}/{CHARACTER_LIMITS.content})
                  </span>
                </Label>
                <RichTextEditor
                  content={content}
                  onChange={(value) => {
                    setContent(value)
                    const error = validateField('content', value)
                    setValidationErrors((prev) => ({
                      ...prev,
                      content: error,
                    }))
                  }}
                  placeholder="내용을 입력하세요..."
                  disabled={isSubmitting}
                />
                {validationErrors.content && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.content}
                  </p>
                )}
              </div>

              {/* Excerpt input */}
              <div className="mb-6">
                <Label
                  htmlFor="excerpt"
                  className="mb-2 block text-lg font-bold text-black"
                >
                  요약 (선택사항)
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({excerpt.length}/{CHARACTER_LIMITS.excerpt})
                  </span>
                </Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value)
                    const error = validateField('excerpt', e.target.value)
                    setValidationErrors((prev) => ({
                      ...prev,
                      excerpt: error,
                    }))
                  }}
                  placeholder="글의 요약을 작성해주세요. 비워두면 본문의 앞부분이 자동으로 사용됩니다."
                  className={`resize-none border-2 border-black focus:ring-4 focus:ring-blue-200 ${
                    validationErrors.excerpt
                      ? 'border-red-500 focus:ring-red-200'
                      : ''
                  }`}
                  rows={3}
                  disabled={isSubmitting}
                />
                {validationErrors.excerpt && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.excerpt}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="mb-6">
                <Label
                  htmlFor="tags"
                  className="mb-2 block text-lg font-bold text-black"
                >
                  태그 (선택사항)
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
                  showPopularTags={true}
                />
              </div>

              {/* 파일 업로드 */}
              <div className="mb-6">
                <Label
                  htmlFor="files"
                  className="mb-2 block text-lg font-bold text-black"
                >
                  파일 첨부 (선택사항)
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (최대 10MB)
                  </span>
                </Label>
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={isSubmitting}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-black p-8 text-center hover:bg-gray-50 transition-colors rounded-lg">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">
                        클릭하거나 파일을 드래그하세요
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        이미지, 문서, 압축파일 등 (최대 10MB)
                      </p>
                    </div>
                  </label>
                </div>

                {/* 업로드된 파일 목록 */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {Math.round(file.size / 1024)}KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t-2 border-gray-200 pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="outline"
                className="border-2 border-black hover:bg-gray-100"
                disabled={isSubmitting}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="mr-2 h-4 w-4" />
                    일반 모드
                  </>
                ) : (
                  <>
                    <Maximize2 className="mr-2 h-4 w-4" />
                    전체화면
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                variant="outline"
                className="border-2 border-black hover:bg-gray-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner />
                    저장 중...
                  </>
                ) : (
                  '임시저장'
                )}
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit('PENDING')}
                className="border-2 border-black bg-blue-500 font-bold text-white hover:bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner />
                    처리 중...
                  </>
                ) : userRole === 'ADMIN' ? (
                  '게시글 발행'
                ) : (
                  '검토 요청'
                )}
              </Button>
            </div>
          </div>

          {/* Keyboard shortcuts help */}
          <div className="mt-4 text-sm text-gray-600">
            <p>단축키: Ctrl+Enter (발행), Ctrl+S (임시저장), F11 (전체화면)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
