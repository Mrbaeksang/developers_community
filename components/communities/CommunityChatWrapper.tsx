'use client'

import { useState } from 'react'
import CommunityChatPanel from './CommunityChatPanel'

interface CommunityChatWrapperProps {
  communityId: string // 실제로는 slug
  communityName: string
  allowChat: boolean
  isMember: boolean
}

export default function CommunityChatWrapper({
  communityId,
  communityName,
  allowChat,
  isMember,
}: CommunityChatWrapperProps) {
  const [isChatOpen, setIsChatOpen] = useState(true)

  // 채팅 기능이 비활성화되어 있거나 멤버가 아닌 경우
  if (!allowChat || !isMember) {
    return null
  }

  // 데스크톱에서만 사이드바 채팅 표시
  return (
    <div className="hidden lg:block fixed right-4 top-24 w-96 h-[calc(100vh-8rem)] z-30">
      <CommunityChatPanel
        communityId={communityId}
        communityName={communityName}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  )
}
