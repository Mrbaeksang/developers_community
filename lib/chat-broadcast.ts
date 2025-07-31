// SSE 연결을 저장하기 위한 Map
const connections = new Map<
  string,
  {
    controller: ReadableStreamDefaultController
    userId: string
    channelId: string
  }
>()

// 메시지 타입 정의
interface ChatMessage {
  id: string
  content: string
  type: string
  createdAt: Date
  updatedAt: Date
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
    width: number | null
    height: number | null
    expiresAt: Date | null
    isTemporary: boolean
  }
}

// 연결 저장
export function saveConnection(
  connectionId: string,
  controller: ReadableStreamDefaultController,
  userId: string,
  channelId: string
) {
  connections.set(connectionId, {
    controller,
    userId,
    channelId,
  })
}

// 연결 제거
export function removeConnection(connectionId: string) {
  connections.delete(connectionId)
}

// 메시지를 모든 채널 구독자에게 브로드캐스트
export function broadcastMessage(channelId: string, message: ChatMessage) {
  const messageData = JSON.stringify({
    type: 'message',
    data: message,
    timestamp: new Date().toISOString(),
  })

  // 해당 채널을 구독하는 모든 연결에 메시지 전송
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${messageData}\n\n`)
      } catch {
        // 연결이 끊어진 경우 제거
        connections.delete(connectionId)
      }
    }
  }
}

// 타이핑 상태를 브로드캐스트
export function broadcastTyping(
  channelId: string,
  userId: string,
  isTyping: boolean
) {
  const typingData = JSON.stringify({
    type: 'typing',
    data: {
      userId,
      isTyping,
    },
    timestamp: new Date().toISOString(),
  })

  // 해당 채널을 구독하는 모든 연결에 타이핑 상태 전송 (자신 제외)
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId && connection.userId !== userId) {
      try {
        connection.controller.enqueue(`data: ${typingData}\n\n`)
      } catch {
        connections.delete(connectionId)
      }
    }
  }
}

// 온라인 사용자 수 브로드캐스트
export function broadcastOnlineCount(channelId: string) {
  const onlineUsers = Array.from(connections.values())
    .filter((conn) => conn.channelId === channelId)
    .map((conn) => conn.userId)

  const uniqueUsers = [...new Set(onlineUsers)]

  const onlineData = JSON.stringify({
    type: 'online_count',
    data: {
      count: uniqueUsers.length,
      users: uniqueUsers,
    },
    timestamp: new Date().toISOString(),
  })

  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${onlineData}\n\n`)
      } catch {
        connections.delete(connectionId)
      }
    }
  }
}

// 메시지 업데이트를 브로드캐스트
export function broadcastMessageUpdate(
  channelId: string,
  message: ChatMessage
) {
  const updateData = JSON.stringify({
    type: 'message_update',
    data: message,
    timestamp: new Date().toISOString(),
  })

  // 해당 채널을 구독하는 모든 연결에 메시지 업데이트 전송
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${updateData}\n\n`)
      } catch {
        connections.delete(connectionId)
      }
    }
  }
}

// 메시지 삭제를 브로드캐스트
export function broadcastMessageDelete(channelId: string, messageId: string) {
  const deleteData = JSON.stringify({
    type: 'message_delete',
    data: { messageId },
    timestamp: new Date().toISOString(),
  })

  // 해당 채널을 구독하는 모든 연결에 메시지 삭제 전송
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${deleteData}\n\n`)
      } catch {
        connections.delete(connectionId)
      }
    }
  }
}
