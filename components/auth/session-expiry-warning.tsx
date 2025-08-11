'use client'

import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  getSessionManager,
  formatRemainingTime,
} from '@/lib/auth/session-manager'
import { Clock, LogOut, RefreshCw } from 'lucide-react'

export function SessionExpiryWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const manager = getSessionManager()

    // 세션 모니터링 시작
    manager.startMonitoring(
      // 만료 경고 콜백
      () => {
        setShowWarning(true)
        updateRemainingTime()
      },
      // 만료 콜백
      () => {
        setShowWarning(false)
      }
    )

    // 남은 시간 업데이트 (경고 표시 중일 때만)
    let intervalId: NodeJS.Timeout | null = null

    const updateRemainingTime = () => {
      const time = manager.getRemainingTime()
      setRemainingTime(time)

      // 1초마다 업데이트
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(() => {
        const newTime = manager.getRemainingTime()
        setRemainingTime(newTime)

        // 만료되면 인터벌 정리
        if (newTime <= 0) {
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
        }
      }, 1000)
    }

    return () => {
      manager.stopMonitoring()
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const manager = getSessionManager()
      const success = await manager.manualRefresh()

      if (success) {
        setShowWarning(false)
        setRemainingTime(null)

        // 페이지 새로고침으로 세션 갱신 반영
        router.refresh()
      } else {
        // 갱신 실패 시 로그인 페이지로
        await signOut({
          callbackUrl: '/auth/signin?expired=true',
          redirect: true,
        })
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true,
    })
  }

  const handleContinue = () => {
    setShowWarning(false)
    // 세션 갱신 시도
    handleRefresh()
  }

  if (!showWarning || remainingTime === null) return null

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            세션 만료 경고
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>보안을 위해 세션이 곧 만료됩니다.</p>
            <div className="rounded-lg bg-yellow-50 p-3 text-center">
              <p className="text-sm text-yellow-800">남은 시간</p>
              <p className="text-2xl font-bold text-yellow-900">
                {formatRemainingTime(remainingTime)}
              </p>
            </div>
            <p className="text-sm">계속 사용하시려면 세션을 연장해 주세요.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isRefreshing}
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
          <Button onClick={handleContinue} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                연장 중...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                계속 사용하기
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * 세션 상태 표시 컴포넌트 (옵션)
 */
export function SessionStatus() {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const manager = getSessionManager()

    const updateStatus = () => {
      setRemainingTime(manager.getRemainingTime())
      setIsActive(manager.isSessionActive())
    }

    // 초기 상태
    updateStatus()

    // 1분마다 업데이트
    const interval = setInterval(updateStatus, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isActive || remainingTime === null) return null

  // 1시간 미만일 때만 표시
  if (remainingTime > 3600) return null

  return (
    <div className="flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-1 text-sm">
      <Clock className="h-3 w-3 text-yellow-600" />
      <span className="text-yellow-800">
        세션: {formatRemainingTime(remainingTime)}
      </span>
    </div>
  )
}
