'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const FloatingChatButton = dynamic(
  () => import('@/components/chat/FloatingChatButton'),
  { ssr: false }
)

interface ChannelInfo {
  id: string
  name: string
  description: string | null
  type: string
}

export default function GlobalChatSection() {
  const [channel, setChannel] = useState<ChannelInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    fetchGlobalChannel()
  }, [])

  const fetchGlobalChannel = async () => {
    try {
      const res = await fetch('/api/chat/global')
      if (!res.ok) {
        throw new Error('Failed to fetch global channel')
      }
      const result = await res.json()
      // successResponse 형식으로 오는 경우 data.channel 필드에서 실제 데이터 추출
      setChannel(result.data?.channel || result.channel)
    } catch (error) {
      console.error('Failed to fetch global channel:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShowChat = () => {
    setShowChat(true)
  }

  if (loading || !channel) {
    return null
  }

  return (
    <>
      <div onClick={handleShowChat} className="cursor-pointer">
        전체 채팅 열기
      </div>
      {showChat && (
        <FloatingChatButton channelId={channel.id} channelName={channel.name} />
      )}
    </>
  )
}
