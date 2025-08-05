'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Users,
  Eye,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Award,
  AlertCircle,
  TrendingUp,
  Clock,
  Globe,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Activity {
  id: string
  type:
    | 'post'
    | 'comment'
    | 'like'
    | 'member_join'
    | 'view_milestone'
    | 'error'
    | 'slow_api'
  title: string
  description: string
  userName: string
  timestamp: string
  metadata?: {
    postId?: string
    postTitle?: string
    communityName?: string
    viewCount?: number
    endpoint?: string
    statusCode?: number
    responseTime?: number
  }
}

interface MonitoringError {
  id: string
  endpoint: string
  method: string
  statusCode: number
  message: string
  timestamp: string
  userId?: string
}

interface TrafficData {
  activeUsers: number
  apiCalls: {
    total: number
    topEndpoints: Array<{
      endpoint: string
      count: number
      percentage: number
    }>
  }
  pageViews: {
    today: number
    topPages: Array<{
      page: string
      count: number
      percentage: number
    }>
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
    case 'error':
      return <AlertCircle className="h-4 w-4" />
    case 'slow_api':
      return <Clock className="h-4 w-4" />
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
    error: 'bg-red-100 text-red-800',
    slow_api: 'bg-orange-100 text-orange-800',
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
  const [errors, setErrors] = useState<MonitoringError[]>([])
  const [traffic, setTraffic] = useState<TrafficData>({
    activeUsers: 0,
    apiCalls: { total: 0, topEndpoints: [] },
    pageViews: { today: 0, topPages: [] },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 병렬로 모든 데이터 가져오기
        const [activitiesRes, errorsRes, trafficRes] = await Promise.all([
          fetch('/api/activities/realtime'),
          fetch('/api/admin/monitoring/errors'),
          fetch('/api/admin/monitoring/traffic'),
        ])

        // 실시간 활동
        if (activitiesRes.ok) {
          const data = await activitiesRes.json()
          const activities =
            data.success && data.data
              ? data.data.activities || []
              : data.activities || []
          setActivities(activities)
        }

        // 에러 모니터링
        if (errorsRes.ok) {
          const data = await errorsRes.json()
          const errorData = data.success && data.data ? data.data : data
          setErrors(errorData.errors || [])
        }

        // 트래픽 모니터링
        if (trafficRes.ok) {
          const data = await trafficRes.json()
          const trafficData = data.success && data.data ? data.data : data
          setTraffic(trafficData)
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
      <div className="grid gap-4 md:grid-cols-4">
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
                <div className="text-2xl font-bold">{traffic.activeUsers}</div>
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
                  {traffic.pageViews.today.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">누적 페이지뷰</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 호출</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {traffic.apiCalls.total.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">최근 1시간</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 에러</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{errors.length}</div>
                <p className="text-xs text-muted-foreground">최근 50건</p>
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
          ) : !activities || activities.length === 0 ? (
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

      {/* 두 번째 행: 에러 모니터링과 트래픽 분석 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 에러 모니터링 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>최근 에러</CardTitle>
              {errors.length > 0 && (
                <Badge variant="destructive">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  {errors.length}개
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : errors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                에러가 없습니다 👍
              </p>
            ) : (
              <div className="space-y-2">
                {errors.slice(0, 5).map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-2 p-2 rounded bg-red-50 dark:bg-red-900/10"
                  >
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="destructive" className="text-xs">
                          {error.statusCode}
                        </Badge>
                        <span className="font-mono text-xs">
                          {error.method} {error.endpoint}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {error.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(error.timestamp), {
                          locale: ko,
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 트래픽 분석 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>인기 엔드포인트</CardTitle>
              <Badge variant="secondary">
                <TrendingUp className="mr-1 h-3 w-3" />
                Top 5
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : traffic.apiCalls.topEndpoints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                아직 데이터가 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {traffic.apiCalls.topEndpoints.map((endpoint) => (
                  <div key={endpoint.endpoint} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs truncate max-w-[200px]">
                        {endpoint.endpoint}
                      </span>
                      <span className="text-muted-foreground">
                        {endpoint.count}회
                      </span>
                    </div>
                    <Progress value={endpoint.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 세 번째 행: 인기 페이지 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>실시간 인기 페이지</CardTitle>
            <Badge variant="secondary">
              <Eye className="mr-1 h-3 w-3" />
              Top 10
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-2 md:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : traffic.pageViews.topPages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              아직 페이지뷰 데이터가 없습니다
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {traffic.pageViews.topPages.map((page, index) => (
                <div
                  key={page.page}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="text-sm truncate max-w-[200px]">
                      {page.page}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{page.count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({page.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
