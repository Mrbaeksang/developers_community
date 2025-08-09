'use client'

import dynamic from 'next/dynamic'

const FloatingChatButton = dynamic(
  () => import('@/components/chat/FloatingChatButton'),
  { ssr: false }
)

// 글로벌 채팅용 ChatProvider
// FloatingChatButton이 이제 내부적으로 'global' 채널을 사용
export function ChatProvider() {
  return <FloatingChatButton />
}
