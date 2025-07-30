'use client'

import { useState } from 'react'
import { Community, CommunityVisibility } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
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

interface GeneralSettingsProps {
  community: Community
}

export default function CommunityGeneralSettings({
  community,
}: GeneralSettingsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || '',
    rules: community.rules || '',
    visibility: community.visibility,
    allowFileUpload: community.allowFileUpload,
    allowChat: community.allowChat,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('커뮤니티 이름을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '설정 변경에 실패했습니다.')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
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

        {/* 실시간 채팅 설정 */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allowChat">실시간 채팅</Label>
            <p className="text-sm text-muted-foreground">
              커뮤니티 멤버들이 실시간으로 채팅할 수 있습니다.
            </p>
          </div>
          <input
            type="checkbox"
            id="allowChat"
            checked={formData.allowChat}
            onChange={(e) =>
              setFormData({ ...formData, allowChat: e.target.checked })
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              저장 중...
            </>
          ) : (
            '변경사항 저장'
          )}
        </Button>
      </div>
    </form>
  )
}
