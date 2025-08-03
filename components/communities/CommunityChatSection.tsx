'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const FloatingChatButton = dynamic(
  () => import('@/components/chat/FloatingChatButton'),
  { ssr: false }
)

interface CommunityChatSectionProps {
  communityId: string
  isMember: boolean
  allowChat: boolean
}

interface ChannelInfo {
  id: string
  name: string
  description: string | null
  type: string
}

export default function CommunityChatSection({
  communityId,
  isMember,
  allowChat,
}: CommunityChatSectionProps) {
  const [channel, setChannel] = useState<ChannelInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isMember || !allowChat) {
      setLoading(false)
      return
    }

    fetchChannel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, isMember, allowChat])

  const fetchChannel = async () => {
    try {
      const res = await fetch(`/api/communities/${communityId}/channel`)
      if (!res.ok) {
        throw new Error('Failed to fetch channel')
      }
      const data = await res.json()
      setChannel(data.data?.channel || data.channel)
    } catch (error) {
      console.error('Failed to fetch channel:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isMember || !allowChat || loading || !channel) {
    return null
  }

  return (
    <FloatingChatButton channelId={channel.id} channelName={channel.name} />
  )
}
