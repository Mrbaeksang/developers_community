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
import { Loader2 } from 'lucide-react'

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
    // count 파라미터는 슬라이더로
    if (key === 'count') {
      const max = key === 'count' && action.title.includes('사용자') ? 100 : 50
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{key === 'count' ? '생성할 개수' : key}</Label>
            <span className="text-sm text-muted-foreground">{String(value)}</span>
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
          <Select value={String(value)} onValueChange={(val: string) => updateParam(key, val)}>
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
          <RadioGroup value={String(value)} onValueChange={(val: string) => updateParam(key, val)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PUBLISHED" id="published" />
              <Label htmlFor="published">게시됨 (PUBLISHED)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PENDING" id="pending" />
              <Label htmlFor="pending">승인 대기 (PENDING)</Label>
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
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            실행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}