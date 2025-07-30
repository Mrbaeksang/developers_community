'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'
import { NotificationType } from '@prisma/client'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  } | null
  resourceIds: {
    postId?: string
    commentId?: string
    communityId?: string
  } | null
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // 알림 목록 가져오기
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/notifications?limit=10')
      if (!res.ok) throw new Error('알림을 불러오는데 실패했습니다.')
      
      const data = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      toast.error('알림을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('알림 읽음 처리에 실패했습니다.')
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      toast.error('알림 읽음 처리에 실패했습니다.')
    }
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT',
      })
      if (!res.ok) throw new Error('알림 읽음 처리에 실패했습니다.')
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      )
      setUnreadCount(0)
      toast.success('모든 알림을 읽음으로 표시했습니다.')
    } catch {
      toast.error('알림 읽음 처리에 실패했습니다.')
    }
  }

  // 알림 링크 생성
  const getNotificationLink = (notification: Notification): string | null => {
    if (!notification.resourceIds) return null

    const { postId, commentId, communityId } = notification.resourceIds

    switch (notification.type) {
      case 'POST_LIKE':
      case 'POST_COMMENT':
      case 'POST_MENTION':
      case 'POST_APPROVED':
      case 'POST_REJECTED':
        return postId ? `/main/posts/${postId}` : null
      
      case 'COMMENT_REPLY':
      case 'COMMENT_LIKE':
      case 'COMMENT_MENTION':
        return postId ? `/main/posts/${postId}#comment-${commentId}` : null
      
      case 'COMMUNITY_INVITE':
      case 'COMMUNITY_JOIN':
      case 'COMMUNITY_ROLE':
      case 'COMMUNITY_BAN':
        return communityId ? `/communities/${communityId}` : null
      
      default:
        return null
    }
  }

  // 알림 아이콘 배경색
  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'POST_LIKE':
      case 'COMMENT_LIKE':
        return 'bg-red-100'
      case 'POST_COMMENT':
      case 'COMMENT_REPLY':
        return 'bg-blue-100'
      case 'POST_APPROVED':
      case 'COMMUNITY_JOIN':
        return 'bg-green-100'
      case 'POST_REJECTED':
      case 'COMMUNITY_BAN':
        return 'bg-red-100'
      case 'COMMUNITY_ROLE':
        return 'bg-purple-100'
      default:
        return 'bg-gray-100'
    }
  }

  // 드롭다운이 열릴 때 알림 목록 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // 초기 읽지 않은 알림 개수 가져오기
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-[380px] max-w-[90vw] border-2 border-black"
      >
        <div className="flex items-center justify-between p-4">
          <h3 className="font-bold text-lg">알림</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              모두 읽음
            </Button>
          )}
        </div>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              알림이 없습니다.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification)
                const content = (
                  <div
                    className={`p-4 transition-colors hover:bg-muted/50 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        <Bell className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                      
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                )

                return link ? (
                  <Link key={notification.id} href={link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard/notifications"
            className="p-3 text-center font-bold cursor-pointer"
          >
            모든 알림 보기
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}