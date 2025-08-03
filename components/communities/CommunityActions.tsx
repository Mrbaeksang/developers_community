'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

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
  const queryClient = useQueryClient()

  // 커뮤니티 가입 mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '가입 실패')
      }

      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || data.message || '가입되었습니다')

      // 커뮤니티 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['community', community.id] })
      queryClient.invalidateQueries({ queryKey: ['community', community.slug] })
      queryClient.invalidateQueries({ queryKey: ['communities'] })

      // 강제로 라우터 리프레시
      router.refresh()
      // 약간의 지연 후 다시 리프레시 (Next.js 15 캐시 문제 해결)
      setTimeout(() => {
        router.refresh()
      }, 100)
    },
    onError: (error: Error) => {
      toast.error(error.message || '가입에 실패했습니다')
    },
  })

  // 커뮤니티 탈퇴 mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${community.id}/join`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '탈퇴 실패')
      }

      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.data?.message || data.message || '탈퇴되었습니다')

      // 커뮤니티 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['community', community.id] })
      queryClient.invalidateQueries({ queryKey: ['community', community.slug] })
      queryClient.invalidateQueries({ queryKey: ['communities'] })

      // 강제로 라우터 리프레시
      router.refresh()
      // 약간의 지연 후 다시 리프레시 (Next.js 15 캐시 문제 해결)
      setTimeout(() => {
        router.refresh()
      }, 100)
    },
    onError: (error: Error) => {
      toast.error(error.message || '탈퇴에 실패했습니다')
    },
  })

  const handleJoin = () => {
    joinCommunityMutation.mutate()
  }

  const handleLeave = () => {
    if (!confirm('정말로 커뮤니티에서 탈퇴하시겠습니까?')) {
      return
    }
    leaveCommunityMutation.mutate()
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
          disabled={leaveCommunityMutation.isPending}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {leaveCommunityMutation.isPending ? '처리중...' : '탈퇴'}
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
          disabled={joinCommunityMutation.isPending}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
        >
          {joinCommunityMutation.isPending ? '처리중...' : '가입하기'}
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
