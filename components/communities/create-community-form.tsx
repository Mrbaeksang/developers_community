'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useMutation, useQuery } from '@tanstack/react-query'
// Removed unused Card imports
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
// Removed Switch import - using custom toggle
import { Check, X, Image as ImageIcon } from 'lucide-react'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_AVATARS, getAvatarFromName } from '@/lib/community/utils'
import { defaultBanners } from '@/lib/ui/banner'
import { RECOMMENDED_BANNER_IMAGES } from '@/lib/ui/unsplash'
import { getDefaultBlurPlaceholder } from '@/lib/ui/images'

export default function CreateCommunityForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<
    (typeof DEFAULT_AVATARS)[0] | null
  >(null)
  const [bannerType, setBannerType] = useState<
    'default' | 'upload' | 'unsplash' | 'none'
  >('none')
  const [selectedDefaultBanner, setSelectedDefaultBanner] = useState<
    (typeof defaultBanners)[0] | null
  >(null)
  const [selectedUnsplashImage, setSelectedUnsplashImage] = useState<
    (typeof RECOMMENDED_BANNER_IMAGES)[0] | null
  >(null)
  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState('')
  const [unsplashSearchResults, setUnsplashSearchResults] = useState<
    typeof RECOMMENDED_BANNER_IMAGES
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // CSRF 토큰 초기화
  useEffect(() => {
    const initCSRF = async () => {
      try {
        await fetch('/api/csrf-token')
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error)
      }
    }
    initCSRF()
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    rules: '',
    avatar: '',
    banner: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    allowFileUpload: true,
    allowChat: true,
    maxFileSize: 10485760, // 10MB default - fixed value
  })

  // Character limits based on database schema
  const CHARACTER_LIMITS = {
    name: 50,
    slug: 50,
    description: 500,
    rules: 5000,
  }

  // Real-time validation states
  const [validationErrors, setValidationErrors] = useState({
    name: '',
    slug: '',
    description: '',
    rules: '',
  })

  // Validate input field in real-time
  const validateField = (field: string, value: string): string => {
    switch (field) {
      case 'name':
        if (!value) return '커뮤니티 이름은 필수입니다.'
        if (value.length < 2) return '커뮤니티 이름은 2자 이상이어야 합니다.'
        if (value.length > CHARACTER_LIMITS.name)
          return `커뮤니티 이름은 ${CHARACTER_LIMITS.name}자 이하여야 합니다.`
        return ''
      case 'slug':
        if (!value) return 'URL 슬러그는 필수입니다.'
        if (value.length < 2) return 'URL 슬러그는 2자 이상이어야 합니다.'
        if (value.length > CHARACTER_LIMITS.slug)
          return `URL 슬러그는 ${CHARACTER_LIMITS.slug}자 이하여야 합니다.`
        if (!/^[a-z0-9-]+$/.test(value))
          return 'URL 슬러그는 소문자, 숫자, 하이픈만 사용할 수 있습니다.'
        return ''
      case 'description':
        if (value.length > CHARACTER_LIMITS.description)
          return `설명은 ${CHARACTER_LIMITS.description}자 이하여야 합니다.`
        return ''
      case 'rules':
        if (value.length > CHARACTER_LIMITS.rules)
          return `규칙은 ${CHARACTER_LIMITS.rules}자 이하여야 합니다.`
        return ''
      default:
        return ''
    }
  }

  // 커뮤니티 이름 변경시 자동으로 기본 아바타 선택
  useEffect(() => {
    if (formData.name && !selectedDefaultAvatar) {
      const avatar = getAvatarFromName(formData.name)
      setSelectedDefaultAvatar(avatar)
    }
  }, [formData.name, selectedDefaultAvatar])

  // 폼 데이터 변경 감지
  useEffect(() => {
    const hasData =
      formData.name || formData.slug || formData.description || formData.rules
    setHasUnsavedChanges(!!hasData)
  }, [formData])

  // 파일 업로드 핸들러 (배너 전용)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 5MB 이하여야 합니다.',
        variant: 'destructive',
      })
      return
    }

    // 실제로는 서버에 업로드하고 URL을 받아야 함
    // 여기서는 임시로 local URL 사용
    const url = URL.createObjectURL(file)
    setBannerPreview(url)
    setFormData({ ...formData, banner: url })
  }

  // 파일 업로드 버튼 핸들러
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleUnsplashSearch = () => {
    if (!unsplashSearchQuery.trim()) {
      toast({
        title: '검색어를 입력하세요',
        description: '검색어를 입력한 후 검색해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsSearching(true)

    // 시뮬레이션된 검색 결과 (실제로는 API 호출)
    setTimeout(() => {
      const searchResults = RECOMMENDED_BANNER_IMAGES.filter(
        (img) =>
          img.tags.some((tag) =>
            tag.toLowerCase().includes(unsplashSearchQuery.toLowerCase())
          ) ||
          img.description
            .toLowerCase()
            .includes(unsplashSearchQuery.toLowerCase())
      )

      if (searchResults.length === 0) {
        // 검색 결과가 없을 때는 기본 추천 이미지 표시
        setUnsplashSearchResults(RECOMMENDED_BANNER_IMAGES)
        toast({
          title: '검색 결과가 없습니다',
          description: '다른 키워드로 검색해보세요. 추천 이미지를 표시합니다.',
        })
      } else {
        setUnsplashSearchResults(searchResults)
        toast({
          title: '검색 완료',
          description: `${searchResults.length}개의 이미지를 찾았습니다.`,
        })
      }

      setIsSearching(false)
    }, 500)
  }

  // 커뮤니티 생성 mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (
      data: typeof formData & { avatar: string; banner: string }
    ) => {
      // CSRF 토큰 가져오기
      const csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrf-token='))
        ?.split('=')[1]

      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('커뮤니티 생성 실패:', error)
        throw new Error(
          error.error || error.message || '커뮤니티 생성에 실패했습니다.'
        )
      }

      return res.json()
    },
    onSuccess: (result) => {
      toast({
        title: '성공',
        description: '커뮤니티가 생성되었습니다.',
      })

      // API 응답 구조에 맞게 slug 추출
      const createdSlug = result.data?.slug || result.slug || formData.slug

      // 사용자가 생성 완료를 인지할 수 있도록 약간의 딜레이 추가
      setTimeout(() => {
        router.push(`/communities/${createdSlug}`)
      }, 500)
    },
    onError: (error: Error) => {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive',
      })
      setIsCreating(false)
    },
  })

  // 페이지 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        (hasUnsavedChanges || isCreating) &&
        !createCommunityMutation.isPending
      ) {
        e.preventDefault()
        e.returnValue =
          '작성 중인 내용이 있습니다. 정말 페이지를 떠나시겠습니까?'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges, createCommunityMutation.isPending, isCreating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.slug) {
      toast({
        title: '오류',
        description: '커뮤니티 이름과 URL을 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    // 중복 체크 확인
    if (nameAvailable === false) {
      toast({
        title: '오류',
        description: '이미 사용 중인 커뮤니티 이름입니다.',
        variant: 'destructive',
      })
      return
    }

    if (slugAvailable === false) {
      toast({
        title: '오류',
        description: '이미 사용 중인 URL입니다.',
        variant: 'destructive',
      })
      return
    }

    // 아바타 설정 안했으면 기본 아바타 사용
    let finalAvatar = formData.avatar
    if (!finalAvatar && selectedDefaultAvatar) {
      finalAvatar = `default:${selectedDefaultAvatar.name}`
    }

    // 배너 설정
    let finalBanner = formData.banner
    if (bannerType === 'default' && selectedDefaultBanner) {
      finalBanner = `default:${selectedDefaultBanner.id}`
    } else if (bannerType === 'unsplash' && selectedUnsplashImage) {
      finalBanner = `unsplash:${selectedUnsplashImage.url}`
    }

    setIsCreating(true)
    createCommunityMutation.mutate({
      ...formData,
      avatar: finalAvatar,
      banner: finalBanner,
    })
  }

  // 슬러그 자동 생성 - 패턴 검증 포함
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/[가-힣]/g, '') // 한글 제거
      .substring(0, CHARACTER_LIMITS.slug) // 최대 길이 제한
  }

  // 슬러그 중복 체크
  const { data: slugCheckResult, isLoading: isCheckingSlug } = useQuery({
    queryKey: ['checkSlug', formData.slug],
    queryFn: async () => {
      const res = await fetch('/api/communities/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: formData.slug }),
      })

      if (!res.ok) throw new Error('Failed to check slug')
      return res.json()
    },
    enabled: !!formData.slug && formData.slug.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // 슬러그 체크 결과 처리
  useEffect(() => {
    if (slugCheckResult?.success && slugCheckResult.data) {
      setSlugAvailable(!slugCheckResult.data.duplicates.slug)
    }
  }, [slugCheckResult])

  // 이름 중복 체크
  const { data: nameCheckResult, isLoading: isCheckingName } = useQuery({
    queryKey: ['checkName', formData.name],
    queryFn: async () => {
      const res = await fetch('/api/communities/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      })

      if (!res.ok) throw new Error('Failed to check name')
      return res.json()
    },
    enabled: !!formData.name && formData.name.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // 이름 체크 결과 처리
  useEffect(() => {
    if (nameCheckResult?.success && nameCheckResult.data) {
      setNameAvailable(!nameCheckResult.data.duplicates.name)
    }
  }, [nameCheckResult])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black mb-2">
            새 커뮤니티 만들기
          </h1>
          <p className="text-lg text-gray-600">
            관심사가 비슷한 개발자들과 함께할 공간을 만들어보세요.
          </p>
        </header>

        {/* Main Card */}
        <main className="bg-white p-6 sm:p-8 rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 섹션 */}
            <section>
              <h2 className="text-2xl font-bold mb-4">기본 정보</h2>
              <div className="space-y-6">
                {/* 커뮤니티 이름 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="name" className="text-lg font-bold">
                      커뮤니티 이름 <span className="text-red-500">*</span>
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        커뮤니티를 대표하는 멋진 이름을 지어주세요. 다른
                        사람들이 쉽게 알아볼 수 있도록 명확하고 간결한 이름이
                        좋습니다.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="name"
                      placeholder="예: React 개발자 모임"
                      value={formData.name}
                      maxLength={CHARACTER_LIMITS.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value
                        setFormData({ ...formData, name: value })

                        // Real-time validation
                        const error = validateField('name', value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          name: error,
                        }))

                        // Auto-generate slug if not manually modified
                        if (
                          !formData.slug ||
                          formData.slug === generateSlug(formData.name)
                        ) {
                          const newSlug = generateSlug(value)
                          setFormData((prev) => ({
                            ...prev,
                            slug: newSlug,
                          }))

                          // Validate generated slug
                          const slugError = validateField('slug', newSlug)
                          setValidationErrors((prev) => ({
                            ...prev,
                            slug: slugError,
                          }))
                        }
                      }}
                      className={`w-full p-3 border-3 rounded-lg focus:ring-2 focus:ring-blue-200 transition-colors ${
                        validationErrors.name || nameAvailable === false
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formData.name.length}/{CHARACTER_LIMITS.name}
                      </span>
                      <span>
                        {isCheckingName && (
                          <ButtonSpinner className="text-gray-400" />
                        )}
                        {!isCheckingName && nameAvailable === true && (
                          <Check className="h-5 w-5 text-green-600" />
                        )}
                        {!isCheckingName && nameAvailable === false && (
                          <X className="h-5 w-5 text-red-600" />
                        )}
                      </span>
                    </div>
                  </div>
                  {(validationErrors.name ||
                    (!isCheckingName && nameAvailable === false)) && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <span className="material-icons text-base mr-1">
                        error
                      </span>
                      {validationErrors.name ||
                        '이미 사용 중인 커뮤니티 이름입니다.'}
                    </p>
                  )}
                </div>

                {/* URL 슬러그 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="slug" className="text-lg font-bold">
                      커뮤니티 URL <span className="text-red-500">*</span>
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        커뮤니티에 접속할 수 있는 고유 주소입니다. 영어, 숫자,
                        하이픈(-)만 사용할 수 있습니다.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-stretch">
                    <span className="flex items-center text-gray-500 px-3 bg-gray-100 border-l-3 border-t-3 border-b-3 border-black rounded-l-lg">
                      /communities/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="slug"
                        placeholder="react-developers"
                        value={formData.slug}
                        maxLength={CHARACTER_LIMITS.slug}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value
                          // Only allow valid characters in real-time
                          const cleanValue = value.replace(/[^a-z0-9-]/g, '')
                          setFormData({ ...formData, slug: cleanValue })

                          // Real-time validation
                          const error = validateField('slug', cleanValue)
                          setValidationErrors((prev) => ({
                            ...prev,
                            slug: error,
                          }))
                        }}
                        className={`w-full p-3 border-3 border-l-0 rounded-r-lg pr-16 focus:ring-2 focus:ring-blue-200 transition-colors rounded-l-none ${
                          validationErrors.slug || slugAvailable === false
                            ? 'border-red-500 focus:border-red-600'
                            : 'border-black focus:border-blue-600'
                        }`}
                        pattern="[a-z0-9\-]*"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formData.slug.length}/{CHARACTER_LIMITS.slug}
                        </span>
                        <span>
                          {isCheckingSlug && (
                            <ButtonSpinner className="text-gray-400" />
                          )}
                          {!isCheckingSlug && slugAvailable === true && (
                            <Check className="h-5 w-5 text-green-600" />
                          )}
                          {!isCheckingSlug && slugAvailable === false && (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(validationErrors.slug ||
                    (!isCheckingSlug && slugAvailable === false)) && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <span className="material-icons text-base mr-1">
                        error
                      </span>
                      {validationErrors.slug || '이미 사용 중인 URL입니다.'}
                    </p>
                  )}
                </div>

                {/* 설명 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="description" className="text-lg font-bold">
                      커뮤니티 소개
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        커뮤니티의 정체성을 보여주는 공간입니다. 어떤 사람들이
                        모여 어떤 활동을 하는지 자유롭게 소개해주세요.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="description"
                      placeholder="커뮤니티에 대한 간단한 소개를 작성해주세요."
                      value={formData.description}
                      maxLength={CHARACTER_LIMITS.description}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, description: value })

                        // Real-time validation
                        const error = validateField('description', value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          description: error,
                        }))
                      }}
                      className={`w-full p-3 border-3 rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-200 transition-colors pr-16 ${
                        validationErrors.description
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                      rows={4}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                      {formData.description.length}/
                      {CHARACTER_LIMITS.description}
                    </div>
                  </div>
                  {validationErrors.description ? (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <span className="material-icons text-base mr-1">
                        error
                      </span>
                      {validationErrors.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      어떤 주제를 다루나요? 누구를 위한 커뮤니티인가요?
                    </p>
                  )}
                </div>

                {/* 규칙 */}
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="rules" className="text-lg font-bold">
                      커뮤니티 규칙
                    </Label>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        건강한 커뮤니티 활동을 위해 멤버들이 지켜야 할 규칙을
                        정해주세요. 예) 비방 금지, 광고 금지 등
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="rules"
                      placeholder="커뮤니티 멤버들이 지켜야 할 규칙을 작성해주세요."
                      value={formData.rules}
                      maxLength={CHARACTER_LIMITS.rules}
                      onChange={(e) => {
                        const value = e.target.value
                        setFormData({ ...formData, rules: value })

                        // Real-time validation
                        const error = validateField('rules', value)
                        setValidationErrors((prev) => ({
                          ...prev,
                          rules: error,
                        }))
                      }}
                      className={`w-full p-3 border-3 rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-200 transition-colors pr-20 ${
                        validationErrors.rules
                          ? 'border-red-500 focus:border-red-600'
                          : 'border-black focus:border-blue-600'
                      }`}
                      rows={4}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-500">
                      {formData.rules.length}/{CHARACTER_LIMITS.rules}
                    </div>
                  </div>
                  {validationErrors.rules && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <span className="material-icons text-base mr-1">
                        error
                      </span>
                      {validationErrors.rules}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 구분선 */}
            <div className="border-t-2 border-dashed border-gray-300"></div>

            {/* 커뮤니티 아바타 섹션 */}
            <section>
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold">커뮤니티 아바타</h2>
                <div className="ml-2 group relative">
                  <span className="material-icons text-gray-500 cursor-help">
                    help_outline
                  </span>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                    커뮤니티를 상징하는 대표 이미지입니다. 기본 아바타를
                    선택하거나 직접 이미지를 업로드할 수 있습니다.
                  </div>
                </div>
              </div>

              {/* 아바타 미리보기 */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg border-2 border-black overflow-hidden bg-gray-50 flex items-center justify-center">
                  {selectedDefaultAvatar ? (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: selectedDefaultAvatar.color }}
                    >
                      {selectedDefaultAvatar.emoji}
                    </div>
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedDefaultAvatar
                    ? '기본 아바타가 자동으로 선택되었습니다'
                    : '아바타를 선택해주세요'}
                </div>
              </div>

              {/* 아바타 선택 섹션 */}
              <div className="border-b-2 border-black">
                <div className="p-3 bg-white border-t-2 border-l-2 border-r-2 border-black font-bold text-center">
                  다양한 기본 아바타 선택
                </div>
              </div>

              {/* 기본 아바타 선택 그리드 */}
              <div className="p-4 border-2 border-black border-t-0">
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.name}
                      type="button"
                      onClick={() => {
                        setSelectedDefaultAvatar(avatar)
                        setFormData({
                          ...formData,
                          avatar: `default:${avatar.name}`,
                        })
                      }}
                      className={`w-16 h-16 text-4xl flex items-center justify-center rounded-lg border-2 border-black transition-all ${
                        selectedDefaultAvatar?.name === avatar.name
                          ? 'ring-4 ring-blue-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'hover:scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                      style={{ backgroundColor: avatar.color }}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* 구분선 */}
            <div className="border-t-2 border-dashed border-gray-300"></div>

            {/* 커뮤니티 배너 섹션 */}
            <section>
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold">
                  커뮤니티 배너
                  <span className="text-base font-medium text-gray-500">
                    (선택사항)
                  </span>
                </h2>
                <div className="ml-2 group relative">
                  <span className="material-icons text-gray-500 cursor-help">
                    help_outline
                  </span>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                    커뮤니티 페이지 상단에 표시될 이미지입니다. 커뮤니티의
                    분위기를 잘 나타내는 이미지를 선택하세요.
                  </div>
                </div>
              </div>

              {/* 배너 미리보기 */}
              <div className="aspect-video bg-gray-200 rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4 overflow-hidden">
                {bannerPreview ? (
                  <div className="relative w-full h-full group">
                    {bannerPreview.startsWith('blob:') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    ) : selectedDefaultBanner ? (
                      <div
                        className={`w-full h-full ${selectedDefaultBanner.preview} flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-lg">
                          {selectedDefaultBanner.name}
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={bannerPreview}
                        alt="Banner preview"
                        width={1200}
                        height={300}
                        className="w-full h-full object-cover"
                        placeholder="blur"
                        blurDataURL={getDefaultBlurPlaceholder('post')}
                        priority
                        unoptimized
                      />
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      onClick={() => {
                        setBannerPreview('')
                        setBannerType('none')
                        setSelectedDefaultBanner(null)
                        setFormData({ ...formData, banner: '' })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">배너 미리보기</p>
                )}
              </div>

              {/* 배너 타입 선택 탭 */}
              <div className="flex border-b-2 border-black mb-4">
                <button
                  type="button"
                  className={`flex-1 p-3 font-bold border-t-2 border-l-2 border-r border-black transition-all ${
                    bannerType === 'default'
                      ? 'bg-white -mb-px z-10'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => setBannerType('default')}
                >
                  기본 배너
                </button>
                <button
                  type="button"
                  className={`flex-1 p-3 font-bold border-t-2 border-l border-r border-black transition-all ${
                    bannerType === 'upload'
                      ? 'bg-white -mb-px z-10'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => setBannerType('upload')}
                >
                  업로드
                </button>
                <button
                  type="button"
                  className={`flex-1 p-3 font-bold border-t-2 border-l border-r border-black transition-all ${
                    bannerType === 'unsplash'
                      ? 'bg-white -mb-px z-10'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => setBannerType('unsplash')}
                >
                  Unsplash
                </button>
                <button
                  type="button"
                  className={`flex-1 p-3 font-bold border-t-2 border-l border-r-2 border-black transition-all ${
                    bannerType === 'none'
                      ? 'bg-white -mb-px z-10'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => {
                    setBannerType('none')
                    setBannerPreview('')
                    setSelectedDefaultBanner(null)
                    setSelectedUnsplashImage(null)
                    setFormData({ ...formData, banner: '' })
                  }}
                >
                  배너 없음
                </button>
              </div>

              {/* 배너 컨텐츠 */}
              <div className="border-2 border-black border-t-0 p-4 bg-white">
                {bannerType === 'default' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {defaultBanners.map((banner) => (
                      <button
                        key={banner.id}
                        type="button"
                        className={`aspect-video rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-center justify-center text-white text-xs font-bold relative ${
                          banner.preview
                        } ${
                          selectedDefaultBanner?.id === banner.id
                            ? 'ring-4 ring-blue-500'
                            : ''
                        }`}
                        onClick={() => {
                          setSelectedDefaultBanner(banner)
                          setBannerPreview(banner.url)
                          setFormData({
                            ...formData,
                            banner: `default:${banner.id}`,
                          })
                        }}
                      >
                        <span className="text-center px-1">{banner.name}</span>
                        {selectedDefaultBanner?.id === banner.id && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {bannerType === 'upload' && (
                  <div>
                    <Button
                      type="button"
                      className="w-full p-4 font-bold bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                      onClick={handleUploadClick}
                    >
                      <span className="material-icons text-xl">upload</span>
                      <span className="text-base">파일 업로드</span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleFileUpload(e)
                        setBannerType('upload')
                        setSelectedDefaultBanner(null)
                      }}
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      권장 크기: 1200x300px (가로형 이미지)
                    </p>
                  </div>
                )}

                {bannerType === 'unsplash' && (
                  <div className="space-y-4">
                    {/* Unsplash 검색 */}
                    <div>
                      <h3 className="text-lg font-bold mb-3">Unsplash 검색</h3>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="예: technology, nature, minimal..."
                          className="flex-1 p-3 border-2 border-black rounded-lg font-medium"
                          value={unsplashSearchQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setUnsplashSearchQuery(e.target.value)
                          }
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleUnsplashSearch()
                            }
                          }}
                        />
                        <Button
                          type="button"
                          className="bg-black text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                          onClick={handleUnsplashSearch}
                        >
                          검색
                        </Button>
                      </div>
                    </div>

                    {/* 추천 Unsplash 이미지들 */}
                    <div>
                      <h3 className="text-lg font-bold mb-3">
                        {unsplashSearchResults.length > 0
                          ? '검색 결과'
                          : '추천 배너 이미지'}
                        {isSearching && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            검색 중...
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(unsplashSearchResults.length > 0
                          ? unsplashSearchResults
                          : RECOMMENDED_BANNER_IMAGES
                        ).map((image) => (
                          <div
                            key={image.id}
                            className={`relative h-32 w-full rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden cursor-pointer group ${
                              selectedUnsplashImage?.id === image.id
                                ? 'ring-4 ring-blue-500'
                                : ''
                            }`}
                            onClick={() => {
                              if (!imageLoadErrors.has(image.id)) {
                                setSelectedUnsplashImage(image)
                                setBannerPreview(image.url)
                                setFormData({
                                  ...formData,
                                  banner: `unsplash:${image.url}`,
                                })
                              }
                            }}
                          >
                            {imageLoadErrors.has(image.id) ? (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="material-icons text-gray-400 text-4xl">
                                  broken_image
                                </span>
                              </div>
                            ) : (
                              <Image
                                src={image.url}
                                alt={image.description}
                                width={1200}
                                height={300}
                                className="w-full h-full object-cover"
                                placeholder="blur"
                                blurDataURL={getDefaultBlurPlaceholder('post')}
                                priority
                                unoptimized
                                onError={() => {
                                  setImageLoadErrors((prev) =>
                                    new Set(prev).add(image.id)
                                  )
                                }}
                              />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {image.description}
                            </div>
                            {selectedUnsplashImage?.id === image.id && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-black rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        고화질 이미지들이 자동으로 커뮤니티에 맞게 조정됩니다
                      </p>
                    </div>
                  </div>
                )}

                {bannerType === 'none' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-4">
                      <span className="material-icons text-gray-400 text-2xl">
                        image_not_supported
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium">
                      배너 없이 깔끔한 커뮤니티를 만듭니다.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 구분선 */}
            <div className="border-t-2 border-dashed border-gray-300"></div>

            {/* 공개 설정 섹션 */}
            <section>
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold">공개 설정</h2>
                <div className="ml-2 group relative">
                  <span className="material-icons text-gray-500 cursor-help">
                    help_outline
                  </span>
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                    커뮤니티의 공개 범위를 설정합니다. &apos;공개&apos;는 누구나
                    참여 가능하며, &apos;비공개&apos;는 초대된 멤버만 참여할 수
                    있습니다.
                  </div>
                </div>
              </div>
              <RadioGroup
                value={formData.visibility}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    visibility: value as 'PUBLIC' | 'PRIVATE',
                  })
                }
                className="space-y-4"
              >
                <label
                  className={`block p-4 rounded-lg border-3 border-black cursor-pointer transition-all ${
                    formData.visibility === 'PUBLIC'
                      ? 'bg-blue-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem
                    value="PUBLIC"
                    id="public"
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="material-icons text-3xl mr-4 text-blue-500">
                      public
                    </span>
                    <div>
                      <p className="font-bold text-lg">공개</p>
                      <p className="text-gray-600">
                        누구나 커뮤니티를 보고 가입할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </label>
                <label
                  className={`block p-4 rounded-lg border-3 border-black cursor-pointer transition-all ${
                    formData.visibility === 'PRIVATE'
                      ? 'bg-blue-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <RadioGroupItem
                    value="PRIVATE"
                    id="private"
                    className="sr-only"
                  />
                  <div className="flex items-center">
                    <span className="material-icons text-3xl mr-4 text-gray-500">
                      lock
                    </span>
                    <div>
                      <p className="font-bold text-lg">비공개</p>
                      <p className="text-gray-600">
                        초대받은 사람만 가입할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </section>

            {/* 구분선 */}
            <div className="border-t-2 border-dashed border-gray-300"></div>

            {/* 추가 옵션 섹션 */}
            <section>
              <h2 className="text-2xl font-bold mb-4">추가 옵션</h2>
              <div className="space-y-6">
                {/* 파일 업로드 허용 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center">
                    <div>
                      <p className="font-bold">파일 업로드 허용</p>
                      <p className="text-sm text-gray-600 mt-1">
                        멤버들이 이미지나 문서 등의 파일을 게시글에 첨부할 수
                        있도록 허용합니다.
                      </p>
                    </div>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        멤버들이 이미지나 문서 등의 파일을 게시글에 첨부할 수
                        있도록 허용합니다.
                      </div>
                    </div>
                  </div>
                  <label className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.allowFileUpload}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowFileUpload: e.target.checked,
                        })
                      }
                    />
                    <div
                      className={`w-[52px] h-8 rounded-full border-2 border-black relative cursor-pointer transition-colors ${formData.allowFileUpload ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <div
                        className={`absolute top-[2px] left-[2px] w-6 h-6 bg-white border-2 border-black rounded-full transition-transform ${formData.allowFileUpload ? 'translate-x-5' : ''}`}
                      />
                    </div>
                  </label>
                </div>

                {/* 실시간 채팅 허용 */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center">
                    <div>
                      <p className="font-bold">실시간 채팅 허용</p>
                      <p className="text-sm text-gray-600 mt-1">
                        커뮤니티 내에 별도의 채팅방을 만들어 멤버들이 자유롭게
                        실시간 대화를 나눌 수 있도록 합니다.
                      </p>
                    </div>
                    <div className="ml-2 group relative">
                      <span className="material-icons text-gray-500 cursor-help text-sm">
                        help_outline
                      </span>
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                        커뮤니티 내에 별도의 채팅방을 만들어 멤버들이 자유롭게
                        실시간 대화를 나눌 수 있도록 합니다.
                      </div>
                    </div>
                  </div>
                  <label className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.allowChat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowChat: e.target.checked,
                        })
                      }
                    />
                    <div
                      className={`w-[52px] h-8 rounded-full border-2 border-black relative cursor-pointer transition-colors ${formData.allowChat ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <div
                        className={`absolute top-[2px] left-[2px] w-6 h-6 bg-white border-2 border-black rounded-full transition-transform ${formData.allowChat ? 'translate-x-5' : ''}`}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* 제출 버튼 - 단일 버튼으로 통일 */}
            <div className="border-t-2 border-black pt-8">
              <div className="space-y-4">
                {/* 유효성 검사 요약 */}
                {Object.values(validationErrors).some((error) => error) && (
                  <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                    <h3 className="font-bold text-red-700 mb-2">
                      입력 오류가 있습니다:
                    </h3>
                    <ul className="text-sm text-red-600 space-y-1">
                      {validationErrors.name && (
                        <li>• {validationErrors.name}</li>
                      )}
                      {validationErrors.slug && (
                        <li>• {validationErrors.slug}</li>
                      )}
                      {validationErrors.description && (
                        <li>• {validationErrors.description}</li>
                      )}
                      {validationErrors.rules && (
                        <li>• {validationErrors.rules}</li>
                      )}
                    </ul>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    createCommunityMutation.isPending ||
                    isCreating ||
                    !formData.name ||
                    !formData.slug ||
                    nameAvailable === false ||
                    slugAvailable === false ||
                    Object.values(validationErrors).some((error) => error)
                  }
                  className="w-full px-6 py-4 text-xl font-bold text-white bg-blue-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {createCommunityMutation.isPending || isCreating ? (
                    <>
                      <ButtonSpinner className="mr-2" />
                      커뮤니티 생성 중...
                    </>
                  ) : (
                    '🚀 커뮤니티 만들기'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push('/communities')}
                    className="text-gray-500 hover:text-gray-700 font-medium"
                  >
                    취소하고 돌아가기
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* 로딩 오버레이 - 개선된 스피너 */}
          {(createCommunityMutation.isPending || isCreating) && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="bg-white rounded-lg border-3 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
                <div className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className="animate-spin rounded-full h-24 w-24 border-4 border-gray-200"></div>
                    <div className="animate-spin rounded-full h-24 w-24 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    커뮤니티 생성 중...
                  </h3>
                  <p className="text-gray-600 text-center max-w-sm">
                    잠시만 기다려주세요.
                    <br />
                    페이지를 떠나지 마시고 기다려주세요.
                  </p>
                  {isCreating && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <span>커뮤니티를 만들고 있습니다...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
