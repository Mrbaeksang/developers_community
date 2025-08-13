'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import Link from 'next/link'
import { NotificationType } from '@prisma/client'
import { apiClient } from '@/lib/api/client'

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

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // React Query - 알림 목록 조회
  const {
    data: notificationData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', currentPage, selectedType, showUnreadOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })

      if (selectedType !== 'all') {
        params.append('type', selectedType)
      }

      if (showUnreadOnly) {
        params.append('unreadOnly', 'true')
      }

      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error('알림을 불러오는데 실패했습니다.')

      const data = await res.json()
      return {
        notifications: data.data?.notifications || data.notifications || [],
        pagination: data.data?.pagination ||
          data.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
          },
        unreadCount: data.data?.unreadCount || data.unreadCount || 0,
      }
    },
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시
  })

  // 에러 처리
  if (error) {
    toast.error('알림을 불러오는데 실패했습니다.')
    console.error(error)
  }

  const notifications = notificationData?.notifications || []
  const pagination = notificationData?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  }
  const unreadCount = notificationData?.unreadCount || 0

  // React Query - 알림 읽음 처리 mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient(
        `/api/notifications/${notificationId}/read`,
        {
          method: 'PUT',
        }
      )
      if (!response.success)
        throw new Error(response.error || '알림 읽음 처리에 실패했습니다.')
      return response.data
    },
    onMutate: async (notificationId) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previousData = queryClient.getQueryData([
        'notifications',
        currentPage,
        selectedType,
        showUnreadOnly,
      ])

      queryClient.setQueryData(
        ['notifications', currentPage, selectedType, showUnreadOnly],
        (old: typeof notificationData) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.map((n: Notification) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
            unreadCount: Math.max(0, old.unreadCount - 1),
          }
        }
      )

      return { previousData }
    },
    onError: (error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousData) {
        queryClient.setQueryData(
          ['notifications', currentPage, selectedType, showUnreadOnly],
          context.previousData
        )
      }
      toast.error('알림 읽음 처리에 실패했습니다.')
    },
  })

  const markAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId)
  }

  // React Query - 모든 알림 읽음 처리 mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient('/api/notifications/read-all', {
        method: 'PUT',
      })
      if (!response.success)
        throw new Error(response.error || '알림 읽음 처리에 실패했습니다.')
      return response.data
    },
    onMutate: async () => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previousData = queryClient.getQueryData([
        'notifications',
        currentPage,
        selectedType,
        showUnreadOnly,
      ])

      queryClient.setQueryData(
        ['notifications', currentPage, selectedType, showUnreadOnly],
        (old: typeof notificationData) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.map((n: Notification) => ({
              ...n,
              isRead: true,
            })),
            unreadCount: 0,
          }
        }
      )

      // 즉시 성공 피드백 표시
      toast.success('모든 알림을 읽음으로 표시했습니다.')

      return { previousData }
    },
    onError: (error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousData) {
        queryClient.setQueryData(
          ['notifications', currentPage, selectedType, showUnreadOnly],
          context.previousData
        )
      }
      toast.error('알림 읽음 처리에 실패했습니다.')
    },
  })

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate()
  }

  // React Query - 알림 삭제 mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      })
      if (!response.success)
        throw new Error(response.error || '알림 삭제에 실패했습니다.')
      return response.data
    },
    onMutate: async (notificationId) => {
      // 🚀 즉시 UI에서 제거 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['notifications'] })
      const previousData = queryClient.getQueryData([
        'notifications',
        currentPage,
        selectedType,
        showUnreadOnly,
      ])

      const deletedNotification = notifications.find(
        (n: Notification) => n.id === notificationId
      )
      const wasUnread = deletedNotification && !deletedNotification.isRead

      queryClient.setQueryData(
        ['notifications', currentPage, selectedType, showUnreadOnly],
        (old: typeof notificationData) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.filter(
              (n: Notification) => n.id !== notificationId
            ),
            unreadCount: wasUnread
              ? Math.max(0, old.unreadCount - 1)
              : old.unreadCount,
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
            },
          }
        }
      )

      // 즉시 성공 피드백 표시
      toast.success('알림이 삭제되었습니다.')

      return { previousData }
    },
    onError: (error, variables, context) => {
      // ❌ 삭제 실패 시 되돌리기 (Rollback)
      if (context?.previousData) {
        queryClient.setQueryData(
          ['notifications', currentPage, selectedType, showUnreadOnly],
          context.previousData
        )
      }
      toast.error('알림 삭제에 실패했습니다.')
    },
  })

  const deleteNotification = (notificationId: string) => {
    deleteNotificationMutation.mutate(notificationId)
  }

  // 알림 링크 생성
  const getNotificationLink = (notification: Notification): string | null => {
    if (!notification.resourceIds) return null

    const { postId, commentId, communityId } = notification.resourceIds

    switch (notification.type) {
      case 'POST_LIKE':
      case 'POST_COMMENT':
      case 'POST_APPROVED':
        return postId ? `/main/posts/${postId}` : null

      case 'POST_REJECTED':
        return null

      case 'COMMENT_REPLY':
      case 'COMMENT_LIKE':
        return postId ? `/main/posts/${postId}#comment-${commentId}` : null

      case 'COMMUNITY_INVITE':
      case 'COMMUNITY_JOIN':
      case 'COMMUNITY_ROLE':
        return communityId ? `/communities/${communityId}` : null

      case 'COMMUNITY_BAN':
        return null

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

  // 알림 타입 한글 변환
  const getNotificationTypeLabel = (type: NotificationType): string => {
    switch (type) {
      case 'POST_LIKE':
        return '게시글 좋아요'
      case 'POST_COMMENT':
        return '게시글 댓글'
      case 'POST_APPROVED':
        return '게시글 승인'
      case 'POST_REJECTED':
        return '게시글 거부'
      case 'COMMENT_REPLY':
        return '댓글 답글'
      case 'COMMENT_LIKE':
        return '댓글 좋아요'
      case 'COMMENT_MENTION':
        return '댓글 멘션'
      case 'COMMUNITY_INVITE':
        return '커뮤니티 초대'
      case 'COMMUNITY_JOIN':
        return '커뮤니티 가입'
      case 'COMMUNITY_ROLE':
        return '역할 변경'
      case 'COMMUNITY_BAN':
        return '커뮤니티 차단'
      default:
        return type
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  // 필터 변경 시 첫 페이지로 리셋
  const handleTypeChange = (value: string) => {
    setSelectedType(value)
    setCurrentPage(1)
  }

  const handleUnreadToggle = () => {
    setShowUnreadOnly(!showUnreadOnly)
    setCurrentPage(1)
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-4">알림</h1>

        {/* 필터 및 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex gap-2 items-center">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px] border-2 border-black">
                <SelectValue placeholder="알림 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 알림</SelectItem>
                <SelectItem value="POST_LIKE">게시글 좋아요</SelectItem>
                <SelectItem value="POST_COMMENT">게시글 댓글</SelectItem>
                <SelectItem value="COMMENT_REPLY">댓글 답글</SelectItem>
                <SelectItem value="COMMUNITY_INVITE">커뮤니티 초대</SelectItem>
                <SelectItem value="COMMUNITY_JOIN">커뮤니티 가입</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showUnreadOnly ? 'default' : 'outline'}
              onClick={handleUnreadToggle}
              className="border-2 border-black"
            >
              <Filter className="h-4 w-4 mr-2" />
              읽지 않음만
            </Button>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-primary hover:bg-primary/90 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                모두 읽음 ({unreadCount})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      {isLoading ? (
        <PageLoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="알림이 없습니다"
          description={
            showUnreadOnly
              ? '읽지 않은 알림이 없습니다.'
              : '아직 받은 알림이 없습니다.'
          }
          size="lg"
        />
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: Notification) => {
            const link = getNotificationLink(notification)
            const content = (
              <Card
                className={`p-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                  !notification.isRead ? 'bg-blue-50' : ''
                } ${link ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id)
                  }
                }}
              >
                <div className="flex gap-4">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    <Bell className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">
                          {notification.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="border border-black"
                        >
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      {!notification.isRead && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>

                    <p className="text-muted-foreground mb-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
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

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="border-2 border-black"
          >
            이전
          </Button>

          <span className="flex items-center px-4">
            {pagination.page} / {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            disabled={pagination.page === pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="border-2 border-black"
          >
            다음
          </Button>
        </div>
      )}
    </div>
  )
}
