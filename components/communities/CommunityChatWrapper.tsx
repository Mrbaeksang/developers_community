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

  // 반응형 채팅 표시
  return (
    <>
      {/* 모바일/태블릿: 하단 고정 버튼 */}
      <div className="lg:hidden">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-4 right-4 z-40 bg-black text-white p-3 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        )}
        {isChatOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <CommunityChatPanel
              communityId={communityId}
              communityName={communityName}
              isOpen={isChatOpen}
              onToggle={() => setIsChatOpen(false)}
              className="h-full border-0 shadow-none"
            />
          </div>
        )}
      </div>

      {/* 데스크톱: 사이드바 */}
      <div className="hidden lg:block fixed right-4 top-24 w-80 xl:w-96 h-[calc(100vh-8rem)] z-30">
        <CommunityChatPanel
          communityId={communityId}
          communityName={communityName}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
        />
      </div>
    </>
  )
}
