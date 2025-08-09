'use client'

import dynamic from 'next/dynamic'

const FloatingChatButton = dynamic(
  () => import('@/components/chat/FloatingChatButton'),
  { ssr: false }
)

// 글로벌 채팅 전용 섹션 - 플로팅 버튼만 표시
export default function GlobalChatSection() {
  // FloatingChatButton이 이제 props를 받지 않으므로 단순히 렌더링만 함
  return <FloatingChatButton />
}
