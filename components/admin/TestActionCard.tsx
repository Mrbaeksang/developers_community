'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TestActionCardProps {
  title: string
  description: string
  endpoint: string
  method: string
  params: Record<string, unknown>
  badge?: string | null
  danger?: boolean
  onSuccess?: () => void
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
}: TestActionCardProps) {
  const [loading, setLoading] = useState(false)

  const handleAction = async () => {
    setLoading(true)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(params) : undefined,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '요청 처리에 실패했습니다.')
      }

      toast.success(data.message || '작업이 완료되었습니다.')
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

  return (
    <Card className={danger ? 'border-destructive' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          className="w-full"
          variant={danger ? 'destructive' : 'default'}
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              처리 중...
            </>
          ) : (
            '실행'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
