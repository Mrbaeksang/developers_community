'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'

interface TestActionModalProps {
  isOpen: boolean
  onClose: () => void
  action: {
    title: string
    description: string
    endpoint: string
    method: string
    params: Record<string, unknown>
  }
  onExecute: (params: Record<string, unknown>) => Promise<void>
}

export function TestActionModal({
  isOpen,
  onClose,
  action,
  onExecute,
}: TestActionModalProps) {
  const [loading, setLoading] = useState(false)
  const [customParams, setCustomParams] = useState(action.params)

  const handleExecute = async () => {
    setLoading(true)
    try {
      await onExecute(customParams)
      onClose()
    } catch (error) {
      console.error('Failed to execute action:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateParam = (key: string, value: unknown) => {
    setCustomParams((prev) => ({ ...prev, [key]: value }))
  }

  // 파라미터 타입에 따른 입력 컴포넌트 렌더링
  const renderParamInput = (key: string, value: unknown) => {
    // email 필드
    if (key === 'email') {
      return (
        <div className="space-y-2">
          <Label>이메일</Label>
          <Input
            type="email"
            value={String(value)}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder="user@example.com"
          />
        </div>
      )
    }

    // name, title 필드
    if (key === 'name' || key === 'title') {
      return (
        <div className="space-y-2">
          <Label>{key === 'name' ? '이름' : '제목'}</Label>
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder={key === 'name' ? '사용자 이름' : '게시글 제목'}
          />
        </div>
      )
    }

    // content 필드
    if (key === 'content') {
      return (
        <div className="space-y-2">
          <Label>내용</Label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={String(value)}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder="내용을 입력하세요"
          />
        </div>
      )
    }

    // postId, categoryId 필드
    if (key === 'postId' || key === 'categoryId' || key === 'communityId') {
      return (
        <div className="space-y-2">
          <Label>
            {key === 'postId'
              ? '게시글 ID'
              : key === 'categoryId'
                ? '카테고리 ID'
                : '커뮤니티 ID'}
          </Label>
          <Input
            type="text"
            value={String(value)}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder="ID를 입력하거나 비워두면 랜덤 선택"
          />
        </div>
      )
    }

    // image 필드
    if (key === 'image') {
      return (
        <div className="space-y-2">
          <Label>프로필 이미지 URL</Label>
          <Input
            type="url"
            value={String(value)}
            onChange={(e) => updateParam(key, e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      )
    }

    // globalRole 필드
    if (key === 'globalRole') {
      return (
        <div className="space-y-2">
          <Label>전역 권한</Label>
          <Select
            value={String(value)}
            onValueChange={(val: string) => updateParam(key, val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">일반 사용자</SelectItem>
              <SelectItem value="MANAGER">매니저</SelectItem>
              <SelectItem value="ADMIN">관리자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    // count 파라미터는 슬라이더로
    if (key === 'count') {
      const max = key === 'count' && action.title.includes('사용자') ? 100 : 50
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{key === 'count' ? '생성할 개수' : key}</Label>
            <span className="text-sm text-muted-foreground">
              {String(value)}
            </span>
          </div>
          <Slider
            value={[Number(value)]}
            onValueChange={(values: number[]) => updateParam(key, values[0])}
            max={max}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
      )
    }

    // role 파라미터는 셀렉트로
    if (key === 'role') {
      return (
        <div className="space-y-2">
          <Label>권한 선택</Label>
          <Select
            value={String(value)}
            onValueChange={(val: string) => updateParam(key, val)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">관리자 (ADMIN)</SelectItem>
              <SelectItem value="MANAGER">매니저 (MANAGER)</SelectItem>
              <SelectItem value="USER">일반 사용자 (USER)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )
    }

    // status 파라미터는 라디오 버튼으로
    if (key === 'status') {
      return (
        <div className="space-y-2">
          <Label>게시글 상태</Label>
          <RadioGroup
            value={String(value)}
            onValueChange={(val: string) => updateParam(key, val)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PUBLISHED" id="published" />
              <Label htmlFor="published">게시됨 (PUBLISHED)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PENDING" id="pending" />
              <Label htmlFor="pending">승인 대기 (PENDING)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DRAFT" id="draft" />
              <Label htmlFor="draft">임시저장 (DRAFT)</Label>
            </div>
          </RadioGroup>
        </div>
      )
    }

    // 기본: 텍스트 입력
    return (
      <div className="space-y-2">
        <Label>{key}</Label>
        <Input
          type="text"
          value={String(value)}
          onChange={(e) => updateParam(key, e.target.value)}
        />
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{action.title}</DialogTitle>
          <DialogDescription>{action.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(customParams).map(([key, value]) => (
            <div key={key}>{renderParamInput(key, value)}</div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleExecute} disabled={loading}>
            {loading && <ButtonSpinner className="mr-2" />}
            실행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
