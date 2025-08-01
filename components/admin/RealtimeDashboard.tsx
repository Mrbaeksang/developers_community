'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  Users,
  Eye,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Award,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RealtimeStats {
  activeVisitors: number
  todayViews: number
}

interface Activity {
  id: string
  type: 'post' | 'comment' | 'like' | 'member_join' | 'view_milestone'
  title: string
  description: string
  userName: string
  timestamp: string
  metadata?: {
    postId?: string
    postTitle?: string
    communityName?: string
    viewCount?: number
  }
}

function ActivityIcon({ type }: { type: Activity['type'] }) {
  switch (type) {
    case 'post':
      return <MessageSquare className="h-4 w-4" />
    case 'comment':
      return <MessageSquare className="h-4 w-4" />
    case 'like':
      return <ThumbsUp className="h-4 w-4" />
    case 'member_join':
      return <UserPlus className="h-4 w-4" />
    case 'view_milestone':
      return <Award className="h-4 w-4" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function ActivityItem({ activity }: { activity: Activity }) {
  const typeColors = {
    post: 'bg-blue-100 text-blue-800',
    comment: 'bg-green-100 text-green-800',
    like: 'bg-pink-100 text-pink-800',
    member_join: 'bg-purple-100 text-purple-800',
    view_milestone: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      <div className={`p-2 rounded-full ${typeColors[activity.type]}`}>
        <ActivityIcon type={activity.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{activity.userName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(activity.timestamp), {
              locale: ko,
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
      </div>
    </div>
  )
}

export function RealtimeDashboard() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<RealtimeStats>({
    activeVisitors: 0,
    todayViews: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 실시간 활동 가져오기
        const activitiesRes = await fetch('/api/activities/realtime')
        if (activitiesRes.ok) {
          const data = await activitiesRes.json()
          setActivities(data.activities || [])
        }

        // 관리자 통계 가져오기 (실시간 데이터 포함)
        const statsRes = await fetch('/api/admin/stats')
        if (statsRes.ok) {
          const data = await statsRes.json()
          if (data.realtime) {
            setStats(data.realtime)
          }
        }
      } catch (error) {
        console.error('Failed to fetch realtime data:', error)
      } finally {
        setLoading(false)
      }
    }

    // 초기 로드
    fetchData()

    // 5초마다 업데이트
    const interval = setInterval(fetchData, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* 실시간 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">실시간 방문자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeVisitors}</div>
                <p className="text-xs text-muted-foreground">
                  현재 활성 사용자
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 조회수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats.todayViews.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">누적 페이지뷰</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 실시간 활동 피드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>실시간 활동</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              <Activity className="mr-1 h-3 w-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              최근 5분간 활동이 없습니다
            </p>
          ) : (
            <div className="space-y-1">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
