'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import {
  Loader2,
  Globe,
  Lock,
  Check,
  X,
  Image as ImageIcon,
  Search,
  Upload,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DEFAULT_AVATARS, getAvatarFromName } from '@/lib/community-utils'

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
  const [avatarType, setAvatarType] = useState<'default' | 'search'>('default')
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
      // 실제로는 Unsplash API 호출
      // 여기서는 더미 데이터 사용
      const dummyResults = [
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},logo,1`,
          alt: `${searchQuery} 1`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},icon,2`,
          alt: `${searchQuery} 2`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},abstract,3`,
          alt: `${searchQuery} 3`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},minimal,4`,
          alt: `${searchQuery} 4`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},logo,5`,
          alt: `${searchQuery} 5`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},icon,6`,
          alt: `${searchQuery} 6`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},abstract,7`,
          alt: `${searchQuery} 7`,
        },
        {
          url: `https://source.unsplash.com/200x200/?${searchQuery},minimal,8`,
          alt: `${searchQuery} 8`,
        },
      ]

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="text-2xl font-black">
            새 커뮤니티 만들기
          </CardTitle>
          <CardDescription>
            관심사가 비슷한 개발자들과 함께할 공간을 만들어보세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 커뮤니티 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                커뮤니티 이름 <span className="text-red-500">*</span>
              </Label>
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
                className="border-2 border-black focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                required
              />
            </div>

            {/* URL 슬러그 */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                커뮤니티 URL <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/communities/</span>
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    placeholder="react-developers"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="border-2 border-black pr-10 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
                    pattern="[a-z0-9\-]*"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isCheckingSlug && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {!isCheckingSlug && slugAvailable === true && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    {!isCheckingSlug && slugAvailable === false && (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.
                </p>
                {!isCheckingSlug && slugAvailable === false && (
                  <p className="text-sm text-red-600">
                    이미 사용 중인 URL입니다. 다른 URL을 선택해주세요.
                  </p>
                )}
              </div>
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">커뮤니티 소개</Label>
              <Textarea
                id="description"
                placeholder="커뮤니티에 대한 간단한 소개를 작성해주세요."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-2 border-black min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
              <p className="text-sm text-muted-foreground">
                어떤 주제를 다루나요? 누구를 위한 커뮤니티인가요?
              </p>
            </div>

            {/* 규칙 */}
            <div className="space-y-2">
              <Label htmlFor="rules">커뮤니티 규칙</Label>
              <Textarea
                id="rules"
                placeholder="커뮤니티 멤버들이 지켜야 할 규칙을 작성해주세요."
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
                className="border-2 border-black min-h-[100px] focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors"
              />
            </div>

            {/* 아바타 이미지 */}
            <div className="space-y-2">
              <Label>커뮤니티 아바타</Label>

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

              {/* 아바타 선택 옵션 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 기본 아바타 선택 */}
                <Button
                  type="button"
                  variant={avatarType === 'default' ? 'default' : 'outline'}
                  className="border-2 border-black"
                  onClick={() => setAvatarType('default')}
                >
                  기본 아바타
                </Button>

                {/* 이미지 검색 */}
                <Button
                  type="button"
                  variant={avatarType === 'search' ? 'default' : 'outline'}
                  className="border-2 border-black"
                  onClick={() => setAvatarType('search')}
                >
                  <Search className="mr-2 h-4 w-4" />
                  이미지 검색
                </Button>
              </div>

              {/* 기본 아바타 선택 그리드 */}
              {avatarType === 'default' && (
                <div className="bg-gray-50 rounded-lg p-3 mt-3 border-2 border-gray-200">
                  <div className="grid grid-cols-8 gap-1.5">
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
                        className={`aspect-square rounded-md border-2 flex items-center justify-center text-lg transition-all ${
                          selectedDefaultAvatar?.name === avatar.name
                            ? 'border-blue-600 scale-110 shadow-md ring-2 ring-blue-300'
                            : 'border-gray-300 hover:scale-105 hover:border-gray-400'
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
                <div className="bg-gray-50 rounded-lg p-3 mt-3 border-2 border-gray-200">
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
            </div>

            {/* 배너 이미지 */}
            <div className="space-y-2">
              <Label htmlFor="banner">커뮤니티 배너 (선택사항)</Label>

              {/* 배너 미리보기 */}
              {bannerPreview && (
                <div className="mb-2 relative group">
                  {bannerPreview.startsWith('blob:') ? (
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-32 rounded-lg border-2 border-black object-cover"
                    />
                  ) : (
                    <Image
                      src={bannerPreview}
                      alt="Banner preview"
                      width={600}
                      height={128}
                      className="w-full h-32 rounded-lg border-2 border-black object-cover"
                    />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setBannerPreview('')
                      setFormData({ ...formData, banner: '' })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-2 border-black flex-1"
                  onClick={() =>
                    document.getElementById('banner-upload')?.click()
                  }
                >
                  <Upload className="mr-2 h-4 w-4" />
                  배너 이미지 업로드
                </Button>
                <Input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                권장 크기: 1200x300px (가로형 이미지)
              </p>
            </div>

            {/* 공개 설정 */}
            <div className="space-y-2">
              <Label>공개 설정</Label>
              <RadioGroup
                value={formData.visibility}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    visibility: value as 'PUBLIC' | 'PRIVATE',
                  })
                }
              >
                <div className="flex items-center space-x-2 p-3 border-2 border-black rounded">
                  <RadioGroupItem value="PUBLIC" id="public" />
                  <Label htmlFor="public" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-bold">공개</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      누구나 커뮤니티를 보고 가입할 수 있습니다.
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border-2 border-black rounded">
                  <RadioGroupItem value="PRIVATE" id="private" />
                  <Label htmlFor="private" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span className="font-bold">비공개</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      초대받은 사람만 가입할 수 있습니다.
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* 추가 옵션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="file-upload" className="flex-1">
                  <div className="font-bold">파일 업로드 허용</div>
                  <p className="text-sm text-muted-foreground">
                    멤버들이 게시글에 파일을 첨부할 수 있습니다.
                  </p>
                </Label>
                <Switch
                  id="file-upload"
                  checked={formData.allowFileUpload}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, allowFileUpload: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="chat" className="flex-1">
                  <div className="font-bold">실시간 채팅</div>
                  <p className="text-sm text-muted-foreground">
                    멤버들끼리 실시간으로 대화할 수 있습니다.
                  </p>
                </Label>
                <Switch
                  id="chat"
                  checked={formData.allowChat}
                  onCheckedChange={(checked: boolean) =>
                    setFormData({ ...formData, allowChat: checked })
                  }
                />
              </div>

              {/* 파일 크기 제한 */}
              {formData.allowFileUpload && (
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">최대 파일 크기</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxFileSize"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.maxFileSize / 1048576} // MB로 변환
                      onChange={(e) => {
                        const mb = parseInt(e.target.value) || 10
                        setFormData({ ...formData, maxFileSize: mb * 1048576 })
                      }}
                      className="border-2 border-black w-24"
                    />
                    <span className="text-sm font-medium">MB</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    멤버들이 업로드할 수 있는 파일의 최대 크기 (1-100MB)
                  </p>
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  '커뮤니티 만들기'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
