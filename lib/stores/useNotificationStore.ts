import { create } from 'zustand'

interface Notification {
  id: string
  type:
    | 'SYSTEM'
    | 'MEMBER_REQUEST'
    | 'MEMBER_APPROVED'
    | 'MEMBER_REJECTED'
    | 'POST_APPROVED'
    | 'POST_REJECTED'
    | 'POST_COMMENT'
    | 'POST_LIKE'
    | 'ANNOUNCEMENT'
  message: string
  isRead: boolean
  createdAt: string
  communityId?: string
  postId?: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  setNotifications: (notifications: Notification[]) => void
  setLoading: (loading: boolean) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.isRead
        ? state.unreadCount
        : state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const updatedNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      )
      const notification = state.notifications.find((n) => n.id === id)
      const wasUnread = notification && !notification.isRead

      return {
        notifications: updatedNotifications,
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  removeNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      const wasUnread = notification && !notification.isRead

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      }
    }),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}))
