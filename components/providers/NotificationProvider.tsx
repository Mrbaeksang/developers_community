'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { NotificationType } from '@prisma/client'
import { apiClient } from '@/lib/api'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string | null
  isRead: boolean
  createdAt: string
  senderId: string | null
  resourceIds: {
    postId?: string
    commentId?: string
    communityId?: string
  } | null
  sender?: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  } | null
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // 알림 읽음 처리
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await apiClient(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
        }
      )

      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await apiClient('/api/notifications/read-all', {
        method: 'PUT',
      })

      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  // 알림 목록 새로고침
  const refreshNotifications = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const result = await res.json()
        // successResponse 형식으로 오는 경우 data 필드에서 실제 데이터 추출
        if (result.data) {
          setNotifications(result.data.notifications || [])
          setUnreadCount(result.data.unreadCount || 0)
        }
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error)
    }
  }, [session])

  // 알림 타입별 액션 버튼 생성
  const getNotificationAction = useCallback(
    (notification: Notification) => {
      if (!notification.resourceIds) return undefined

      const { postId, communityId } = notification.resourceIds

      switch (notification.type) {
        case 'POST_LIKE':
        case 'POST_COMMENT':
        case 'POST_MENTION':
        case 'POST_APPROVED':
          if (postId) {
            return {
              label: '게시글 보기',
              onClick: () => {
                router.push(`/main/posts/${postId}`)
              },
            }
          }
          break

        case 'COMMENT_REPLY':
        case 'COMMENT_LIKE':
        case 'COMMENT_MENTION':
          if (postId) {
            return {
              label: '댓글 보기',
              onClick: () => {
                router.push(`/main/posts/${postId}#comments`)
              },
            }
          }
          break

        case 'COMMUNITY_INVITE':
        case 'COMMUNITY_JOIN':
        case 'COMMUNITY_ROLE':
          if (communityId) {
            return {
              label: '커뮤니티 보기',
              onClick: () => {
                router.push(`/communities/${communityId}`)
              },
            }
          }
          break
      }

      return undefined
    },
    [router]
  )

  // SSE 연결 설정
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return
    }

    // 기존 연결이 있다면 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // 새 SSE 연결
    const source = new EventSource('/api/notifications/sse')
    eventSourceRef.current = source

    source.onopen = () => {
      setIsConnected(true)
      setReconnectAttempts(0) // 연결 성공 시 재시도 횟수 초기화
    }

    source.onerror = () => {
      setIsConnected(false)

      // 최대 5번까지만 재연결 시도
      if (reconnectAttempts < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // 지수 백오프: 1s, 2s, 4s, 8s, 16s, 30s
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1)
        }, delay)
      }
    }

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'connected':
            break

          case 'unreadCount':
            setUnreadCount(data.count)
            break

          case 'initial':
            setNotifications(data.notifications)
            break

          case 'notification':
            // 새 알림 추가
            const newNotification = data.data
            setNotifications((prev) => [newNotification, ...prev.slice(0, 9)])
            setUnreadCount((prev) => prev + 1)

            // 토스트 알림 표시
            toast(newNotification.title, {
              description: newNotification.message,
              action: getNotificationAction(newNotification),
            })
            break
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }

    // 클린업
    return () => {
      source.close()
      eventSourceRef.current = null
      setIsConnected(false)
    }
  }, [session?.user?.id, status, reconnectAttempts, getNotificationAction])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
