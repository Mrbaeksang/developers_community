'use client'

import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'

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

// Community 데이터 타입 정의
interface CommunityData {
  id: string
  slug: string
  memberCount: number
  isMember: boolean
  isPending: boolean
  [key: string]: unknown
}

export function CommunityActions({
  community,
  isOwner,
  isMember,
  isPending,
  canJoin,
  isAuthenticated,
}: CommunityActionsProps) {
  const queryClient = useQueryClient()

  // 커뮤니티 가입 mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient(
        `/api/communities/${community.id}/join`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.success) {
        throw new Error(response.error || '가입 실패')
      }

      return response.data
    },
    onMutate: async () => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['community', community.id] })
      await queryClient.cancelQueries({
        queryKey: ['community', community.slug],
      })

      const previousCommunityById = queryClient.getQueryData([
        'community',
        community.id,
      ])
      const previousCommunityBySlug = queryClient.getQueryData([
        'community',
        community.slug,
      ])

      // 커뮤니티 데이터에 멤버 상태 즉시 반영
      queryClient.setQueryData(['community', community.id], (old: unknown) => {
        if (!old) return old
        const communityData = old as CommunityData
        return {
          ...communityData,
          memberCount: (communityData.memberCount || 0) + 1,
          isMember: true,
          isPending: false,
        }
      })

      queryClient.setQueryData(
        ['community', community.slug],
        (old: unknown) => {
          if (!old) return old
          const communityData = old as CommunityData
          return {
            ...communityData,
            memberCount: (communityData.memberCount || 0) + 1,
            isMember: true,
            isPending: false,
          }
        }
      )

      return { previousCommunityById, previousCommunityBySlug }
    },
    onSuccess: () => {
      // 성공 메시지 표시
      toast.success('커뮤니티에 가입되었습니다')

      // 커뮤니티 목록 쿼리도 무효화 (새로고침용)
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousCommunityById) {
        queryClient.setQueryData(
          ['community', community.id],
          context.previousCommunityById
        )
      }
      if (context?.previousCommunityBySlug) {
        queryClient.setQueryData(
          ['community', community.slug],
          context.previousCommunityBySlug
        )
      }

      toast.error(error.message || '가입에 실패했습니다')
    },
  })

  // 커뮤니티 탈퇴 mutation
  const leaveCommunityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient(
        `/api/communities/${community.id}/join`,
        {
          method: 'DELETE',
        }
      )

      if (!response.success) {
        throw new Error(response.error || '탈퇴 실패')
      }

      return response.data
    },
    onMutate: async () => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['community', community.id] })
      await queryClient.cancelQueries({
        queryKey: ['community', community.slug],
      })

      const previousCommunityById = queryClient.getQueryData([
        'community',
        community.id,
      ])
      const previousCommunityBySlug = queryClient.getQueryData([
        'community',
        community.slug,
      ])

      // 커뮤니티 데이터에 멤버 상태 즉시 반영
      queryClient.setQueryData(['community', community.id], (old: unknown) => {
        if (!old) return old
        const communityData = old as CommunityData
        return {
          ...communityData,
          memberCount: Math.max(0, (communityData.memberCount || 0) - 1),
          isMember: false,
          isPending: false,
        }
      })

      queryClient.setQueryData(
        ['community', community.slug],
        (old: unknown) => {
          if (!old) return old
          const communityData = old as CommunityData
          return {
            ...communityData,
            memberCount: Math.max(0, (communityData.memberCount || 0) - 1),
            isMember: false,
            isPending: false,
          }
        }
      )

      return { previousCommunityById, previousCommunityBySlug }
    },
    onSuccess: () => {
      // 성공 메시지 표시
      toast.success('커뮤니티에서 탈퇴했습니다')

      // 커뮤니티 목록 쿼리도 무효화 (새로고침용)
      queryClient.invalidateQueries({ queryKey: ['communities'] })
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousCommunityById) {
        queryClient.setQueryData(
          ['community', community.id],
          context.previousCommunityById
        )
      }
      if (context?.previousCommunityBySlug) {
        queryClient.setQueryData(
          ['community', community.slug],
          context.previousCommunityBySlug
        )
      }

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
          {leaveCommunityMutation.isPending ? (
            <ButtonSpinner />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
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
          {joinCommunityMutation.isPending && <ButtonSpinner />}
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
