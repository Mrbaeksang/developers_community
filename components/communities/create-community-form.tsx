'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
// Removed unused Card imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
// Removed Switch import - using custom toggle
import { Loader2, Check, X, Image as ImageIcon, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_AVATARS, getAvatarFromName } from '@/lib/community-utils'
import { defaultBanners } from '@/lib/banner-utils'

export default function CreateCommunityForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')
  const [selectedDefaultAvatar, setSelectedDefaultAvatar] = useState<
    (typeof DEFAULT_AVATARS)[0] | null
  >(null)
  const [avatarType, setAvatarType] = useState<'default' | 'upload' | 'search'>(
    'default'
  )
  const [bannerType, setBannerType] = useState<'default' | 'upload' | 'none'>(
    'none'
  )
  const [selectedDefaultBanner, setSelectedDefaultBanner] = useState<
    (typeof defaultBanners)[0] | null
  >(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<{ url: string; alt: string }>
  >([])
  const [isSearching, setIsSearching] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    rules: '',
    avatar: '',
    banner: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    allowFileUpload: true,
    allowChat: false,
    maxFileSize: 10485760, // 10MB default
  })

  // 커뮤니티 이름 변경시 자동으로 기본 아바타 선택
  useEffect(() => {
    if (formData.name && avatarType === 'default' && !selectedDefaultAvatar) {
      const avatar = getAvatarFromName(formData.name)
      setSelectedDefaultAvatar(avatar)
    }
  }, [formData.name, avatarType, selectedDefaultAvatar])

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

  // 이미지 검색 핸들러
  const handleImageSearch = async () => {
    if (!searchQuery) return

    setIsSearching(true)
    try {
      // Lorem Picsum을 사용한 랜덤 이미지
      const dummyResults = Array.from({ length: 8 }, (_, idx) => ({
        url: `https://picsum.photos/200/200?random=${Date.now()}_${idx}_${searchQuery}`,
        alt: `${searchQuery} ${idx + 1}`,
      }))

      await new Promise((resolve) => setTimeout(resolve, 500)) // 시뮬레이션 딜레이
      setSearchResults(dummyResults)
    } catch {
      toast({
        title: '오류',
        description: '이미지 검색에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

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

    // 아바타 설정 안했으면 기본 아바타 사용
    let finalAvatar = formData.avatar
    if (!finalAvatar && selectedDefaultAvatar) {
      finalAvatar = `default:${selectedDefaultAvatar.name}`
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          avatar: finalAvatar,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '커뮤니티 생성에 실패했습니다.')
      }

      const community = await res.json()

      toast({
        title: '성공',
        description: '커뮤니티가 생성되었습니다.',
      })

      router.push(`/communities/${community.slug}`)
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '커뮤니티 생성에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 슬러그 자동 생성
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // 슬러그 중복 체크
  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug || formData.slug.length < 2) {
        setSlugAvailable(null)
        return
      }

      setIsCheckingSlug(true)
      try {
        const res = await fetch('/api/communities/check-slug', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: formData.slug }),
        })

        if (res.ok) {
          const data = await res.json()
          setSlugAvailable(data.available)
        }
      } catch (error) {
        console.error('Failed to check slug:', error)
      } finally {
        setIsCheckingSlug(false)
      }
    }

    const timer = setTimeout(checkSlug, 500) // 디바운스
    return () => clearTimeout(timer)
  }, [formData.slug])

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
                  <Input
                    id="name"
                    placeholder="예: React 개발자 모임"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (
                        !formData.slug ||
                        formData.slug === generateSlug(formData.name)
                      ) {
                        setFormData((prev) => ({
                          ...prev,
                          slug: generateSlug(e.target.value),
                        }))
                      }
                    }}
                    className="w-full p-3 border-3 border-black rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                    required
                  />
                  {!formData.name && (
                    <p className="text-sm text-red-500 mt-2 flex items-center">
                      <span className="material-icons text-base mr-1">
                        error
                      </span>
                      커뮤니티 이름은 필수입니다.
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
                  <div className="flex items-center">
                    <span className="text-gray-500 p-3 bg-gray-100 border-l-3 border-t-3 border-b-3 border-black rounded-l-lg">
                      /communities/
                    </span>
                    <div className="relative flex-1">
                      <Input
                        id="slug"
                        placeholder="react-developers"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        className="w-full p-3 border-3 border-black rounded-r-lg pr-10 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors rounded-l-none"
                        pattern="[a-z0-9\-]*"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingSlug && (
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
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
                  {!isCheckingSlug && slugAvailable === false && (
                    <p className="text-sm text-red-500 mt-2">
                      이미 사용 중인 URL입니다.
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
                  <Textarea
                    id="description"
                    placeholder="커뮤니티에 대한 간단한 소개를 작성해주세요."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full p-3 border-3 border-black rounded-lg min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    어떤 주제를 다루나요? 누구를 위한 커뮤니티인가요?
                  </p>
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
                  <Textarea
                    id="rules"
                    placeholder="커뮤니티 멤버들이 지켜야 할 규칙을 작성해주세요."
                    value={formData.rules}
                    onChange={(e) =>
                      setFormData({ ...formData, rules: e.target.value })
                    }
                    className="w-full p-3 border-3 border-black rounded-lg min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                    rows={4}
                  />
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
                  {avatarType === 'default' && selectedDefaultAvatar ? (
                    <div
                      className="w-full h-full flex items-center justify-center text-4xl"
                      style={{ backgroundColor: selectedDefaultAvatar.color }}
                    >
                      {selectedDefaultAvatar.emoji}
                    </div>
                  ) : avatarPreview ||
                    (avatarType === 'search' &&
                      formData.avatar &&
                      !formData.avatar.startsWith('default:')) ? (
                    avatarPreview?.startsWith('blob:') ||
                    formData.avatar?.startsWith('blob:') ? (
                      <img
                        src={avatarPreview || formData.avatar}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={avatarPreview || formData.avatar}
                        alt="Avatar preview"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {avatarType === 'default' && selectedDefaultAvatar
                    ? '기본 아바타가 자동으로 선택되었습니다'
                    : '아바타를 선택해주세요'}
                </div>
              </div>

              {/* 아바타 선택 탭 */}
              <div className="flex border-b-2 border-black">
                <button
                  type="button"
                  className={`flex-1 p-3 font-bold ${
                    avatarType === 'default'
                      ? 'bg-white border-t-2 border-l-2 border-r-2 border-black -mb-[2px]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => setAvatarType('default')}
                >
                  기본 아바타
                </button>
                <button
                  type="button"
                  className={`flex-1 p-3 font-bold ${
                    avatarType === 'search'
                      ? 'bg-white border-t-2 border-l-2 border-r-2 border-black -mb-[2px]'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => setAvatarType('search')}
                >
                  이미지 검색
                </button>
              </div>

              {/* 기본 아바타 선택 그리드 */}
              {avatarType === 'default' && (
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
              )}

              {/* 이미지 검색 */}
              {avatarType === 'search' && (
                <div className="p-4 border-2 border-black border-t-0">
                  <div className="flex gap-2 mb-3">
                    <Input
                      type="text"
                      placeholder="검색어를 입력하세요 (예: technology, nature, abstract)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleImageSearch()
                        }
                      }}
                      className="border-2 border-black"
                    />
                    <Button
                      type="button"
                      onClick={handleImageSearch}
                      disabled={!searchQuery || isSearching}
                      className="border-2 border-black"
                    >
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setAvatarPreview(result.url)
                            setFormData({ ...formData, avatar: result.url })
                          }}
                          className={`aspect-square rounded-md border-2 overflow-hidden transition-all hover:scale-105 ${
                            formData.avatar === result.url
                              ? 'border-blue-600 ring-2 ring-blue-300'
                              : 'border-gray-300'
                          }`}
                        >
                          <Image
                            src={result.url}
                            alt={result.alt}
                            width={100}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 &&
                    searchQuery &&
                    !isSearching && (
                      <p className="text-sm text-center text-muted-foreground py-4">
                        검색 결과가 없습니다. 다른 키워드로 시도해보세요.
                      </p>
                    )}
                </div>
              )}
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
                  className={`flex-1 p-3 font-bold border-t-2 border-l border-r-2 border-black transition-all ${
                    bannerType === 'none'
                      ? 'bg-white -mb-px z-10'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  onClick={() => {
                    setBannerType('none')
                    setBannerPreview('')
                    setSelectedDefaultBanner(null)
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
                          setBannerPreview(banner.preview)
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
                      onClick={() =>
                        document.getElementById('banner-upload')?.click()
                      }
                    >
                      <span className="material-icons">upload</span>
                      <span>배너 이미지 업로드</span>
                    </Button>
                    <Input
                      id="banner-upload"
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

                {/* 파일 크기 제한 */}
                {formData.allowFileUpload && (
                  <div className="p-4 bg-blue-50 rounded-lg border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center mb-2">
                      <Label
                        htmlFor="maxFileSize"
                        className="text-lg font-bold"
                      >
                        최대 파일 크기
                      </Label>
                      <div className="ml-2 group relative">
                        <span className="material-icons text-gray-500 cursor-help text-sm">
                          help_outline
                        </span>
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg z-10">
                          멤버가 한 번에 업로드할 수 있는 파일의 최대 용량을
                          설정합니다. (1MB ~ 100MB)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="maxFileSize"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.maxFileSize / 1048576} // MB로 변환
                        onChange={(e) => {
                          const mb = parseInt(e.target.value) || 10
                          setFormData({
                            ...formData,
                            maxFileSize: mb * 1048576,
                          })
                        }}
                        className="w-24 p-3 border-3 border-black rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                      />
                      <span className="text-lg font-bold">MB</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      멤버들이 업로드할 수 있는 파일의 최대 크기 (1-100MB)
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 제출 버튼 */}
            <div className="border-t-2 border-black pt-8">
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 font-bold bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.name ||
                    !formData.slug ||
                    slugAvailable === false
                  }
                  className="flex-1 px-6 py-3 font-bold text-white bg-blue-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      만드는 중...
                    </>
                  ) : (
                    '커뮤니티 만들기'
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* 로딩 오버레이 */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              <p className="mt-4 text-xl font-bold text-gray-700">
                커뮤니티를 만들고 있습니다...
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
