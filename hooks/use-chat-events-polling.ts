import { useEffect, useRef, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

export interface ChatMessage {
  id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'EXPIRED'
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string | null
    name: string | null
    image: string | undefined
  }
  file?: {
    id: string
    filename: string
    size: number
    type: string
    url: string
    mimeType: string
    width?: number | null
    height?: number | null
    expiresAt?: string
    isTemporary?: boolean
  }
  replyTo?: {
    id: string
    content: string
    author?: {
      id: string
      name: string | null
      username: string | null
      image: string | undefined
    }
  }
}

export interface TypingUser {
  userId: string
  isTyping: boolean
}

export interface OnlineInfo {
  count: number
  users: string[]
}

// Polling 방식으로 실시간 채팅 구현
export function useChatEventsPolling(channelId: string | null) {
  const [isConnected] = useState(true) // Polling은 항상 연결된 것으로 간주
  const [onlineInfo, setOnlineInfo] = useState<OnlineInfo>({
    count: 0,
    users: [],
  })
  const [typingUsers] = useState<TypingUser[]>([]) // 타이핑 기능은 추후 구현
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  const onMessageRef = useRef<((message: ChatMessage | null) => void) | null>(
    null
  )
  const onMessageUpdateRef = useRef<
    ((message: ChatMessage | null) => void) | null
  >(null)
  const onMessageDeleteRef = useRef<
    ((messageId: string | null) => void) | null
  >(null)

  // 새 메시지 폴링 (3초마다)
  const { data: newMessages } = useQuery({
    queryKey: ['chat-polling', channelId, lastMessageId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (lastMessageId) params.append('after', lastMessageId)
      params.append('limit', '10')

      const res = await fetch(
        `/api/chat/channels/${channelId}/messages?${params}`,
        { credentials: 'include' }
      )

      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()

      return data.success && data.data ? data.data.messages : []
    },
    refetchInterval: false, // 폴링 완전 비활성화 (CPU 절약)
    enabled: false, // 채팅 폴링 임시 비활성화
  })

  // 온라인 사용자 폴링 (10초마다)
  const { data: onlineData } = useQuery({
    queryKey: ['chat-online', channelId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/channels/${channelId}/members`, {
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to fetch online users')
      const data = await res.json()

      return data.success && data.data
        ? {
            count: data.data.members.length,
            users: data.data.members.map((m: { userId: string }) => m.userId),
          }
        : { count: 0, users: [] }
    },
    refetchInterval: false, // 폴링 완전 비활성화 (CPU 절약)
    enabled: false, // 온라인 사용자 폴링 임시 비활성화
  })

  // 새 메시지 처리
  useEffect(() => {
    if (newMessages && newMessages.length > 0) {
      newMessages.forEach((message: ChatMessage) => {
        if (onMessageRef.current) {
          onMessageRef.current(message)
        }
        setLastMessageId(message.id)
      })
    }
  }, [newMessages])

  // 온라인 정보 업데이트
  useEffect(() => {
    if (onlineData) {
      setOnlineInfo(onlineData)
    }
  }, [onlineData])

  // 타이핑 상태 전송 (실제 구현 필요)
  const sendTypingStatus = useCallback(
    (isTyping: boolean) => {
      // Polling 방식에서는 타이핑 상태를 별도 API로 전송
      fetch(`/api/chat/channels/${channelId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isTyping }),
      }).catch(console.error)
    },
    [channelId]
  )

  // 메시지 콜백 설정
  const setOnMessage = useCallback(
    (callback: (message: ChatMessage | null) => void) => {
      onMessageRef.current = callback
    },
    []
  )

  const setOnMessageUpdate = useCallback(
    (callback: (message: ChatMessage | null) => void) => {
      onMessageUpdateRef.current = callback
    },
    []
  )

  const setOnMessageDelete = useCallback(
    (callback: (messageId: string | null) => void) => {
      onMessageDeleteRef.current = callback
    },
    []
  )

  return {
    isConnected,
    onlineInfo,
    typingUsers,
    sendTypingStatus,
    setOnMessage,
    setOnMessageUpdate,
    setOnMessageDelete,
  }
}
