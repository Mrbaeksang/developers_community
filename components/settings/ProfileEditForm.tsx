'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface ProfileEditFormProps {
  user: {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
    bio: string | null
  }
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    image: user.image || '',
  })

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

  const cardClasses =
    'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white'
  const inputClasses =
    'border-2 border-black focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all'
  const buttonClasses =
    'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold'

  return (
    <Card className={cardClasses}>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <AvatarImage src={formData.image} alt={formData.name} />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-3xl font-black">
              {formData.name?.[0] || user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Button
            type="button"
            variant="outline"
            className={buttonClasses}
            disabled
          >
            <Camera className="h-4 w-4 mr-2" />
            사진 변경 (준비중)
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
            value={user.email}
            disabled
            className={`${inputClasses} bg-gray-50`}
          />
          <p className="text-xs text-muted-foreground">
            OAuth 계정은 이메일을 변경할 수 없습니다
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
  )
}
