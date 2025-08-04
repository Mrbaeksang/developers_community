'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'

const FloatingChatButton = dynamic(
  () => import('@/components/chat/FloatingChatButton'),
  { ssr: false }
)

interface GlobalChannel {
  id: string
  name: string
  description: string | null
  type: string
}

// 전역 채널 가져오기 함수
const fetchGlobalChannel = async (): Promise<GlobalChannel | null> => {
  const res = await fetch('/api/chat/channels?type=global')
  if (!res.ok) {
    throw new Error('Failed to fetch global channel')
  }
  const data = await res.json()

  // 새로운 응답 형식 처리: { success: true, data: { channels } }
  const channels =
    data.success && data.data ? data.data.channels : data.channels || data

  return channels && channels.length > 0 ? channels[0] : null
}

export function ChatProvider() {
  // React Query로 전역 채널 관리
  const { data: globalChannel } = useQuery({
    queryKey: ['globalChannel'],
    queryFn: fetchGlobalChannel,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    gcTime: 10 * 60 * 1000, // 10분간 캐시
    retry: 1, // 실패시 1회만 재시도 (익명 사용자도 접근 가능)
  })

  if (!globalChannel) {
    return null // 채널 정보를 로드하는 동안 아무것도 표시하지 않음
  }

  return (
    <FloatingChatButton
      channelId={globalChannel.id}
      channelName={globalChannel.name}
    />
  )
}
