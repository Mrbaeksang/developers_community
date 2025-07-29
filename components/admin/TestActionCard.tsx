'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Settings, Play, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { TestActionModal } from './TestActionModal'

interface TestActionCardProps {
  title: string
  description: string
  endpoint: string
  method: string
  params: Record<string, unknown>
  badge?: string | null
  danger?: boolean
  onSuccess?: () => void
  onResult?: (result: {
    action: string
    endpoint: string
    params: Record<string, unknown>
    response: {
      message?: string
      created?: unknown
      [key: string]: unknown
    }
  }) => void
}

export function TestActionCard({
  title,
  description,
  endpoint,
  method,
  params,
  badge,
  danger = false,
  onSuccess,
  onResult,
}: TestActionCardProps) {
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleAction = async (customParams?: Record<string, unknown>) => {
    setLoading(true)
    const finalParams = customParams || params

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(finalParams) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '요청 처리에 실패했습니다.')
      }

      toast.success(data.message || '작업이 완료되었습니다.')

      // 결과 데이터를 상위 컴포넌트로 전달
      if (onResult && data) {
        onResult({
          action: title,
          endpoint,
          params: finalParams,
          response: data,
        })
      }

      onSuccess?.()
    } catch (error) {
      console.error('Test action failed:', error)
      toast.error(
        error instanceof Error ? error.message : '작업 처리에 실패했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  // 커스터마이징이 가능한 액션인지 확인
  const hasCustomizableParams = Object.keys(params).length > 0 && !danger

  return (
    <>
      <Card className={danger ? 'border-destructive' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant={danger ? 'destructive' : 'default'}
              onClick={() =>
                hasCustomizableParams ? setModalOpen(true) : handleAction()
              }
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  {danger ? (
                    <AlertTriangle className="mr-2 h-4 w-4" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  실행
                </>
              )}
            </Button>
            {hasCustomizableParams && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setModalOpen(true)}
                disabled={loading}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 커스터마이징 모달 */}
      <TestActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        action={{ title, description, endpoint, method, params }}
        onExecute={handleAction}
      />
    </>
  )
}
