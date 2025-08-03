'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast as sonnerToast } from 'sonner'
import { X, Loader2, AlertCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
  count?: number
  color?: string
}

interface PostEditorProps {
  userRole?: string
}

// Character limits based on database schema
const CHARACTER_LIMITS = {
  title: 200,
  content: 10000,
  excerpt: 300,
  tag: 50,
}

export function PostEditor({ userRole }: PostEditorProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitState, setSubmitState] = useState<
    'idle' | 'submitting' | 'redirecting'
  >('idle')
  const [categories, setCategories] = useState<Category[]>([])
  const [existingTags, setExistingTags] = useState<Tag[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Real-time validation states
  const [validationErrors, setValidationErrors] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tag: '',
  })

  // Validate input field in real-time
  const validateField = (field: string, value: string): string => {
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
      case 'tag':
        if (!value) return ''
        if (value.length > CHARACTER_LIMITS.tag)
          return `태그는 ${CHARACTER_LIMITS.tag}자 이하여야 합니다.`
        if (!/^[a-zA-Z0-9가-힣\s-]+$/.test(value))
          return '태그는 문자, 숫자, 하이픈만 사용할 수 있습니다.'
        return ''
      default:
        return ''
    }
  }

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

  // 카테고리와 태그 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 카테고리 로드
        const categoriesRes = await fetch('/api/main/categories')
        if (categoriesRes.ok) {
          const result = await categoriesRes.json()
          // successResponse 형식으로 오는 경우 data 필드에서 실제 데이터 추출
          setCategories(result.data || result)
        }

        // 태그 로드 (인기 태그 상위 15개)
        const tagsRes = await fetch('/api/main/tags?limit=15')
        if (tagsRes.ok) {
          const result = await tagsRes.json()
          // successResponse 형식으로 오는 경우 data.tags 필드에서 실제 데이터 추출
          setExistingTags(result.data?.tags || [])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [])

  // 태그 추가
  const handleAddTag = () => {
    if (!tagInput.trim()) return

    // Validate tag
    const error = validateField('tag', tagInput)
    if (error) {
      setValidationErrors((prev) => ({ ...prev, tag: error }))
      return
    }

    const tagSlug = tagInput.toLowerCase().replace(/\s+/g, '-')
    if (!selectedTags.includes(tagSlug)) {
      if (selectedTags.length >= 10) {
        sonnerToast.error('태그는 최대 10개까지 추가할 수 있습니다.', {
          description: '태그 제한',
        })
        return
      }
      setSelectedTags([...selectedTags, tagSlug])
      setTagInput('')
      setValidationErrors((prev) => ({ ...prev, tag: '' }))
    } else {
      sonnerToast.error('이미 추가된 태그입니다.', {
        description: '중복 태그',
      })
    }
  }

  // 태그 제거
  const handleRemoveTag = (tagSlug: string) => {
    setSelectedTags(selectedTags.filter((slug) => slug !== tagSlug))
  }

  // 게시글 저장
  const handleSubmit = async (submitStatus: 'DRAFT' | 'PENDING') => {
    // Validate all fields
    const errors = {
      title: validateField('title', title),
      content: validateField('content', content),
      excerpt: validateField('excerpt', excerpt),
      category: validateField('category', categoryId),
      tag: '',
    }

    setValidationErrors(errors)

    if (Object.values(errors).some((error) => error)) {
      sonnerToast.error('입력한 내용을 확인해주세요.', {
        description: '입력 오류',
      })
      return
    }

    setIsSubmitting(true)
    setSubmitState('submitting')

    try {
      // slug 생성 (제목 기반)
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100) +
        '-' +
        Date.now()

      const response = await fetch('/api/main/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          slug,
          categoryId,
          status: submitStatus,
          tags: selectedTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '게시글 작성에 실패했습니다')
      }

      const result = await response.json()

      // API 응답 구조 처리: { success: true, data: post }
      if (!result.success || !result.data) {
        throw new Error(result.error || '게시글 작성에 실패했습니다')
      }

      const post = result.data

      if (submitStatus === 'DRAFT') {
        sonnerToast.success('게시글이 임시저장되었습니다.', {
          description: '임시저장 완료',
        })
      } else if (userRole === 'ADMIN') {
        sonnerToast.success('게시글이 성공적으로 작성되었습니다.', {
          description: '게시글 작성 완료',
        })
      } else {
        sonnerToast.info('게시글이 관리자 승인을 기다리고 있습니다.', {
          description: '승인 대기',
        })
      }

      // 게시글 상세 페이지로 이동
      if (post && post.id) {
        setSubmitState('redirecting')
        sonnerToast.loading('게시글 페이지로 이동 중...', {
          id: 'redirecting',
        })
        setTimeout(() => {
          router.push(`/main/posts/${post.id}`)
        }, 500) // 사용자가 피드백을 볼 수 있도록 약간의 지연
      } else {
        console.error('Post ID not found in response:', result)
        setSubmitState('redirecting')
        sonnerToast.loading('게시글 목록으로 이동 중...', {
          id: 'redirecting',
        })
        setTimeout(() => {
          router.push('/main/posts')
        }, 500)
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      sonnerToast.error(
        error instanceof Error ? error.message : '게시글 작성에 실패했습니다',
        {
          description: '오류',
        }
      )
    } finally {
      // 리다이렉트 중이 아닐 때만 상태 초기화
      if (submitState !== 'redirecting') {
        setIsSubmitting(false)
        setSubmitState('idle')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-4 sm:p-8 relative">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <div className="text-center">
              <p className="text-lg font-bold">
                {submitState === 'submitting' &&
                  '게시글을 저장하고 있습니다...'}
                {submitState === 'redirecting' && '페이지로 이동 중...'}
              </p>
              <p className="text-sm text-gray-600 mt-1">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black mb-2">
            새 게시글 작성
          </h1>
          <p className="text-lg text-gray-600">
            개발 지식과 경험을 공유해주세요.
          </p>
        </header>

        {/* Main Card */}
        <main className="bg-white p-6 sm:p-8 rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
          <form className="space-y-8">
            {/* 기본 정보 섹션 */}
            <section>
              <h2 className="text-2xl font-bold mb-4">기본 정보</h2>
              <div className="space-y-6">
                {/* 카테고리 선택 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="category" className="text-lg font-bold">
                      카테고리 <span className="text-red-500">*</span>
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        게시글의 주제에 맞는 카테고리를 선택해주세요.
                      </div>
                    </div>
                  </div>
                  <Select
                    value={categoryId}
                    onValueChange={(value) => {
                      setCategoryId(value)
                      const error = validateField('category', value)
                      setValidationErrors((prev) => ({
                        ...prev,
                        category: error,
                      }))
                    }}
                  >
                    <SelectTrigger
                      className={`w-full p-3 border-3 rounded-lg focus:ring-2 focus:ring-blue-200 transition-colors ${
                        validationErrors.category
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                    >
                      <SelectValue placeholder="카테고리를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.category}
                    </p>
                  )}
                </div>

                {/* 제목 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="title" className="text-lg font-bold">
                      제목 <span className="text-red-500">*</span>
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        독자의 관심을 끌 수 있는 명확하고 구체적인 제목을
                        작성해주세요.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => {
                        const value = e.target.value
                        setTitle(value)
                        const error = validateField('title', value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          title: error,
                        }))
                      }}
                      placeholder="예: React Hook의 성능 최적화 방법"
                      maxLength={CHARACTER_LIMITS.title}
                      className={`w-full p-3 border-3 rounded-lg focus:ring-2 focus:ring-blue-200 transition-colors pr-16 ${
                        validationErrors.title
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {title.length}/{CHARACTER_LIMITS.title}
                    </div>
                  </div>
                  {validationErrors.title && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.title}
                    </p>
                  )}
                </div>

                {/* 내용 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="content" className="text-lg font-bold">
                      내용 <span className="text-red-500">*</span>
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        마크다운 문법을 사용하여 풍부한 내용을 작성할 수
                        있습니다.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => {
                        const value = e.target.value
                        setContent(value)
                        const error = validateField('content', value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          content: error,
                        }))
                      }}
                      placeholder="게시글 내용을 작성해주세요.\n\n마크다운 문법을 지원합니다:\n- # 제목\n- **굵은 글씨**\n- *기울임*\n- `코드`\n- ```코드 블록```"
                      rows={15}
                      maxLength={CHARACTER_LIMITS.content}
                      className={`w-full p-3 border-3 rounded-lg resize-none focus:ring-2 focus:ring-blue-200 transition-colors pr-20 ${
                        validationErrors.content
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                      required
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                      {content.length}/{CHARACTER_LIMITS.content}
                    </div>
                  </div>
                  {validationErrors.content && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.content}
                    </p>
                  )}
                </div>

                {/* 요약 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="excerpt" className="text-lg font-bold">
                      요약
                      <span className="text-base font-medium text-gray-500 ml-2">
                        (선택사항)
                      </span>
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        게시글의 핵심 내용을 간략하게 요약해주세요. 비워두면
                        본문에서 자동으로 추출됩니다.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => {
                        const value = e.target.value
                        setExcerpt(value)
                        const error = validateField('excerpt', value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          excerpt: error,
                        }))
                      }}
                      placeholder="게시글 요약을 입력해주세요 (미입력시 자동 생성)"
                      rows={3}
                      maxLength={CHARACTER_LIMITS.excerpt}
                      className={`w-full p-3 border-3 rounded-lg resize-none focus:ring-2 focus:ring-blue-200 transition-colors pr-16 ${
                        validationErrors.excerpt
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                      {excerpt.length}/{CHARACTER_LIMITS.excerpt}
                    </div>
                  </div>
                  {validationErrors.excerpt && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.excerpt}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 구분선 */}
            <div className="border-t-2 border-dashed border-gray-300"></div>

            {/* 태그 섹션 */}
            <section>
              <h2 className="text-2xl font-bold mb-4">태그</h2>
              <div>
                <div className="flex items-center mb-2">
                  <Label htmlFor="tags" className="text-lg font-bold">
                    태그 추가
                  </Label>
                  <div className="ml-2 group relative">
                    <span className="material-icons text-gray-500 cursor-help text-sm">
                      help_outline
                    </span>
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                      게시글과 관련된 키워드를 태그로 추가하세요. 최대 10개까지
                      추가할 수 있습니다.
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => {
                        const value = e.target.value
                        setTagInput(value)
                        if (value) {
                          const error = validateField('tag', value)
                          setValidationErrors((prev) => ({
                            ...prev,
                            tag: error,
                          }))
                        } else {
                          setValidationErrors((prev) => ({
                            ...prev,
                            tag: '',
                          }))
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder="태그를 입력하고 Enter"
                      maxLength={CHARACTER_LIMITS.tag}
                      className={`w-full p-3 border-3 rounded-lg focus:ring-2 focus:ring-blue-200 transition-colors pr-16 ${
                        validationErrors.tag
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {tagInput.length}/{CHARACTER_LIMITS.tag}
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    className="bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                  >
                    추가
                  </Button>
                </div>
                {validationErrors.tag && (
                  <p className="text-sm text-red-500 mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {validationErrors.tag}
                  </p>
                )}

                {/* 선택된 태그 */}
                {selectedTags.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      선택된 태그 ({selectedTags.length}/10)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tagSlug) => (
                        <Badge
                          key={tagSlug}
                          variant="secondary"
                          className="px-3 py-1 text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)] transition-all font-bold"
                        >
                          #{tagSlug}
                          <X
                            className="ml-2 h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => handleRemoveTag(tagSlug)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 인기 태그 추천 */}
                {existingTags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      인기 태그 (클릭하여 추가)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {existingTags.slice(0, 15).map((tag) => {
                        const isSelected = selectedTags.includes(tag.slug)
                        return (
                          <Badge
                            key={tag.id}
                            variant={isSelected ? 'secondary' : 'outline'}
                            className={`cursor-pointer transition-all duration-200 font-bold ${
                              isSelected
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                            }`}
                            style={{
                              borderColor: tag.color || '#6366f1',
                              color: isSelected
                                ? '#9ca3af'
                                : tag.color || '#6366f1',
                              backgroundColor: isSelected
                                ? '#f3f4f6'
                                : 'transparent',
                            }}
                            onClick={() => {
                              if (!isSelected && selectedTags.length < 10) {
                                setSelectedTags([...selectedTags, tag.slug])
                              } else if (selectedTags.length >= 10) {
                                sonnerToast.error(
                                  '태그는 최대 10개까지 추가할 수 있습니다.',
                                  {
                                    description: '태그 제한',
                                  }
                                )
                              }
                            }}
                          >
                            #{tag.name}
                            {tag.count !== undefined && tag.count > 0 && (
                              <span className="ml-1 text-xs opacity-70">
                                ({tag.count})
                              </span>
                            )}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 제출 버튼 섹션 */}
            <div className="border-t-2 border-black pt-8">
              <div className="space-y-4">
                {/* 유효성 검사 요약 */}
                {Object.values(validationErrors).some((error) => error) && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <h3 className="font-bold text-red-700 mb-2">
                      입력 오류가 있습니다:
                    </h3>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationErrors.title && (
                        <li>• {validationErrors.title}</li>
                      )}
                      {validationErrors.content && (
                        <li>• {validationErrors.content}</li>
                      )}
                      {validationErrors.excerpt && (
                        <li>• {validationErrors.excerpt}</li>
                      )}
                      {validationErrors.category && (
                        <li>• {validationErrors.category}</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-initial px-6 py-3 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleSubmit('DRAFT')}
                    disabled={
                      isSubmitting ||
                      Object.values(validationErrors).some((error) => error)
                    }
                    className="flex-1 sm:flex-initial px-6 py-3 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📝 임시저장
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSubmit('PENDING')}
                    disabled={
                      isSubmitting ||
                      Object.values(validationErrors).some((error) => error)
                    }
                    className="flex-1 sm:flex-auto px-6 py-3 font-bold text-white bg-blue-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        저장 중...
                      </>
                    ) : userRole === 'ADMIN' ? (
                      '✨ 게시글 발행'
                    ) : (
                      '📤 게시 요청'
                    )}
                  </Button>
                </div>

                {/* 안내 메시지 */}
                <p className="text-center text-sm text-gray-600">
                  {userRole === 'ADMIN'
                    ? '관리자는 게시글이 즉시 발행됩니다.'
                    : '게시글은 관리자 검토 후 발행됩니다.'}
                </p>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
