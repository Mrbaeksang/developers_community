// 활동 타입 정의
export type ActivityType =
  | 'post'
  | 'comment'
  | 'like'
  | 'member_join'
  | 'view_milestone'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  userName: string
  timestamp: string // API response에서는 ISO string으로 전달됨
  metadata?: {
    postId?: string
    postTitle?: string
    communityName?: string
    viewCount?: number
  }
}

export interface ActivityResponse {
  activities: Activity[]
  count: number
  timestamp: string
}
