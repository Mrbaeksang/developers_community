// SSE 연결 관리 및 메시지 브로드캐스트
// 프로덕션 환경에서는 서버가 재시작되지 않으므로 메모리에 저장해도 문제없음
// 추후 Redis pub/sub으로 교체 예정

interface Connection {
  controller: ReadableStreamDefaultController
  userId: string
  channelId: string
}

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

// 연결 저장소
const connections = new Map<string, Connection>()

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
  // console.log(`[SSE] Connection saved: ${connectionId}, total: ${connections.size}`)
}

// 연결 제거
export function removeConnection(connectionId: string) {
  connections.delete(connectionId)
  // console.log(`[SSE] Connection removed: ${connectionId}, remaining: ${connections.size}`)
}

// 메시지를 모든 채널 구독자에게 브로드캐스트
export function broadcastMessage(channelId: string, message: ChatMessage) {
  const messageData = JSON.stringify({
    type: 'message',
    data: message,
    timestamp: new Date().toISOString(),
  })

  connections.forEach((connection, connectionId) => {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${messageData}\n\n`)
      } catch {
        // 연결이 끊어진 경우 제거
        removeConnection(connectionId)
      }
    }
  })

  // console.log(`[SSE] Message broadcast to ${sentCount} connections in channel ${channelId}`)
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

  connections.forEach((connection, connectionId) => {
    if (connection.channelId === channelId && connection.userId !== userId) {
      try {
        connection.controller.enqueue(`data: ${typingData}\n\n`)
      } catch {
        removeConnection(connectionId)
      }
    }
  })
}

// 온라인 사용자 수 브로드캐스트
export function broadcastOnlineCount(channelId: string) {
  const channelUsers = new Set<string>()

  connections.forEach((connection) => {
    if (connection.channelId === channelId) {
      channelUsers.add(connection.userId)
    }
  })

  const onlineData = JSON.stringify({
    type: 'online_count',
    data: {
      count: channelUsers.size,
      users: Array.from(channelUsers),
    },
    timestamp: new Date().toISOString(),
  })

  connections.forEach((connection, connectionId) => {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${onlineData}\n\n`)
      } catch {
        removeConnection(connectionId)
      }
    }
  })
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

  connections.forEach((connection, connectionId) => {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${updateData}\n\n`)
      } catch {
        removeConnection(connectionId)
      }
    }
  })
}

// 메시지 삭제를 브로드캐스트
export function broadcastMessageDelete(channelId: string, messageId: string) {
  const deleteData = JSON.stringify({
    type: 'message_delete',
    data: { messageId },
    timestamp: new Date().toISOString(),
  })

  connections.forEach((connection, connectionId) => {
    if (connection.channelId === channelId) {
      try {
        connection.controller.enqueue(`data: ${deleteData}\n\n`)
      } catch {
        removeConnection(connectionId)
      }
    }
  })
}
