# 🔄 실시간 기능 구현

## 📋 목차
- [실시간 아키텍처](#실시간-아키텍처)
- [Polling 시스템](#polling-시스템)
- [채팅 구현](#채팅-구현)
- [알림 시스템](#알림-시스템)
- [최적화 전략](#최적화-전략)

---

## 실시간 아키텍처

### 🎯 Vercel 최적화 Polling

**왜 Polling인가?**
- Vercel 서버리스 환경에 최적화
- WebSocket 대비 안정적
- 비용 효율적
- 확장 가능

```
Client (TanStack Query)
    ↓ (2초 간격)
Vercel Edge Function
    ↓
Redis Cache
    ↓
PostgreSQL
```

---

## Polling 시스템

### ⚡ TanStack Query 설정

```typescript
// lib/hooks/usePolling.ts
export function usePolling<T>(
  key: string[],
  fetcher: () => Promise<T>,
  options?: {
    interval?: number
    enabled?: boolean
  }
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    refetchInterval: options?.interval || 2000,
    refetchIntervalInBackground: false,
    enabled: options?.enabled ?? true
  })
}
```

### 🎯 동적 Polling 주기

```typescript
// 사용자 활동에 따른 동적 조절
export function useDynamicPolling(channelId: string) {
  const [interval, setInterval] = useState(3000)
  
  const { data } = useQuery({
    queryKey: ['chat', channelId],
    queryFn: () => fetchMessages(channelId),
    refetchInterval: interval,
    onSuccess: (data) => {
      // 활성 사용자가 많으면 빠르게
      if (data.activeUsers > 10) {
        setInterval(1000)  // 1초
      } else if (data.activeUsers > 5) {
        setInterval(2000)  // 2초
      } else {
        setInterval(5000)  // 5초
      }
    }
  })
  
  return data
}
```

---

## 채팅 구현

### 💬 채팅 컴포넌트

```typescript
// components/chat/ChatRoom.tsx
export function ChatRoom({ channelId }: { channelId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const lastMessageId = useRef<string>()
  
  // Polling으로 새 메시지 가져오기
  const { data: newMessages } = useQuery({
    queryKey: ['chat-messages', channelId, lastMessageId.current],
    queryFn: async () => {
      const res = await fetch(
        `/api/chat/${channelId}/messages?after=${lastMessageId.current || ''}`
      )
      return res.json()
    },
    refetchInterval: 2000,
    onSuccess: (data) => {
      if (data.messages?.length > 0) {
        setMessages(prev => [...prev, ...data.messages])
        lastMessageId.current = data.messages[data.messages.length - 1].id
      }
    }
  })
  
  // 메시지 전송
  const sendMessage = async (content: string) => {
    await fetch(`/api/chat/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
  }
  
  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  )
}
```

### 📡 채팅 API

```typescript
// app/api/chat/[channelId]/messages/route.ts
export async function GET(
  req: Request,
  { params }: { params: { channelId: string } }
) {
  const { searchParams } = new URL(req.url)
  const after = searchParams.get('after')
  
  // Redis 캐시 확인
  const cacheKey = `chat:${params.channelId}:${after || 'all'}`
  const cached = await redis.get(cacheKey)
  if (cached) {
    return NextResponse.json(JSON.parse(cached))
  }
  
  // DB 조회
  const messages = await prisma.chatMessage.findMany({
    where: {
      channelId: params.channelId,
      ...(after && { id: { gt: after } })
    },
    include: {
      author: {
        select: { id: true, name: true, image: true }
      }
    },
    orderBy: { createdAt: 'asc' },
    take: 50
  })
  
  // 활성 사용자 수
  const activeUsers = await redis.scard(`channel:${params.channelId}:users`)
  
  const response = { messages, activeUsers }
  
  // 캐시 저장 (5초)
  await redis.set(cacheKey, JSON.stringify(response), 'EX', 5)
  
  return NextResponse.json(response)
}
```

---

## 알림 시스템

### 🔔 실시간 알림

```typescript
// hooks/useNotifications.ts
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const session = useSession()
  
  // Polling으로 새 알림 확인
  useQuery({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread')
      return res.json()
    },
    refetchInterval: 10000, // 10초마다
    enabled: !!session?.user,
    onSuccess: (data) => {
      if (data.notifications?.length > 0) {
        setNotifications(data.notifications)
        // 브라우저 알림
        if (Notification.permission === 'granted') {
          data.notifications.forEach(notif => {
            new Notification(notif.title, {
              body: notif.content,
              icon: '/logo.png'
            })
          })
        }
      }
    }
  })
  
  return { notifications, count: notifications.length }
}
```

### 📨 알림 생성

```typescript
// lib/notifications/create.ts
export async function createNotification({
  userId,
  type,
  title,
  content,
  link
}: NotificationData) {
  // DB 저장
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      content,
      link,
      read: false
    }
  })
  
  // Redis에 미읽은 알림 카운트 증가
  await redis.incr(`notifications:unread:${userId}`)
  
  // 실시간 푸시를 위한 플래그
  await redis.set(`notifications:new:${userId}`, '1', 'EX', 30)
  
  return notification
}
```

---

## 최적화 전략

### 🚀 캐싱 전략

```typescript
// Redis 멀티 레벨 캐싱
class ChatCache {
  // 레벨 1: 최근 메시지 (1분)
  async getCachedMessages(channelId: string) {
    const key = `chat:recent:${channelId}`
    return await redis.get(key)
  }
  
  // 레벨 2: 채널 메타데이터 (5분)
  async getChannelMeta(channelId: string) {
    const key = `chat:meta:${channelId}`
    return await redis.get(key)
  }
  
  // 레벨 3: 사용자 온라인 상태 (30초)
  async getOnlineUsers(channelId: string) {
    const key = `chat:online:${channelId}`
    return await redis.smembers(key)
  }
}
```

### 📊 부하 분산

```typescript
// 트래픽에 따른 Polling 조절
export function getOptimalInterval(metrics: {
  activeUsers: number
  messageRate: number
  serverLoad: number
}) {
  // 기본값
  let interval = 3000
  
  // 활성 사용자 기반
  if (metrics.activeUsers > 50) {
    interval = 5000  // 많은 사용자 = 느린 폴링
  } else if (metrics.activeUsers > 20) {
    interval = 3000
  } else {
    interval = 2000  // 적은 사용자 = 빠른 폴링
  }
  
  // 서버 부하 고려
  if (metrics.serverLoad > 0.8) {
    interval = Math.min(interval * 1.5, 10000)
  }
  
  return interval
}
```

### 🔄 재연결 로직

```typescript
// 연결 복구 및 재시도
export function useResilientPolling(key: string[], fetcher: () => Promise<any>) {
  const [retryCount, setRetryCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  
  // 네트워크 상태 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return useQuery({
    queryKey: [...key, retryCount],
    queryFn: fetcher,
    refetchInterval: isOnline ? 2000 : false,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: () => {
      setRetryCount(prev => prev + 1)
    }
  })
}
```

---

## 📈 성능 모니터링

### 메트릭 수집

```typescript
// lib/realtime/metrics.ts
export class RealtimeMetrics {
  async track(event: {
    type: 'message' | 'notification' | 'presence'
    latency: number
    userId: string
  }) {
    // Redis에 메트릭 저장
    await redis.zadd(
      `metrics:${event.type}:latency`,
      Date.now(),
      `${event.userId}:${event.latency}`
    )
    
    // 평균 계산
    const recentLatencies = await redis.zrange(
      `metrics:${event.type}:latency`,
      Date.now() - 60000,
      Date.now(),
      'BYSCORE'
    )
    
    const avg = recentLatencies.reduce((sum, item) => {
      const latency = parseInt(item.split(':')[1])
      return sum + latency
    }, 0) / recentLatencies.length
    
    console.log(`[${event.type}] Average latency: ${avg}ms`)
  }
}
```

---

## 🔮 향후 마이그레이션

### WebSocket 준비

```typescript
// 향후 WebSocket 마이그레이션을 위한 인터페이스
interface RealtimeProvider {
  subscribe(channel: string, callback: (data: any) => void): void
  unsubscribe(channel: string): void
  send(channel: string, data: any): void
}

// Polling 구현 (현재)
class PollingProvider implements RealtimeProvider {
  // Polling 로직
}

// WebSocket 구현 (향후)
class WebSocketProvider implements RealtimeProvider {
  // WebSocket 로직
}

// 팩토리 패턴으로 쉽게 전환
export function createRealtimeProvider(): RealtimeProvider {
  if (process.env.NEXT_PUBLIC_REALTIME === 'websocket') {
    return new WebSocketProvider()
  }
  return new PollingProvider()
}
```