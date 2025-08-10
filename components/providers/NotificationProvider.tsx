'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { NotificationType } from '@prisma/client'
import { apiClient } from '@/lib/api/client'
import { useQuery } from '@tanstack/react-query'

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
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(
    null
  )

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

  // 알림 목록 폴링 (5초마다)
  const { data: notificationData, refetch: refreshNotifications } = useQuery({
    queryKey: ['notifications-polling', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null

      try {
        const result = await apiClient<{
          notifications: Notification[]
          unreadCount: number
        }>('/api/notifications?limit=10')

        if (result.success) {
          const successResult = result as typeof result & {
            notifications: Notification[]
            unreadCount: number
          }
          return {
            notifications: successResult.notifications || [],
            unreadCount: successResult.unreadCount || 0,
          }
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }

      return null
    },
    refetchInterval: 5000, // 5초마다 폴링
    enabled: status === 'authenticated' && !!session?.user?.id,
  })

  // 새 알림 처리
  useEffect(() => {
    if (notificationData) {
      const newNotifications = notificationData.notifications

      // 새로운 알림 확인
      if (newNotifications.length > 0 && lastNotificationId) {
        const newestNotification = newNotifications[0]
        if (newestNotification.id !== lastNotificationId) {
          // 새 알림이 있으면 토스트 표시
          toast(newestNotification.title, {
            description: newestNotification.message,
            action: getNotificationAction(newestNotification),
          })
        }
      }

      // 상태 업데이트
      setNotifications(newNotifications)
      setUnreadCount(notificationData.unreadCount)

      // 마지막 알림 ID 저장
      if (newNotifications.length > 0) {
        setLastNotificationId(newNotifications[0].id)
      }
    }
  }, [
    notificationData,
    lastNotificationId,
    getNotificationAction,
    notifications,
  ])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected: true, // Polling은 항상 연결된 것으로 간주
        markAsRead,
        markAllAsRead,
        refreshNotifications: () => {
          refreshNotifications()
        },
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
