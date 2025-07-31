import { useEffect, useRef, useState } from 'react'

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
}

export interface TypingUser {
  userId: string
  isTyping: boolean
}

export interface OnlineInfo {
  count: number
  users: string[]
}

export interface ConnectedEvent {
  type: 'connected'
  timestamp: string
}

export interface MessageEvent {
  type: 'message'
  data: ChatMessage
  timestamp: string
}

export interface TypingEvent {
  type: 'typing'
  data: TypingUser
  timestamp: string
}

export interface OnlineCountEvent {
  type: 'online_count'
  data: OnlineInfo
  timestamp: string
}

export type ChatEventData =
  | ConnectedEvent
  | MessageEvent
  | TypingEvent
  | OnlineCountEvent

export function useChatEvents(channelId: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [onlineInfo, setOnlineInfo] = useState<OnlineInfo>({
    count: 0,
    users: [],
  })
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(
    new Map()
  )
  const eventSourceRef = useRef<EventSource | null>(null)

  // 새 메시지 콜백
  const [onMessage, setOnMessage] = useState<
    ((message: ChatMessage) => void) | null
  >(null)

  const connect = () => {
    if (!channelId || eventSourceRef.current) return

    const eventSource = new EventSource(
      `/api/chat/channels/${channelId}/events`
    )
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const eventData: ChatEventData = JSON.parse(event.data)

        switch (eventData.type) {
          case 'connected':
            // 연결 완료
            break

          case 'message':
            if (onMessage && 'data' in eventData) {
              onMessage(eventData.data)
            }
            break

          case 'typing':
            if ('data' in eventData) {
              setTypingUsers((prev) => {
                const newMap = new Map(prev)
                if (eventData.data.isTyping) {
                  newMap.set(eventData.data.userId, true)
                } else {
                  newMap.delete(eventData.data.userId)
                }
                return newMap
              })
            }
            break

          case 'online_count':
            if ('data' in eventData) {
              setOnlineInfo(eventData.data)
            }
            break
        }
      } catch (error) {
        console.error('채팅 이벤트 파싱 에러:', error)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      // 자동 재연결 시도
      setTimeout(() => {
        if (channelId) {
          disconnect()
          connect()
        }
      }, 3000)
    }
  }

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
    setTypingUsers(new Map())
    setOnlineInfo({ count: 0, users: [] })
  }

  // 타이핑 상태 전송
  const sendTypingStatus = async (isTyping: boolean) => {
    if (!channelId) return

    try {
      await fetch(`/api/chat/channels/${channelId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isTyping }),
      })
    } catch (error) {
      console.error('타이핑 상태 전송 실패:', error)
    }
  }

  useEffect(() => {
    if (channelId) {
      connect()
    }

    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    onlineInfo,
    typingUsers: Array.from(typingUsers.keys()),
    setOnMessage,
    sendTypingStatus,
    connect,
    disconnect,
  }
}
