'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChatEventsPolling as useChatEvents } from '@/hooks/use-chat-events-polling'
import { useSession } from 'next-auth/react'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { useQuery } from '@tanstack/react-query'

// 레이지 로딩으로 FloatingChatWindow 최적화
const FloatingChatWindow = lazy(() => import('./FloatingChatWindow'))

// 채팅 윈도우 스켈레톤 컴포넌트
function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full p-4">
      <SkeletonLoader lines={8} className="flex-1" />
    </div>
  )
}

// 글로벌 채팅 전용 플로팅 버튼
// 커뮤니티 채팅은 별도 컴포넌트로 분리됨
export default function FloatingChatButton() {
  const channelId = 'cmdrfyff8000uu8fszlkfpifs' // 실제 글로벌 채널 ID
  const channelName = '전체 채팅'
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState({ width: 400, height: 600 })
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [isResizing, setIsResizing] = useState(false)

  // 마지막으로 읽은 시간 키
  const lastReadKey = `chat_last_read_${channelId}`

  // 마지막으로 읽은 시간 가져오기
  const getLastReadTime = useCallback(() => {
    const stored = localStorage.getItem(lastReadKey)
    return stored ? new Date(stored) : new Date()
  }, [lastReadKey])

  // 마지막으로 읽은 시간 업데이트
  const updateLastReadTime = useCallback(() => {
    localStorage.setItem(lastReadKey, new Date().toISOString())
    setUnreadCount(0)
  }, [lastReadKey])

  // 새 메시지 수신 시 카운트 증가
  const handleNewMessage = useCallback(
    (message: { createdAt: string; author?: { id: string } }) => {
      if (!isOpen) {
        const lastRead = getLastReadTime()
        const messageTime = new Date(message.createdAt)

        // 본인이 작성한 메시지는 카운트하지 않음
        const isOwnMessage = message.author?.id === session?.user?.id

        if (messageTime > lastRead && !isOwnMessage) {
          setUnreadCount((prev) => Math.min(prev + 1, 99))
        }
      }
    },
    [isOpen, getLastReadTime, session?.user?.id]
  )

  // 창이 열릴 때 읽음 처리
  useEffect(() => {
    if (isOpen) {
      updateLastReadTime()
    }
  }, [isOpen, updateLastReadTime])

  // Polling으로 전역 메시지 수신 (창이 닫혀있을 때만)
  const { setOnMessage } = useChatEvents(isOpen ? null : channelId)

  // 안 읽은 메시지 수 조회
  const { data: unreadData } = useQuery({
    queryKey: ['chat-unread', channelId, session?.user?.id],
    queryFn: async () => {
      const lastRead = getLastReadTime()
      // 유효한 날짜인지 확인
      if (!lastRead || isNaN(lastRead.getTime())) {
        // 유효하지 않은 날짜면 after 파라미터 없이 요청
        const res = await fetch(
          `/api/chat/channels/${channelId}/messages?limit=50`,
          {
            credentials: 'include',
          }
        )
        if (!res.ok) throw new Error('Failed to fetch unread messages')
        await res.json() // 응답 소비 (에러 방지)
        return 0 // 마지막 읽은 시간이 없으면 안 읽은 메시지 0개로 처리
      }

      const res = await fetch(
        `/api/chat/channels/${channelId}/messages?after=${lastRead.toISOString()}`,
        {
          credentials: 'include',
        }
      )
      if (!res.ok) throw new Error('Failed to fetch unread messages')
      const data = await res.json()
      const messages = data.data?.messages || data.messages || []

      // 본인이 작성한 메시지는 제외하고 카운트
      const unreadMessages = messages.filter(
        (msg: { author?: { id: string } }) =>
          msg.author?.id !== session?.user?.id
      )
      return Math.min(unreadMessages.length, 99)
    },
    enabled: !isOpen && !!session,
    staleTime: 30 * 1000, // 30초
  })

  // React Query 결과를 로컬 state에 동기화
  useEffect(() => {
    if (unreadData !== undefined) {
      setUnreadCount(unreadData)
    }
  }, [unreadData])

  // 실시간 메시지 수신 처리 (창이 닫혀있을 때)
  useEffect(() => {
    if (!isOpen) {
      setOnMessage(
        (message: { createdAt: string; author?: { id: string } } | null) => {
          if (message?.createdAt) {
            handleNewMessage(message)
          }
        }
      )
    }
  }, [setOnMessage, handleNewMessage, isOpen])

  // 창 크기 조절
  const handleResize = (direction: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height
    const startPosX = position.x
    const startPosY = position.y

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight
      let newPosX = startPosX
      let newPosY = startPosY

      // right/bottom 기준이므로 방향 반대로 처리
      if (direction.includes('right')) {
        newWidth = Math.max(300, Math.min(800, startWidth - deltaX))
        newPosX = Math.max(
          20,
          Math.min(window.innerWidth - 320, startPosX + deltaX)
        )
      } else if (direction.includes('left')) {
        newWidth = Math.max(300, Math.min(800, startWidth + deltaX))
      }

      if (direction.includes('bottom')) {
        newHeight = Math.max(400, Math.min(800, startHeight - deltaY))
        newPosY = Math.max(
          20,
          Math.min(window.innerHeight - 420, startPosY + deltaY)
        )
      } else if (direction.includes('top')) {
        newHeight = Math.max(400, Math.min(800, startHeight + deltaY))
      }

      setSize({ width: newWidth, height: newHeight })
      setPosition({ x: newPosX, y: newPosY })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 창 이동
  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isResizing) return

    const startX = e.clientX + position.x
    const startY = e.clientY + position.y

    const handleMouseMove = (e: MouseEvent) => {
      // right/bottom 기준이므로 반대로 계산
      const newX = Math.max(
        20,
        Math.min(window.innerWidth - size.width - 20, startX - e.clientX)
      )
      const newY = Math.max(
        20,
        Math.min(window.innerHeight - size.height - 20, startY - e.clientY)
      )

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all z-50"
        title="전체 채팅 열기 (Ctrl + /)"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border border-black">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>
    )
  }

  return (
    <div
      className="fixed z-50"
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <Card className="h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col relative">
        <CardHeader
          className="p-4 cursor-move border-b-2 border-black"
          onMouseDown={handleDrag}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              <span className="mr-2">{channelName}</span>
              <span className="text-xs font-normal text-muted-foreground">
                (전체)
              </span>
            </CardTitle>
            <Button
              onClick={() => setIsOpen(false)}
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              title="닫기 (Ctrl + /)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <Suspense fallback={<ChatSkeleton />}>
            <FloatingChatWindow
              channelId={channelId}
              onNewMessage={handleNewMessage}
            />
          </Suspense>
        </CardContent>

        {/* 크기 조절 핸들 - 4모서리 */}
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-black/10"
          onMouseDown={handleResize('top-left')}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-black/10"
          onMouseDown={handleResize('top-right')}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-black/10"
          onMouseDown={handleResize('bottom-left')}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-black/10"
          onMouseDown={handleResize('bottom-right')}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-black" />
        </div>

        {/* 크기 조절 핸들 - 4변 */}
        <div
          className="absolute top-0 left-4 right-4 h-2 cursor-n-resize hover:bg-black/10"
          onMouseDown={handleResize('top')}
        />
        <div
          className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize hover:bg-black/10"
          onMouseDown={handleResize('bottom')}
        />
        <div
          className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize hover:bg-black/10"
          onMouseDown={handleResize('left')}
        />
        <div
          className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize hover:bg-black/10"
          onMouseDown={handleResize('right')}
        />
      </Card>
    </div>
  )
}
