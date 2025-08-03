'use client'

import { useState, useEffect } from 'react'
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

export function ChatProvider() {
  const [globalChannel, setGlobalChannel] = useState<GlobalChannel | null>(null)

  useEffect(() => {
    // 전역 채널 정보 가져오기 (익명 사용자도 접근 가능)
    fetch('/api/chat/channels?type=global')
      .then((res) => res.json())
      .then((data) => {
        // 새로운 응답 형식 처리: { success: true, data: { channels } }
        const channels =
          data.success && data.data ? data.data.channels : data.channels || data

        if (channels && channels.length > 0) {
          setGlobalChannel(channels[0])
        }
      })
      .catch((error) => {
        console.error('Failed to fetch global channel:', error)
      })
  }, [])

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
