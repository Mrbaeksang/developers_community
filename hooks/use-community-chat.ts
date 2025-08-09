import { useCallback } from 'react'
import { useChatEvents } from './use-chat-events'
import { useTypingIndicator } from './use-typing-indicator'

// 커뮤니티 채팅 컴포넌트를 위한 통합 훅
export function useCommunityChat(
  channelId: string | null,
  userId: string | null
) {
  const {
    isConnected,
    onlineInfo,
    typingUsers: typingUserIds,
    setOnMessage,
    setOnMessageUpdate,
    setOnMessageDelete,
    sendTypingStatus,
  } = useChatEvents(channelId)

  const { startTyping } = useTypingIndicator(sendTypingStatus)

  // 타이핑 유저는 직접 필터링해서 반환 (현재 사용자 제외)
  const typingUsers = typingUserIds.filter((id) => id !== userId)

  // 온라인 카운트는 직접 반환
  const onlineCount = onlineInfo.count

  // 타이핑 인디케이터 전송 (디바운싱 포함)
  const sendTypingIndicator = useCallback(() => {
    startTyping()
  }, [startTyping])

  return {
    isConnected,
    typingUsers,
    onlineCount,
    setOnMessage,
    setOnMessageUpdate,
    setOnMessageDelete,
    sendTypingIndicator,
  }
}

// 파일 업로드 결과 타입 정의
export interface FileUploadResult {
  fileId: string
  url: string
  filename: string
  size: number
  type: string
}
