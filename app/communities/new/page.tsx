'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, Globe, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CreateCommunityPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    rules: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    allowFileUpload: true,
    allowChat: false,
  })

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

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || '커뮤니티 생성에 실패했습니다.')
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

  return (
    <div className="container max-w-3xl py-8">
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
              <Label htmlFor="name">커뮤니티 이름 *</Label>
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
                className="border-2 border-black"
                required
              />
            </div>

            {/* URL 슬러그 */}
            <div className="space-y-2">
              <Label htmlFor="slug">커뮤니티 URL *</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/communities/</span>
                <Input
                  id="slug"
                  placeholder="react-developers"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="border-2 border-black"
                  pattern="[a-z0-9\-]*"
                  required
                />
              </div>
              <p className="text-sm text-muted-foreground">
                영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다.
              </p>
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
                className="border-2 border-black min-h-[100px]"
              />
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
                className="border-2 border-black min-h-[100px]"
              />
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
                disabled={isSubmitting}
                className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
