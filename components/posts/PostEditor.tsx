'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast as sonnerToast } from 'sonner'
import type { ApiResponse } from '@/lib/api/response'
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
import {
  TetrisLoading,
  isMobileDevice,
} from '@/components/shared/TetrisLoading'
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
  mode?: 'create' | 'edit'
  initialData?: {
    id: string
    title: string
    content: string
    excerpt: string
    categoryId: string
    tags: string[]
  }
  userRole?: string
  postType?: 'main' | 'community'
  communityId?: string
  initialCategories?: Category[]
  initialCategorySlug?: string
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
const fetchCategories = async (
  postType: string,
  communityId?: string
): Promise<Category[]> => {
  const endpoint =
    postType === 'community' && communityId
      ? `/api/communities/${communityId}/categories`
      : '/api/main/categories'

  const res = await fetch(endpoint)
  if (!res.ok) throw new Error('Failed to fetch categories')
  const result = await res.json()
  // API가 { data: { items: [...], pagination: {...} } } 형식으로 반환
  return result.data?.items || []
}

export function PostEditor({
  mode = 'create',
  initialData,
  userRole,
  postType = 'main',
  communityId,
  initialCategories,
  initialCategorySlug,
}: PostEditorProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitState, setSubmitState] = useState<
    'idle' | 'submitting' | 'redirecting'
  >('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 폼 상태 - 초기값은 mode와 initialData에 따라 설정
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialData?.tags || []
  )
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

  // 모바일 체크
  useEffect(() => {
    setIsMobile(isMobileDevice())

    // 리사이즈 이벤트에서도 체크
    const handleResize = () => {
      setIsMobile(isMobileDevice())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 카테고리 조회
  const { data: categories = initialCategories || [] } = useQuery({
    queryKey: ['categories', postType, communityId],
    queryFn: () => fetchCategories(postType, communityId),
    initialData: initialCategories,
    enabled: !initialCategories, // initialCategories가 있으면 API 호출 안 함
    staleTime: 10 * 60 * 1000, // 10분간 fresh
    gcTime: 30 * 60 * 1000, // 30분간 캐시
  })

  // URL 파라미터로 전달된 카테고리 slug로 categoryId 설정
  useEffect(() => {
    if (initialCategorySlug && categories.length > 0 && !categoryId) {
      const category = categories.find((c) => c.slug === initialCategorySlug)
      if (category) {
        setCategoryId(category.id)
      }
    }
  }, [initialCategorySlug, categories, categoryId])

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

      const endpoint =
        postType === 'community' && communityId
          ? `/api/communities/${communityId}/posts`
          : '/api/main/posts'

      const res = await fetch(endpoint, {
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
    // Edit 모드에서는 자동 저장 비활성화
    if (mode === 'edit') return
    if (!title || !content || !categoryId) return

    autoSaveMutation.mutate({
      title,
      content,
      excerpt: excerpt || content.substring(0, 200),
      categoryId,
      tags: selectedTags,
    })
  }, [
    title,
    content,
    excerpt,
    categoryId,
    selectedTags,
    autoSaveMutation,
    mode,
  ])

  // 게시글 수정 mutation (edit mode용)
  const updatePostMutation = useMutation({
    mutationFn: async (data: {
      title: string
      content: string
      excerpt: string
      categoryId: string
      tags: string[]
    }) => {
      if (!initialData?.id) {
        throw new Error('게시글 ID가 없습니다.')
      }

      // 태그 slug를 ID로 변환
      let tagIds: string[] = []
      if (data.tags.length > 0) {
        try {
          // 먼저 모든 태그를 조회 또는 생성
          const tagPromises = data.tags.map(async (slug) => {
            const tagRes = await fetch(
              `/api/main/tags/by-slug?slug=${encodeURIComponent(slug)}`
            )
            if (tagRes.ok) {
              const tagData = await tagRes.json()
              if (tagData.success && tagData.data) {
                return tagData.data.id
              }
            }
            // 태그가 없으면 생성
            const createRes = await fetch('/api/main/tags', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: slug, slug }),
            })
            if (createRes.ok) {
              const created = await createRes.json()
              if (created.success && created.data) {
                return created.data.id
              }
            }
            return null
          })
          const results = await Promise.all(tagPromises)
          tagIds = results.filter((id): id is string => id !== null)
        } catch (error) {
          console.error('Failed to process tags:', error)
          // 태그 처리 실패해도 계속 진행
        }
      }

      const endpoint =
        postType === 'community' && communityId
          ? `/api/communities/${communityId}/posts/${initialData.id}`
          : `/api/main/posts/${initialData.id}`

      const { apiClient } = await import('@/lib/api/client')

      // 커뮤니티는 PATCH, 메인은 PUT 메서드 사용
      const method = postType === 'community' ? 'PATCH' : 'PUT'

      // 커뮤니티와 메인의 body 구조가 다름
      const requestBody =
        postType === 'community'
          ? {
              title: data.title,
              content: data.content,
              categoryId: data.categoryId,
              // 커뮤니티는 fileIds 사용 (태그 시스템 없음)
            }
          : {
              title: data.title,
              content: data.content,
              excerpt: data.excerpt || data.content.substring(0, 200),
              categoryId: data.categoryId,
              tagIds, // 메인만 태그 사용
            }

      const result = await apiClient(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      // 더 자세한 에러 로깅
      if (!result.success) {
        const errorResult = result as ApiResponse & {
          errors?: Record<string, string | string[]>
        }
        console.error('Update failed:', {
          endpoint,
          method,
          requestBody,
          error: errorResult.error,
          message: errorResult.message,
          errors: errorResult.errors, // validation errors
        })

        // Validation 에러인 경우 더 구체적인 메시지
        if (errorResult.errors) {
          const firstError = Object.values(errorResult.errors)[0]
          const errorMsg = Array.isArray(firstError)
            ? firstError[0]
            : firstError
          throw new Error(
            errorMsg || errorResult.error || '게시글 수정에 실패했습니다'
          )
        }

        throw new Error(result.error || '게시글 수정에 실패했습니다')
      }

      if (!result.data) {
        console.error('No data in response:', result)
        throw new Error('응답 데이터가 없습니다')
      }

      return result.data as { id: string }
    },
    onSuccess: (post) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['mainPosts'] })
      queryClient.invalidateQueries({ queryKey: ['recentPosts'] })
      queryClient.invalidateQueries({ queryKey: ['post', initialData?.id] })

      sonnerToast.success('게시글이 성공적으로 수정되었습니다.')

      // 게시글 상세 페이지로 이동
      if (post && post.id) {
        setSubmitState('redirecting')
        const loadingToast = sonnerToast.loading('게시글 페이지로 이동 중...')
        setTimeout(() => {
          sonnerToast.dismiss(loadingToast)
          if (postType === 'community' && communityId) {
            router.push(`/communities/${communityId}/posts/${post.id}`)
          } else {
            router.push(`/main/posts/${post.id}`)
          }
        }, 500)
      }
    },
    onError: (error) => {
      console.error('Failed to update post:', error)
      sonnerToast.error(
        error instanceof Error ? error.message : '게시글 수정에 실패했습니다'
      )
      setHasUnsavedChanges(true) // 에러 발생 시 unsaved changes 플래그 복원
    },
    onSettled: () => {
      if (submitState !== 'redirecting') {
        setSubmitState('idle')
      }
      setIsSubmitting(false)
    },
  })

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
      // 필수 필드 검증
      if (!data.title || !data.content || !data.categoryId) {
        throw new Error('필수 정보가 누락되었습니다.')
      }

      // Generate slug
      const baseSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100)

      let slug = baseSlug

      // 메인 게시글만 slug 중복 체크 (커뮤니티는 API 없음)
      if (postType === 'main') {
        try {
          const checkSlugRes = await fetch(
            `/api/main/posts/check-slug?slug=${baseSlug}`
          )
          if (checkSlugRes.ok) {
            const { exists } = await checkSlugRes.json()
            slug = exists ? `${baseSlug}-${Date.now()}` : baseSlug
          }
        } catch (error) {
          // slug 체크 실패해도 계속 진행
          console.warn('Slug check failed:', error)
          slug = `${baseSlug}-${Date.now()}`
        }
      } else {
        // 커뮤니티는 항상 timestamp 추가
        slug = `${baseSlug}-${Date.now()}`
      }

      // Auto-generate SEO metadata
      const metaTitle =
        data.title.length > 60
          ? data.title.substring(0, 57) + '...'
          : data.title
      const metaDescription =
        data.excerpt || data.content.substring(0, 155).replace(/\n/g, ' ')

      const endpoint =
        postType === 'community' && communityId
          ? `/api/communities/${communityId}/posts`
          : '/api/main/posts'

      const { apiClient } = await import('@/lib/api/client')

      const result = await apiClient(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (!result.success || !result.data) {
        throw new Error(result.error || '게시글 작성에 실패했습니다')
      }

      const postData = result.data as { id: string; isQACategory?: boolean }
      return {
        post: postData,
        status: data.status,
        categoryId: data.categoryId,
        isQACategory: postData?.isQACategory || false,
      }
    },
    onSuccess: ({ post, status, categoryId, isQACategory }) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['mainPosts'] })
      queryClient.invalidateQueries({ queryKey: ['recentPosts'] })

      // API 응답에서 받은 isQACategory 사용
      const selectedCategory = categories.find((c) => c.id === categoryId)

      if (status === 'DRAFT') {
        sonnerToast.success('게시글이 임시저장되었습니다.')
        // 임시저장은 바로 이동
        if (post && post.id) {
          setSubmitState('redirecting')
          setTimeout(() => {
            if (postType === 'community' && communityId) {
              router.push(`/communities/${communityId}/posts/${post.id}`)
            } else {
              router.push(`/main/posts/${post.id}`)
            }
          }, 500)
        }
      } else if (
        userRole === 'ADMIN' ||
        (selectedCategory && !selectedCategory.requiresApproval)
      ) {
        if (isQACategory) {
          // Q&A 카테고리는 AI 응답 대기 중 표시하지 않고 바로 이동
          // (서버에서 이미 AI 응답 생성을 기다림)
          sonnerToast.success('게시글이 작성되었습니다.')
          if (post && post.id) {
            setSubmitState('redirecting')
            // Q&A 게시글인 경우 localStorage에 플래그 설정
            if (isQACategory) {
              localStorage.setItem(`qa_post_${post.id}`, 'true')
            }
            const loadingToast =
              sonnerToast.loading('게시글 페이지로 이동 중...')
            setTimeout(() => {
              sonnerToast.dismiss(loadingToast)
              router.push(`/main/posts/${post.id}`)
            }, 500)
          }
        } else {
          sonnerToast.success('게시글이 성공적으로 작성되었습니다.')
          if (post && post.id) {
            setSubmitState('redirecting')
            const loadingToast =
              sonnerToast.loading('게시글 페이지로 이동 중...')
            setTimeout(() => {
              sonnerToast.dismiss(loadingToast)
              if (postType === 'community' && communityId) {
                router.push(`/communities/${communityId}/posts/${post.id}`)
              } else {
                router.push(`/main/posts/${post.id}`)
              }
            }, 500)
          }
        }
      } else {
        sonnerToast.info('게시글이 관리자 승인을 기다리고 있습니다.')
        // 승인 대기도 페이지로 이동
        if (post && post.id) {
          setSubmitState('redirecting')
          setTimeout(() => {
            if (postType === 'community' && communityId) {
              router.push(`/communities/${communityId}/posts/${post.id}`)
            } else {
              router.push(`/main/posts/${post.id}`)
            }
          }, 500)
        }
      }
    },
    onError: (error) => {
      console.error('Failed to create post:', error)
      sonnerToast.error(
        error instanceof Error ? error.message : '게시글 작성에 실패했습니다'
      )
      setHasUnsavedChanges(true) // 에러 발생 시 unsaved changes 플래그 복원
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
      setHasUnsavedChanges(false) // 제출 시작 시 unsaved changes 플래그 해제

      if (mode === 'edit') {
        // 수정 모드에서는 status 파라미터가 없음
        updatePostMutation.mutate({
          title,
          content,
          excerpt,
          categoryId,
          tags: selectedTags,
        })
      } else {
        // 작성 모드
        createPostMutation.mutate({
          title,
          content,
          excerpt,
          categoryId,
          tags: selectedTags,
          status: submitStatus,
        })
      }
    },
    [
      mode,
      title,
      content,
      excerpt,
      categoryId,
      selectedTags,
      validateField,
      createPostMutation,
      updatePostMutation,
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
          <div className="bg-white rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center space-y-4 max-w-md">
            {/* 모바일이면 기존 스피너, 데스크톱이면 테트리스 로딩 */}
            {isMobile ? (
              <LoadingSpinner size="xl" variant="brutal" />
            ) : (
              <TetrisLoading
                size="md"
                text={(() => {
                  const selectedCat = categories.find(
                    (c) => c.id === categoryId
                  )
                  const isQA = selectedCat
                    ? ['qa', 'qna', 'question', 'help', '질문', '문의'].some(
                        (qa) =>
                          selectedCat.slug.toLowerCase().includes(qa) ||
                          selectedCat.name.toLowerCase().includes(qa)
                      )
                    : false

                  if (submitState === 'submitting') {
                    if (isQA && mode === 'create') {
                      return '게시글을 작성하고 AI 답변을 준비하고 있습니다...'
                    }
                    return '게시글을 작성하고 있습니다...'
                  }
                  if (submitState === 'redirecting') {
                    if (isQA && mode === 'create') {
                      return 'AI가 답변을 생성 중입니다. 잠시 후 게시글로 이동합니다...'
                    }
                    return '페이지로 이동 중...'
                  }
                  return '처리 중...'
                })()}
              />
            )}

            {/* 모바일에서만 텍스트 표시 (테트리스 로딩은 텍스트 내장) */}
            {isMobile && (
              <div className="text-center space-y-2">
                <p className="text-lg font-bold">
                  {(() => {
                    const selectedCat = categories.find(
                      (c) => c.id === categoryId
                    )
                    const isQA = selectedCat
                      ? ['qa', 'qna', 'question', 'help', '질문', '문의'].some(
                          (qa) =>
                            selectedCat.slug.toLowerCase().includes(qa) ||
                            selectedCat.name.toLowerCase().includes(qa)
                        )
                      : false

                    if (submitState === 'submitting') {
                      if (isQA && mode === 'create') {
                        return '게시글을 작성하고 AI 답변을 준비하고 있습니다...'
                      }
                      return '게시글을 작성하고 있습니다...'
                    }
                    if (submitState === 'redirecting') {
                      if (isQA && mode === 'create') {
                        return 'AI가 답변을 생성 중입니다. 잠시 후 게시글로 이동합니다...'
                      }
                      return '페이지로 이동 중...'
                    }
                    return '처리 중...'
                  })()}
                </p>
                {(() => {
                  const selectedCat = categories.find(
                    (c) => c.id === categoryId
                  )
                  const isQA = selectedCat
                    ? ['qa', 'qna', 'question', 'help', '질문', '문의'].some(
                        (qa) =>
                          selectedCat.slug.toLowerCase().includes(qa) ||
                          selectedCat.name.toLowerCase().includes(qa)
                      )
                    : false

                  if (isQA && mode === 'create') {
                    return (
                      <p className="text-sm text-gray-600">
                        AI가 귀하의 질문을 분석하고 최적의 답변을 생성하고
                        있습니다. 게시글 페이지로 이동하면 AI 답변을 확인하실 수
                        있습니다.
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-black">
            {mode === 'edit' ? '게시글 수정하기' : '게시글 작성하기'}
          </h1>
          <p className="text-gray-600">
            {mode === 'edit'
              ? '게시글을 수정하여 더 나은 내용으로 만들어보세요'
              : '당신의 이야기를 세상과 공유해보세요'}
          </p>
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
                    (최대 5개)
                  </span>
                </Label>
                <TagSelector
                  value={selectedTags}
                  onChange={setSelectedTags}
                  maxTags={5}
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
              {mode === 'create' && (
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
              )}
              <Button
                type="button"
                onClick={() =>
                  handleSubmit(mode === 'edit' ? 'PENDING' : 'PENDING')
                }
                className="border-2 border-black bg-blue-500 font-bold text-white hover:bg-blue-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ButtonSpinner />
                    {(() => {
                      const selectedCat = categories.find(
                        (c) => c.id === categoryId
                      )
                      const isQA = selectedCat
                        ? [
                            'qa',
                            'qna',
                            'question',
                            'help',
                            '질문',
                            '문의',
                          ].some(
                            (qa) =>
                              selectedCat.slug.toLowerCase().includes(qa) ||
                              selectedCat.name.toLowerCase().includes(qa)
                          )
                        : false
                      return isQA && mode === 'create'
                        ? 'AI 답변 생성 중...'
                        : '처리 중...'
                    })()}
                  </>
                ) : mode === 'edit' ? (
                  '수정 완료'
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
