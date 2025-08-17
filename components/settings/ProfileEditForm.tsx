'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Camera,
  Save,
  X,
  AlertTriangle,
  UserX,
  Shuffle,
  Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'
import {
  TetrisLoading,
  isMobileDevice,
} from '@/components/shared/TetrisLoading'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { signOut } from 'next-auth/react'

interface ProfileEditFormProps {
  user: {
    id: string
    name: string | null
    username: string | null
    email: string | null
    image: string | null
    bio: string | null
  }
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMobile, setIsMobile] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showAvatarDialog, setShowAvatarDialog] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  const [dicebearStyle, setDicebearStyle] = useState('avataaars')
  const [robohashSet, setRobohashSet] = useState('set4')
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    image: user.image || '',
  })

  useEffect(() => {
    setIsMobile(isMobileDevice())
    const handleResize = () => {
      setIsMobile(isMobileDevice())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // React Query - 프로필 업데이트 mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.success) {
        throw new Error(response.error || '프로필 업데이트 실패')
      }

      return response.data
    },
    onMutate: async (newData) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['user', user.id] })
      const previousUser = queryClient.getQueryData(['user', user.id])

      // 캐시된 사용자 데이터 업데이트 (존재할 경우)
      queryClient.setQueryData(
        ['user', user.id],
        (old: typeof user | undefined) => {
          if (!old) return old
          return {
            ...old,
            name: newData.name,
            username: newData.username,
            bio: newData.bio,
            image: newData.image,
          }
        }
      )

      // 즉시 성공 피드백 표시
      toast.success('프로필이 업데이트되었습니다')

      return { previousUser }
    },
    onSuccess: () => {
      // 성공 시 프로필 페이지로 이동
      router.push(`/profile/${user.id}`)
      router.refresh()
    },
    onError: (error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousUser) {
        queryClient.setQueryData(['user', user.id], context.previousUser)
      }

      toast.error(
        error instanceof Error ? error.message : '오류가 발생했습니다'
      )
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    router.push(`/profile/${user.id}`)
  }

  // 회원 탈퇴 mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient('/api/user/account', {
        method: 'DELETE',
      })

      if (!response.success) {
        throw new Error(response.error || '회원 탈퇴 실패')
      }

      return response
    },
    onSuccess: async () => {
      toast.success('회원 탈퇴가 완료되었습니다')
      // 로그아웃 처리
      await signOut({ callbackUrl: '/' })
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : '회원 탈퇴에 실패했습니다'
      )
    },
  })

  const handleDeleteAccount = () => {
    if (deleteConfirmText === '삭제합니다') {
      deleteAccountMutation.mutate()
    }
  }

  // 아바타 업데이트 mutation
  const updateAvatarMutation = useMutation<
    { id: string; image: string | null; name: string | null },
    Error,
    string | null
  >({
    mutationFn: async (imageUrl) => {
      const response = await apiClient('/api/user/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.success) {
        throw new Error(response.error || '프로필 사진 업데이트 실패')
      }

      return response.data as {
        id: string
        image: string | null
        name: string | null
      }
    },
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, image: data.image || '' }))
      setShowAvatarDialog(false)
      setAvatarUrl('')
      setAvatarPreview('')
      toast.success('프로필 사진이 업데이트되었습니다')
      router.refresh()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : '프로필 사진 업데이트 실패'
      )
    },
  })

  // DiceBear 스타일 옵션 (더 많은 스타일 추가)
  const dicebearStyles = [
    {
      value: 'adventurer',
      label: 'Adventurer',
      preview: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
    },
    {
      value: 'adventurer-neutral',
      label: 'Neutral',
      preview: 'https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=Felix',
    },
    {
      value: 'avataaars',
      label: 'Avataaars',
      preview: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    },
    {
      value: 'avataaars-neutral',
      label: 'Avataaars N',
      preview: 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Felix',
    },
    {
      value: 'big-ears',
      label: 'Big Ears',
      preview: 'https://api.dicebear.com/7.x/big-ears/svg?seed=Felix',
    },
    {
      value: 'big-ears-neutral',
      label: 'Big Ears N',
      preview: 'https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Felix',
    },
    {
      value: 'big-smile',
      label: 'Big Smile',
      preview: 'https://api.dicebear.com/7.x/big-smile/svg?seed=Felix',
    },
    {
      value: 'bottts',
      label: 'Bottts',
      preview: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    },
    {
      value: 'bottts-neutral',
      label: 'Bottts N',
      preview: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix',
    },
    {
      value: 'croodles',
      label: 'Croodles',
      preview: 'https://api.dicebear.com/7.x/croodles/svg?seed=Felix',
    },
    {
      value: 'croodles-neutral',
      label: 'Croodles N',
      preview: 'https://api.dicebear.com/7.x/croodles-neutral/svg?seed=Felix',
    },
    {
      value: 'fun-emoji',
      label: 'Fun Emoji',
      preview: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix',
    },
    {
      value: 'icons',
      label: 'Icons',
      preview: 'https://api.dicebear.com/7.x/icons/svg?seed=Felix',
    },
    {
      value: 'identicon',
      label: 'Identicon',
      preview: 'https://api.dicebear.com/7.x/identicon/svg?seed=Felix',
    },
    {
      value: 'initials',
      label: 'Initials',
      preview: 'https://api.dicebear.com/7.x/initials/svg?seed=AB',
    },
    {
      value: 'lorelei',
      label: 'Lorelei',
      preview: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix',
    },
    {
      value: 'lorelei-neutral',
      label: 'Lorelei N',
      preview: 'https://api.dicebear.com/7.x/lorelei-neutral/svg?seed=Felix',
    },
    {
      value: 'micah',
      label: 'Micah',
      preview: 'https://api.dicebear.com/7.x/micah/svg?seed=Felix',
    },
    {
      value: 'miniavs',
      label: 'Miniavs',
      preview: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Felix',
    },
    {
      value: 'notionists',
      label: 'Notionists',
      preview: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix',
    },
    {
      value: 'notionists-neutral',
      label: 'Notionists N',
      preview: 'https://api.dicebear.com/7.x/notionists-neutral/svg?seed=Felix',
    },
    {
      value: 'open-peeps',
      label: 'Open Peeps',
      preview: 'https://api.dicebear.com/7.x/open-peeps/svg?seed=Felix',
    },
    {
      value: 'personas',
      label: 'Personas',
      preview: 'https://api.dicebear.com/7.x/personas/svg?seed=Felix',
    },
    {
      value: 'pixel-art',
      label: 'Pixel Art',
      preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Felix',
    },
    {
      value: 'pixel-art-neutral',
      label: 'Pixel Art N',
      preview: 'https://api.dicebear.com/7.x/pixel-art-neutral/svg?seed=Felix',
    },
    {
      value: 'rings',
      label: 'Rings',
      preview: 'https://api.dicebear.com/7.x/rings/svg?seed=Felix',
    },
    {
      value: 'shapes',
      label: 'Shapes',
      preview: 'https://api.dicebear.com/7.x/shapes/svg?seed=Felix',
    },
    {
      value: 'thumbs',
      label: 'Thumbs',
      preview: 'https://api.dicebear.com/7.x/thumbs/svg?seed=Felix',
    },
  ]

  // RoboHash 세트 옵션 (배경 옵션 추가)
  const robohashSets = [
    {
      value: 'set1',
      label: '로봇 1',
      preview: 'https://robohash.org/preview1?set=set1&size=100x100',
    },
    {
      value: 'set2',
      label: '몬스터',
      preview: 'https://robohash.org/preview2?set=set2&size=100x100',
    },
    {
      value: 'set3',
      label: '로봇 헤드',
      preview: 'https://robohash.org/preview3?set=set3&size=100x100',
    },
    {
      value: 'set4',
      label: '고양이',
      preview: 'https://robohash.org/preview4?set=set4&size=100x100',
    },
    {
      value: 'set5',
      label: '인간',
      preview: 'https://robohash.org/preview5?set=set5&size=100x100',
    },
    {
      value: 'set1-bg1',
      label: '로봇+배경1',
      preview: 'https://robohash.org/preview6?set=set1&bgset=bg1&size=100x100',
    },
    {
      value: 'set1-bg2',
      label: '로봇+배경2',
      preview: 'https://robohash.org/preview7?set=set1&bgset=bg2&size=100x100',
    },
    {
      value: 'set2-bg1',
      label: '몬스터+배경',
      preview: 'https://robohash.org/preview8?set=set2&bgset=bg1&size=100x100',
    },
    {
      value: 'set4-bg1',
      label: '고양이+배경',
      preview: 'https://robohash.org/preview9?set=set4&bgset=bg1&size=100x100',
    },
    {
      value: 'any',
      label: '랜덤 믹스',
      preview: 'https://robohash.org/preview10?set=any&size=100x100',
    },
  ]

  // DiceBear 아바타 생성
  const generateDiceBearAvatar = (style: string) => {
    const seed = Math.random().toString(36).substring(7)
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`
    setAvatarPreview(url)
    setAvatarUrl(url)
    setDicebearStyle(style)
  }

  // UI Avatars 생성
  const generateUIAvatar = () => {
    const name = formData.name || user.email?.split('@')[0] || 'User'
    const backgrounds = ['264653', '2a9d8f', 'e76f51', 'f4a261', 'e9c46a']
    const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)]
    const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=200`
    setAvatarPreview(url)
    setAvatarUrl(url)
  }

  // RoboHash 생성
  const generateRoboHash = (setOption: string) => {
    const identifier = formData.username || user.email || 'user'
    const seed = Math.random().toString(36).substring(7)
    let url = ''

    if (setOption.includes('-bg')) {
      const [set, bg] = setOption.split('-')
      url = `https://robohash.org/${identifier}-${seed}?set=${set}&bgset=${bg}&size=200x200`
    } else {
      url = `https://robohash.org/${identifier}-${seed}?set=${setOption}&size=200x200`
    }

    setAvatarPreview(url)
    setAvatarUrl(url)
    setRobohashSet(setOption)
  }

  const handleAvatarSubmit = () => {
    if (avatarUrl || avatarPreview) {
      updateAvatarMutation.mutate(avatarUrl || avatarPreview)
    }
  }

  const handleRemoveAvatar = () => {
    updateAvatarMutation.mutate(null)
  }

  const cardClasses =
    'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white'
  const inputClasses =
    'border-2 border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all'
  const buttonClasses =
    'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold'

  return (
    <>
      <Card className={cardClasses}>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative">
          {/* 로딩 오버레이 */}
          {updateProfileMutation.isPending && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
              {isMobile ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-gray-900 mx-auto mb-4" />
                  <p className="text-sm font-bold text-gray-700">
                    프로필을 업데이트하고 있습니다...
                  </p>
                </div>
              ) : (
                <TetrisLoading
                  size="sm"
                  text="프로필을 업데이트하고 있습니다..."
                />
              )}
            </div>
          )}

          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {formData.image && (
                <AvatarImage
                  src={formData.image}
                  alt={formData.name || undefined}
                />
              )}
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-3xl font-black">
                {formData.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              className={buttonClasses}
              onClick={() => {
                setAvatarPreview(formData.image || '')
                setShowAvatarDialog(true)
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              사진 변경
            </Button>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="font-bold">
              이름
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={inputClasses}
              placeholder="표시될 이름"
              maxLength={50}
            />
          </div>

          {/* 사용자명 */}
          <div className="space-y-2">
            <Label htmlFor="username" className="font-bold">
              사용자명
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    username: e.target.value.replace(/[^a-zA-Z0-9_]/g, ''),
                  }))
                }
                className={`${inputClasses} pl-8`}
                placeholder="username"
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              영문, 숫자, 언더스코어(_)만 사용 가능
            </p>
          </div>

          {/* 자기소개 */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="font-bold">
              자기소개
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              className={inputClasses}
              placeholder="간단한 자기소개를 작성해주세요"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.bio.length}/200
            </p>
          </div>

          {/* 이메일 (읽기 전용) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">
              이메일
            </Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className={`${inputClasses} bg-gray-50`}
            />
            <p className="text-xs text-muted-foreground">
              {user.email
                ? 'OAuth 계정은 이메일을 변경할 수 없습니다'
                : '이메일 정보가 없습니다'}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className={buttonClasses}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateProfileMutation.isPending ? '저장 중...' : '저장'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateProfileMutation.isPending}
              className={buttonClasses}
            >
              <X className="h-4 w-4 mr-2" />
              취소
            </Button>
          </div>
        </form>
      </Card>

      {/* 회원 탈퇴 섹션 */}
      <Card className="mt-8 border-2 border-red-500 bg-red-50">
        <div className="p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            위험 구역
          </h3>
          <p className="text-sm text-red-700 mb-4">
            회원 탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="border-2 border-red-700 shadow-[2px_2px_0px_0px_rgba(185,28,28,1)] hover:shadow-[3px_3px_0px_0px_rgba(185,28,28,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
          >
            <UserX className="h-4 w-4 mr-2" />
            회원 탈퇴
          </Button>
        </div>
      </Card>

      {/* 회원 탈퇴 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              정말로 탈퇴하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>회원 탈퇴 시 다음 데이터가 모두 삭제됩니다:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>작성한 모든 게시글과 댓글</li>
                <li>커뮤니티 가입 정보</li>
                <li>북마크와 좋아요</li>
                <li>프로필 정보</li>
              </ul>
              <p className="font-semibold text-red-600 mt-3">
                이 작업은 되돌릴 수 없습니다!
              </p>
              <div className="mt-4">
                <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                  계속하려면{' '}
                  <span className="font-bold">&quot;삭제합니다&quot;</span>를
                  입력하세요:
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="삭제합니다"
                  className="mt-2 border-2 border-red-300 focus:border-red-500"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmText('')
              }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={
                deleteConfirmText !== '삭제합니다' ||
                deleteAccountMutation.isPending
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteAccountMutation.isPending
                ? '탈퇴 처리 중...'
                : '회원 탈퇴'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 프로필 사진 변경 다이얼로그 */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>프로필 사진 변경</DialogTitle>
            <DialogDescription>
              외부 이미지 URL을 사용하여 프로필 사진을 설정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 미리보기 */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {(avatarPreview || formData.image) && (
                  <AvatarImage src={avatarPreview || formData.image} />
                )}
                <AvatarFallback className="text-2xl font-bold">
                  {formData.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* URL 입력 */}
            <div className="space-y-2">
              <Label htmlFor="avatar-url">이미지 URL</Label>
              <div className="flex gap-2">
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value)
                    if (e.target.value) {
                      setAvatarPreview(e.target.value)
                    }
                  }}
                  className={inputClasses}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (avatarUrl) setAvatarPreview(avatarUrl)
                  }}
                  disabled={!avatarUrl}
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 아바타 생성 옵션들 */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* DiceBear */}
              <div className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-2">
                  <Label className="text-sm font-medium">
                    DiceBear 스타일 (28개)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateDiceBearAvatar(dicebearStyle)}
                    className="h-7 px-2"
                  >
                    <Shuffle className="h-3 w-3 mr-1" />
                    새로고침
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
                  {dicebearStyles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => generateDiceBearAvatar(style.value)}
                      className={`relative group rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                        dicebearStyle === style.value
                          ? 'border-primary shadow-md bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden rounded">
                        <img
                          src={style.preview}
                          alt={style.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] mt-1 block text-center truncate">
                        {style.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* RoboHash */}
              <div className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-white z-10 pt-4 pb-2">
                  <Label className="text-sm font-medium">
                    RoboHash 세트 (10개)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => generateRoboHash(robohashSet)}
                    className="h-7 px-2"
                  >
                    <Shuffle className="h-3 w-3 mr-1" />
                    새로고침
                  </Button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {robohashSets.map((set) => (
                    <button
                      key={set.value}
                      type="button"
                      onClick={() => generateRoboHash(set.value)}
                      className={`relative group rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                        robohashSet === set.value
                          ? 'border-primary shadow-md bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden rounded bg-gray-50">
                        <img
                          src={set.preview}
                          alt={set.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] mt-1 block text-center">
                        {set.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UI Avatars */}
              <div className="space-y-2">
                <div className="sticky top-0 bg-white z-10 pt-4 pb-2">
                  <Label className="text-sm font-medium">이니셜 아바타</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateUIAvatar}
                  className="w-full"
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  랜덤 색상으로 이니셜 아바타 생성
                </Button>
              </div>

              {/* 프로필 사진 제거 */}
              {formData.image && (
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    현재 프로필 사진 제거
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAvatarDialog(false)
                setAvatarUrl('')
                setAvatarPreview('')
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleAvatarSubmit}
              disabled={
                updateAvatarMutation.isPending || (!avatarUrl && !avatarPreview)
              }
            >
              {updateAvatarMutation.isPending ? '업데이트 중...' : '적용'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
