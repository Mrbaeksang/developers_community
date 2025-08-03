'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
import {
  X,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDropzone } from 'react-dropzone'
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

// Keyboard shortcuts
const KEYBOARD_SHORTCUTS = {
  'Ctrl+B': 'bold',
  'Ctrl+I': 'italic',
  'Ctrl+K': 'link',
  'Ctrl+Enter': 'submit',
  'Ctrl+S': 'save',
  F11: 'fullscreen',
  'Ctrl+/': 'preview',
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)

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
  }, [])

  // Auto-save function (defined before usage)
  const handleAutoSave = useCallback(async () => {
    try {
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100) +
        '-' +
        Date.now()

      await fetch('/api/main/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          slug,
          categoryId,
          status: 'DRAFT',
          tags: selectedTags,
        }),
      })

      sonnerToast.success('자동 저장되었습니다.', {
        duration: 2000,
      })
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [title, content, excerpt, categoryId, selectedTags])

  // Submit handler (defined before usage)
  const handleSubmit = useCallback(
    async (submitStatus: 'DRAFT' | 'PENDING') => {
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
        sonnerToast.error('입력한 내용을 확인해주세요.')
        return
      }

      setIsSubmitting(true)
      setSubmitState('submitting')

      try {
        // Generate slug
        const baseSlug = title
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
          title.length > 60 ? title.substring(0, 57) + '...' : title
        const metaDescription =
          excerpt || content.substring(0, 155).replace(/\n/g, ' ')

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
            metaTitle,
            metaDescription,
            isPinned: false, // Admin can change this later
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

        const post = result.data

        if (submitStatus === 'DRAFT') {
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
      } catch (error) {
        console.error('Failed to create post:', error)
        sonnerToast.error(
          error instanceof Error ? error.message : '게시글 작성에 실패했습니다'
        )
      } finally {
        if (submitState !== 'redirecting') {
          setIsSubmitting(false)
          setSubmitState('idle')
        }
      }
    },
    [
      title,
      content,
      excerpt,
      categoryId,
      selectedTags,
      userRole,
      router,
      submitState,
      validateField,
    ]
  )

  // Common image upload handler (defined after validateField but before useEffect)
  const handleImageUpload = useCallback(
    async (file: File) => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        sonnerToast.error('이미지 파일만 업로드할 수 있습니다.')
        return
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        sonnerToast.error('파일 크기는 10MB 이하여야 합니다.')
        return
      }

      setUploadingImage(true)

      try {
        // Upload to server
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(
            error.error?.message || '이미지 업로드에 실패했습니다.'
          )
        }

        const result = await response.json()
        const imageUrl = result.data.url
        const markdownImage = `\n![${file.name}](${imageUrl})\n`

        if (contentRef.current) {
          const position = contentRef.current.selectionStart
          const newContent =
            content.slice(0, position) + markdownImage + content.slice(position)
          setContent(newContent)

          // Set cursor position after the image
          setTimeout(() => {
            contentRef.current?.focus()
            const newPosition = position + markdownImage.length
            contentRef.current?.setSelectionRange(newPosition, newPosition)
          }, 0)
        }

        sonnerToast.success('이미지가 업로드되었습니다.')
      } catch (error) {
        console.error('Image upload failed:', error)
        sonnerToast.error(
          error instanceof Error
            ? error.message
            : '이미지 업로드에 실패했습니다.'
        )
      } finally {
        setUploadingImage(false)
      }
    },
    [content]
  )

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setInterval(() => {
      if (hasUnsavedChanges && title && content) {
        handleAutoSave()
      }
    }, 300000) // 5 minutes

    return () => clearInterval(autoSave)
  }, [hasUnsavedChanges, title, content, handleAutoSave])

  // Keyboard shortcuts and clipboard paste
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
      // Ctrl+/: Toggle preview
      else if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setShowPreview(!showPreview)
      }
    }

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await handleImageUpload(file)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('paste', handlePaste)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('paste', handlePaste)
    }
  }, [isFullscreen, showPreview, handleImageUpload, handleSubmit])

  // Markdown toolbar functions
  const insertMarkdown = (type: string) => {
    if (!contentRef.current) return

    const textarea = contentRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    let newText = ''
    let cursorOffset = 0

    switch (type) {
      case 'bold':
        newText = `**${selectedText || '굵은 텍스트'}**`
        cursorOffset = selectedText ? newText.length : 2
        break
      case 'italic':
        newText = `*${selectedText || '기울임 텍스트'}*`
        cursorOffset = selectedText ? newText.length : 1
        break
      case 'h1':
        newText = `# ${selectedText || '제목 1'}`
        cursorOffset = 2
        break
      case 'h2':
        newText = `## ${selectedText || '제목 2'}`
        cursorOffset = 3
        break
      case 'h3':
        newText = `### ${selectedText || '제목 3'}`
        cursorOffset = 4
        break
      case 'ul':
        newText = `- ${selectedText || '목록 항목'}`
        cursorOffset = 2
        break
      case 'ol':
        newText = `1. ${selectedText || '번호 목록 항목'}`
        cursorOffset = 3
        break
      case 'link':
        newText = `[${selectedText || '링크 텍스트'}](URL)`
        cursorOffset = selectedText ? newText.length - 5 : 1
        break
      case 'code':
        if (selectedText.includes('\n')) {
          newText = `\`\`\`\n${selectedText}\n\`\`\``
          cursorOffset = 4
        } else {
          newText = `\`${selectedText || '코드'}\``
          cursorOffset = selectedText ? newText.length : 1
        }
        break
      case 'quote':
        newText = `> ${selectedText || '인용문'}`
        cursorOffset = 2
        break
    }

    const newContent =
      content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)

    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset)
    }, 0)
  }

  // Image upload handler for drag & drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        await handleImageUpload(file)
      }
    },
    [handleImageUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: false,
    noClick: true,
  })

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
          setCategories(result.data || result)
        }

        // 태그 로드 (인기 태그 상위 15개)
        const tagsRes = await fetch('/api/main/tags?limit=15')
        if (tagsRes.ok) {
          const result = await tagsRes.json()
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
        sonnerToast.error('태그는 최대 10개까지 추가할 수 있습니다.')
        return
      }
      setSelectedTags([...selectedTags, tagSlug])
      setTagInput('')
      setValidationErrors((prev) => ({ ...prev, tag: '' }))
    } else {
      sonnerToast.error('이미 추가된 태그입니다.')
    }
  }

  // 태그 제거
  const handleRemoveTag = (tagSlug: string) => {
    setSelectedTags(selectedTags.filter((slug) => slug !== tagSlug))
  }

  const editorClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 overflow-auto'
    : 'min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 p-4 sm:p-8 relative'

  return (
    <div className={editorClasses}>
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

      <div className={`${isFullscreen ? 'p-8' : ''} max-w-7xl mx-auto`}>
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
          {/* Toolbar */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="font-bold"
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {showPreview ? '편집' : '미리보기'}
                </span>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="font-bold"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {isFullscreen ? '일반' : '전체화면'}
                </span>
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              단축키:{' '}
              {Object.entries(KEYBOARD_SHORTCUTS)
                .map(([key, action]) => (
                  <span key={key} className="ml-2">
                    <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">
                      {key}
                    </kbd>{' '}
                    {action}
                  </span>
                ))
                .slice(0, 3)}
              ...
            </div>
          </div>

          <form className="space-y-8">
            {/* 기본 정보 섹션 */}
            <section>
              <h2 className="text-2xl font-bold mb-4">기본 정보</h2>
              <div className="space-y-6">
                {/* 카테고리 선택 */}
                <div>
                  <Label htmlFor="category" className="text-lg font-bold">
                    카테고리 <span className="text-red-500">*</span>
                  </Label>
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
                  <Label htmlFor="title" className="text-lg font-bold">
                    제목 <span className="text-red-500">*</span>
                  </Label>
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

                {/* 내용 with Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content" className="text-lg font-bold">
                      내용 <span className="text-red-500">*</span>
                    </Label>
                    {!showPreview && (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('bold')}
                          title="굵게 (Ctrl+B)"
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('italic')}
                          title="기울임 (Ctrl+I)"
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('h1')}
                          title="제목 1"
                        >
                          <Heading1 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('h2')}
                          title="제목 2"
                        >
                          <Heading2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('h3')}
                          title="제목 3"
                        >
                          <Heading3 className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('ul')}
                          title="목록"
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('ol')}
                          title="번호 목록"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-300 mx-1" />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('link')}
                          title="링크 (Ctrl+K)"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('code')}
                          title="코드"
                        >
                          <Code className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => insertMarkdown('quote')}
                          title="인용"
                        >
                          <Quote className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div
                    className={`grid ${showPreview ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}
                  >
                    {/* Editor */}
                    <div className="relative" {...getRootProps()}>
                      <input {...getInputProps()} />
                      <Textarea
                        ref={contentRef}
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
                        placeholder="게시글 내용을 작성해주세요.\n\n마크다운 문법을 지원합니다:\n- # 제목\n- **굵은 글씨**\n- *기울임*\n- `코드`\n- ```코드 블록```\n\n이미지는 드래그 앤 드롭으로 추가할 수 있습니다."
                        rows={25}
                        maxLength={CHARACTER_LIMITS.content}
                        className={`w-full p-4 border-3 rounded-lg resize-none focus:ring-2 focus:ring-blue-200 transition-colors font-mono text-sm ${
                          validationErrors.content
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-black focus:border-blue-600'
                        } ${isDragActive ? 'bg-blue-50' : ''}`}
                        required
                      />
                      {isDragActive && (
                        <div className="absolute inset-0 bg-blue-500/10 border-3 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
                          <div className="bg-white p-4 rounded-lg border-2 border-blue-500">
                            <ImageIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-sm font-bold text-blue-600">
                              이미지를 놓아주세요
                            </p>
                          </div>
                        </div>
                      )}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                      )}
                      <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                        {content.length}/{CHARACTER_LIMITS.content}
                      </div>
                    </div>

                    {/* Preview */}
                    {showPreview && (
                      <div className="border-3 border-black rounded-lg p-4 bg-gray-50 overflow-auto max-h-[600px]">
                        <div className="prose prose-lg max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-3xl font-bold mb-4">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-2xl font-bold mb-3">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-xl font-bold mb-2">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="mb-4">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc pl-6 mb-4">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal pl-6 mb-4">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4">
                                  {children}
                                </blockquote>
                              ),
                              code: ({ children, ...props }) => {
                                const className = props.className || ''
                                const isInline =
                                  !className.includes('language-')
                                return isInline ? (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                                    <code className="text-sm">{children}</code>
                                  </pre>
                                )
                              },
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  className="text-blue-600 underline hover:text-blue-800"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              ),
                              img: ({ src, alt }) => (
                                <img
                                  src={src}
                                  alt={alt}
                                  className="max-w-full h-auto rounded-lg my-4"
                                />
                              ),
                            }}
                          >
                            {content ||
                              '*내용을 입력하면 여기에 미리보기가 표시됩니다.*'}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {validationErrors.content && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {validationErrors.content}
                    </p>
                  )}

                  {/* Image upload hint */}
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <Upload className="h-4 w-4" />
                    <span>
                      이미지를 드래그 앤 드롭하거나 클립보드에서
                      붙여넣기(Ctrl+V)할 수 있습니다.
                    </span>
                  </div>
                </div>

                {/* 요약 */}
                <div>
                  <Label htmlFor="excerpt" className="text-lg font-bold">
                    요약
                    <span className="text-base font-medium text-gray-500 ml-2">
                      (선택사항)
                    </span>
                  </Label>
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
                <Label htmlFor="tags" className="text-lg font-bold">
                  태그 추가
                </Label>
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
                                  '태그는 최대 10개까지 추가할 수 있습니다.'
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
                    📝 임시저장 (Ctrl+S)
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
                      '✨ 게시글 발행 (Ctrl+Enter)'
                    ) : (
                      '📤 게시 요청 (Ctrl+Enter)'
                    )}
                  </Button>
                </div>

                {/* 안내 메시지 */}
                <p className="text-center text-sm text-gray-600">
                  {userRole === 'ADMIN'
                    ? '관리자는 게시글이 즉시 발행됩니다.'
                    : '게시글은 관리자 검토 후 발행됩니다.'}
                  <br />
                  5분마다 자동으로 임시저장됩니다.
                </p>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
