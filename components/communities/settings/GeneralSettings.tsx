'use client'

import { useState } from 'react'
import { Community, CommunityVisibility } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Camera, Image as ImageIcon } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import Image from 'next/image'
import { DEFAULT_AVATARS } from '@/lib/community/utils'
import { defaultBanners } from '@/lib/ui/banner'
import { RECOMMENDED_BANNER_IMAGES } from '@/lib/ui/unsplash'

interface GeneralSettingsProps {
  community: Community
}

export function GeneralSettings({ community }: GeneralSettingsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [showBannerDialog, setShowBannerDialog] = useState(false)

  // 현재 아바타 파싱
  const currentAvatarName = community.avatar?.startsWith('default:')
    ? community.avatar.replace('default:', '')
    : null
  const currentAvatar = currentAvatarName
    ? DEFAULT_AVATARS.find((a) => a.name === currentAvatarName)
    : null

  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar)
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState(currentAvatar)

  // 현재 배너 파싱
  const currentBannerId = community.banner?.startsWith('default:')
    ? community.banner.replace('default:', '')
    : null
  const currentDefaultBanner = currentBannerId
    ? defaultBanners.find((b) => b.id === currentBannerId)
    : null
  const currentUnsplashUrl = community.banner?.startsWith('unsplash:')
    ? community.banner.replace('unsplash:', '')
    : null
  const currentUnsplashImage = currentUnsplashUrl
    ? RECOMMENDED_BANNER_IMAGES.find((img) => img.url === currentUnsplashUrl)
    : null

  const [selectedBanner, setSelectedBanner] = useState(currentDefaultBanner)
  const [selectedUnsplashImage, setSelectedUnsplashImage] =
    useState(currentUnsplashImage)
  const [tempSelectedBanner, setTempSelectedBanner] =
    useState(currentDefaultBanner)
  const [tempSelectedUnsplashImage, setTempSelectedUnsplashImage] =
    useState(currentUnsplashImage)

  const [bannerType, setBannerType] = useState<'default' | 'unsplash' | 'none'>(
    community.banner?.startsWith('default:')
      ? 'default'
      : community.banner?.startsWith('unsplash:')
        ? 'unsplash'
        : community.banner
          ? 'unsplash'
          : 'none'
  )

  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || '',
    rules: community.rules || '',
    visibility: community.visibility,
    allowFileUpload: community.allowFileUpload,
    avatar: community.avatar || '',
    banner: community.banner || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('커뮤니티 이름을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient(`/api/communities/${community.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.success) {
        throw new Error(response.error || '설정 변경에 실패했습니다.')
      }

      toast.success('커뮤니티 설정이 업데이트되었습니다.')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '설정 변경에 실패했습니다.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarSelect = (avatar: (typeof DEFAULT_AVATARS)[0]) => {
    setTempSelectedAvatar(avatar)
  }

  const handleAvatarApply = () => {
    if (tempSelectedAvatar) {
      setSelectedAvatar(tempSelectedAvatar)
      setFormData({
        ...formData,
        avatar: `default:${tempSelectedAvatar.name}`,
      })
      setShowAvatarDialog(false)
      toast.success('아바타가 변경되었습니다.')
    }
  }

  const handleBannerSelect = (banner: (typeof defaultBanners)[0]) => {
    setTempSelectedBanner(banner)
    setTempSelectedUnsplashImage(null)
  }

  const handleUnsplashSelect = (
    image: (typeof RECOMMENDED_BANNER_IMAGES)[0]
  ) => {
    setTempSelectedUnsplashImage(image)
    setTempSelectedBanner(null)
  }

  const handleBannerApply = () => {
    if (tempSelectedBanner) {
      setSelectedBanner(tempSelectedBanner)
      setSelectedUnsplashImage(null)
      setFormData({
        ...formData,
        banner: `default:${tempSelectedBanner.id}`,
      })
      setShowBannerDialog(false)
      toast.success('배너가 변경되었습니다.')
    } else if (tempSelectedUnsplashImage) {
      setSelectedUnsplashImage(tempSelectedUnsplashImage)
      setSelectedBanner(null)
      setFormData({
        ...formData,
        banner: `unsplash:${tempSelectedUnsplashImage.url}`,
      })
      setShowBannerDialog(false)
      toast.success('배너가 변경되었습니다.')
    }
  }

  const removeBanner = () => {
    setSelectedBanner(null)
    setSelectedUnsplashImage(null)
    setTempSelectedBanner(null)
    setTempSelectedUnsplashImage(null)
    setBannerType('none')
    setFormData({
      ...formData,
      banner: '',
    })
    toast.success('배너가 제거되었습니다.')
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 커뮤니티 이미지 섹션 */}
        <div className="space-y-4">
          <h3 className="font-medium">커뮤니티 이미지</h3>

          {/* 아바타 */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-gray-50 flex items-center justify-center">
              {selectedAvatar ? (
                <div
                  className="w-full h-full flex items-center justify-center text-4xl"
                  style={{ backgroundColor: selectedAvatar.color }}
                >
                  {selectedAvatar.emoji}
                </div>
              ) : formData.avatar && !formData.avatar.startsWith('default:') ? (
                <Image
                  src={formData.avatar}
                  alt={community.name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                커뮤니티 아바타
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempSelectedAvatar(selectedAvatar)
                  setShowAvatarDialog(true)
                }}
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Camera className="h-4 w-4 mr-2" />
                아바타 변경
              </Button>
            </div>
          </div>

          {/* 배너 */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">커뮤니티 배너</p>
            {formData.banner && (
              <div className="relative h-32 w-full rounded-lg overflow-hidden border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] mb-2">
                {selectedBanner ? (
                  <div className={`w-full h-full ${selectedBanner.gradient}`} />
                ) : formData.banner.startsWith('unsplash:') ? (
                  <Image
                    src={formData.banner.replace('unsplash:', '')}
                    alt="Community banner"
                    fill
                    className="object-cover"
                  />
                ) : formData.banner.startsWith('default:') ? (
                  (() => {
                    const bannerId = formData.banner.replace('default:', '')
                    const banner = defaultBanners.find((b) => b.id === bannerId)
                    return banner ? (
                      <div className={`w-full h-full ${banner.gradient}`} />
                    ) : null
                  })()
                ) : (
                  <Image
                    src={formData.banner}
                    alt="Community banner"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTempSelectedBanner(selectedBanner)
                setTempSelectedUnsplashImage(selectedUnsplashImage)
                setShowBannerDialog(true)
              }}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              배너 변경
            </Button>
          </div>
        </div>

        {/* 커뮤니티 이름 */}
        <div className="space-y-2">
          <Label htmlFor="name">커뮤니티 이름</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="커뮤니티 이름을 입력하세요"
            disabled={isSubmitting}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
        </div>

        {/* 커뮤니티 설명 */}
        <div className="space-y-2">
          <Label htmlFor="description">커뮤니티 설명</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="커뮤니티에 대한 간단한 설명을 입력하세요"
            rows={3}
            disabled={isSubmitting}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
          />
        </div>

        {/* 커뮤니티 규칙 */}
        <div className="space-y-2">
          <Label htmlFor="rules">커뮤니티 규칙</Label>
          <Textarea
            id="rules"
            value={formData.rules}
            onChange={(e) =>
              setFormData({ ...formData, rules: e.target.value })
            }
            placeholder="커뮤니티 규칙을 입력하세요"
            rows={5}
            disabled={isSubmitting}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] resize-none"
          />
          <p className="text-sm text-muted-foreground">
            커뮤니티 멤버들이 지켜야 할 규칙을 작성해주세요.
          </p>
        </div>

        {/* 공개 설정 */}
        <div className="space-y-2">
          <Label htmlFor="visibility">공개 설정</Label>
          <Select
            value={formData.visibility}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                visibility: value as CommunityVisibility,
              })
            }
            disabled={isSubmitting}
          >
            <SelectTrigger className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-2 border-black">
              <SelectItem value="PUBLIC" className="cursor-pointer">
                공개 - 누구나 접근 가능
              </SelectItem>
              <SelectItem value="PRIVATE" className="cursor-pointer">
                비공개 - 멤버만 접근 가능
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 기능 설정 */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium">기능 설정</h3>

          {/* 파일 업로드 설정 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowFileUpload">파일 업로드</Label>
              <p className="text-sm text-muted-foreground">
                멤버들이 게시글에 파일을 첨부할 수 있습니다.
              </p>
            </div>
            <input
              type="checkbox"
              id="allowFileUpload"
              checked={formData.allowFileUpload}
              onChange={(e) =>
                setFormData({ ...formData, allowFileUpload: e.target.checked })
              }
              disabled={isSubmitting}
              className="h-5 w-5 rounded border-2 border-black cursor-pointer"
            />
          </div>
        </div>

        {/* 고정 정보 (수정 불가) */}
        <div className="space-y-2 pt-4 border-t">
          <h3 className="font-medium">고정 정보</h3>
          <dl className="space-y-2 text-sm text-muted-foreground">
            <div>
              <dt className="inline font-medium">URL:</dt>{' '}
              <dd className="inline">/communities/{community.slug}</dd>
            </div>
          </dl>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-black hover:bg-gray-800 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
          >
            {isSubmitting ? (
              <>
                <ButtonSpinner className="mr-2" />
                저장 중...
              </>
            ) : (
              '변경사항 저장'
            )}
          </Button>
        </div>
      </form>

      {/* 아바타 변경 다이얼로그 */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>커뮤니티 아바타 변경</DialogTitle>
            <DialogDescription>
              커뮤니티를 대표할 아이콘을 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 미리보기 */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-lg border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-gray-50 flex items-center justify-center">
                {tempSelectedAvatar ? (
                  <div
                    className="w-full h-full flex items-center justify-center text-5xl"
                    style={{ backgroundColor: tempSelectedAvatar.color }}
                  >
                    {tempSelectedAvatar.emoji}
                  </div>
                ) : (
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                )}
              </div>
            </div>

            {/* 아바타 선택 그리드 */}
            <div className="border-2 border-black rounded-lg">
              <div className="p-3 bg-gray-100 border-b border-black font-bold">
                아이콘 선택
              </div>
              <div className="p-4 bg-white max-h-96 overflow-y-auto">
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-3">
                  {DEFAULT_AVATARS.map((avatar) => (
                    <button
                      key={avatar.name}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar)}
                      className={`w-14 h-14 text-3xl flex items-center justify-center rounded-lg border-2 border-black transition-all ${
                        tempSelectedAvatar?.name === avatar.name
                          ? 'ring-4 ring-blue-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                          : 'hover:scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                      style={{ backgroundColor: avatar.color }}
                      title={avatar.name}
                    >
                      {avatar.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAvatarDialog(false)
                setTempSelectedAvatar(selectedAvatar)
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleAvatarApply}
              disabled={!tempSelectedAvatar}
              className="bg-black hover:bg-gray-800 text-white"
            >
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 배너 변경 다이얼로그 */}
      <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>커뮤니티 배너 변경</DialogTitle>
            <DialogDescription>
              커뮤니티 페이지 상단에 표시될 배너를 선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 미리보기 */}
            {(tempSelectedBanner || tempSelectedUnsplashImage) && (
              <div className="relative aspect-[4/1] bg-gray-200 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                {tempSelectedBanner ? (
                  <div
                    className={`w-full h-full ${tempSelectedBanner.gradient}`}
                  />
                ) : tempSelectedUnsplashImage ? (
                  <Image
                    src={tempSelectedUnsplashImage.url}
                    alt="Banner preview"
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
            )}

            {/* 배너 선택 탭 */}
            <div className="border-2 border-black rounded-lg">
              <div className="flex border-b border-black">
                <button
                  type="button"
                  onClick={() => setBannerType('default')}
                  className={`flex-1 p-3 font-bold transition-colors ${
                    bannerType === 'default'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  기본 배너
                </button>
                <button
                  type="button"
                  onClick={() => setBannerType('unsplash')}
                  className={`flex-1 p-3 font-bold transition-colors border-l border-black ${
                    bannerType === 'unsplash'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  고품질 이미지
                </button>
              </div>

              <div className="p-4 bg-white max-h-96 overflow-y-auto">
                {bannerType === 'default' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {defaultBanners.map((banner) => (
                      <button
                        key={banner.id}
                        type="button"
                        onClick={() => handleBannerSelect(banner)}
                        className={`h-20 rounded-lg border-2 border-black transition-all ${
                          tempSelectedBanner?.id === banner.id
                            ? 'ring-4 ring-blue-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'hover:scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        <div
                          className={`w-full h-full rounded-md ${banner.gradient}`}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {bannerType === 'unsplash' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {RECOMMENDED_BANNER_IMAGES.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => handleUnsplashSelect(image)}
                        className={`relative h-20 rounded-lg border-2 border-black transition-all overflow-hidden ${
                          tempSelectedUnsplashImage?.id === image.id
                            ? 'ring-4 ring-blue-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'hover:scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={image.description}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 배너 제거 옵션 */}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setTempSelectedBanner(null)
                setTempSelectedUnsplashImage(null)
                removeBanner()
                setShowBannerDialog(false)
              }}
              className="w-full text-red-600 hover:bg-red-50"
            >
              배너 제거
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBannerDialog(false)
                setTempSelectedBanner(selectedBanner)
                setTempSelectedUnsplashImage(selectedUnsplashImage)
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleBannerApply}
              disabled={!tempSelectedBanner && !tempSelectedUnsplashImage}
              className="bg-black hover:bg-gray-800 text-white"
            >
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
