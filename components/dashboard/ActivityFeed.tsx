'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FileText,
  MessageSquare,
  Heart,
  Bookmark,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface ActivityItem {
  id: string
  type:
    | 'post_created'
    | 'comment_added'
    | 'post_liked'
    | 'post_bookmarked'
    | 'community_joined'
  title: string
  description?: string
  timestamp: string
  user?: {
    id: string
    name: string | null
    image: string | null
  }
  target?: {
    id: string
    title: string
    slug?: string
    type: 'main_post' | 'community_post' | 'community'
  }
  community?: {
    id: string
    name: string
    slug: string
  }
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  showUserInfo?: boolean
  maxItems?: number
  className?: string
}

const activityConfig = {
  post_created: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: '게시글 작성',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  comment_added: {
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    label: '댓글 작성',
    badgeColor: 'bg-green-100 text-green-800',
  },
  post_liked: {
    icon: Heart,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: '좋아요',
    badgeColor: 'bg-red-100 text-red-800',
  },
  post_bookmarked: {
    icon: Bookmark,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    label: '북마크',
    badgeColor: 'bg-yellow-100 text-yellow-800',
  },
  community_joined: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: '커뮤니티 가입',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
}

function formatTimeAgo(timestamp: string) {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMs = now.getTime() - time.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return '방금 전'
  if (diffInMinutes < 60) return `${diffInMinutes}분 전`
  if (diffInHours < 24) return `${diffInHours}시간 전`
  if (diffInDays < 7) return `${diffInDays}일 전`

  return time.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  })
}

function getTargetUrl(item: ActivityItem): string {
  if (!item.target) return '#'

  switch (item.target.type) {
    case 'main_post':
      return `/main/posts/${item.target.id}`
    case 'community_post':
      return item.community
        ? `/communities/${item.community.slug}/posts/${item.target.id}`
        : '#'
    case 'community':
      return `/communities/${item.target.slug || item.target.id}`
    default:
      return '#'
  }
}

export function ActivityFeed({
  activities,
  showUserInfo = true,
  maxItems = 10,
  className,
}: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  return (
    <Card
      className={cn(
        'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          최근 활동
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>아직 활동이 없습니다</p>
          </div>
        ) : (
          displayActivities.map((activity) => {
            const config = activityConfig[activity.type]
            const Icon = config.icon
            const targetUrl = getTargetUrl(activity)

            return (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border-2 border-black',
                  'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow',
                  'bg-white'
                )}
              >
                {/* 아이콘 */}
                <div
                  className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full border-2 border-black',
                    'flex items-center justify-center',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* 사용자 정보 */}
                    {showUserInfo && activity.user && (
                      <>
                        <Avatar className="h-5 w-5 border border-black">
                          <AvatarImage src={activity.user.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {activity.user.name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold">
                          {activity.user.name || '익명'}
                        </span>
                      </>
                    )}

                    {/* 활동 타입 배지 */}
                    <Badge
                      className={cn(
                        'text-xs border-2 border-black font-semibold',
                        config.badgeColor
                      )}
                    >
                      {config.label}
                    </Badge>

                    {/* 시간 */}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>

                  {/* 제목 */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium line-clamp-1">
                      {activity.title}
                    </p>

                    {/* 설명 */}
                    {activity.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activity.description}
                      </p>
                    )}

                    {/* 대상 및 커뮤니티 정보 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.target && (
                        <>
                          <Link
                            href={targetUrl}
                            className="hover:underline font-medium text-black"
                          >
                            {activity.target.title}
                          </Link>

                          {activity.community && (
                            <>
                              <span>•</span>
                              <Link
                                href={`/communities/${activity.community.slug}`}
                                className="hover:underline"
                              >
                                {activity.community.name}
                              </Link>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 이동 화살표 */}
                {activity.target && (
                  <Link
                    href={targetUrl}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                )}
              </div>
            )
          })
        )}

        {/* 더 보기 링크 */}
        {activities.length > maxItems && (
          <div className="text-center pt-2">
            <Link
              href="/dashboard/activity"
              className="text-sm text-muted-foreground hover:text-black hover:underline"
            >
              더 많은 활동 보기 ({activities.length - maxItems}개)
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
