'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CommunityActionsProps {
  community: {
    id: string
    slug: string
  }
  isOwner: boolean
  isMember: boolean
  isPending: boolean
  canJoin: boolean
  isAuthenticated: boolean
}

export function CommunityActions({
  community,
  isOwner,
  isMember,
  isPending,
  canJoin,
  isAuthenticated,
}: CommunityActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '가입 실패')
      }

      const data = await res.json()
      toast.success(data.message)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '가입에 실패했습니다'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('정말로 커뮤니티에서 탈퇴하시겠습니까?')) {
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '탈퇴 실패')
      }

      const data = await res.json()
      toast.success(data.message)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '탈퇴에 실패했습니다'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {isOwner && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <Link href={`/communities/${community.slug}/settings`}>
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Link>
        </Button>
      )}
      {isMember && !isOwner && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLeave}
          disabled={isLoading}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoading ? '처리중...' : '탈퇴'}
        </Button>
      )}
      {isPending && (
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          승인 대기중
        </Button>
      )}
      {!isMember && !isPending && canJoin && (
        <Button
          size="sm"
          onClick={handleJoin}
          disabled={isLoading}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          {isLoading ? '처리중...' : '가입하기'}
        </Button>
      )}
      {!isAuthenticated && (
        <Button
          size="sm"
          asChild
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <Link href="/auth/signin">로그인 후 가입</Link>
        </Button>
      )}
    </div>
  )
}
