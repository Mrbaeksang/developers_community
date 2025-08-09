'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileText, Users, TrendingUp, Award } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface DashboardOverviewProps {
  stats: {
    totalPosts: number
    mainPosts: number
    communityPosts: number
    mainComments: number
    mainLikes: number
    mainBookmarks: number
    communities: number
  }
}

export function DashboardOverview({ stats }: DashboardOverviewProps) {
  // 활동 레벨 계산
  const getActivityLevel = () => {
    const totalActivity =
      stats.totalPosts + stats.mainComments + stats.mainLikes
    if (totalActivity < 10)
      return { level: '초보자', progress: 20, color: 'bg-gray-500' }
    if (totalActivity < 50)
      return { level: '활동적', progress: 40, color: 'bg-blue-500' }
    if (totalActivity < 100)
      return { level: '열정적', progress: 60, color: 'bg-green-500' }
    if (totalActivity < 200)
      return { level: '인플루언서', progress: 80, color: 'bg-purple-500' }
    return { level: '마스터', progress: 100, color: 'bg-yellow-500' }
  }

  const activityLevel = getActivityLevel()

  const overviewCards = [
    {
      title: '전체 게시글',
      value: stats.totalPosts,
      subtitle: `메인 ${stats.mainPosts} · 커뮤니티 ${stats.communityPosts}`,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '커뮤니티 활동',
      value: stats.communities,
      subtitle: '가입한 커뮤니티',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '참여도',
      value: stats.mainComments + stats.mainLikes,
      subtitle: `댓글 ${stats.mainComments} · 좋아요 ${stats.mainLikes}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-black">활동 개요</h2>

      {/* 활동 레벨 카드 */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            활동 레벨
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black">{activityLevel.level}</span>
            <span className="text-sm text-muted-foreground">
              {activityLevel.progress}%
            </span>
          </div>
          <Progress value={activityLevel.progress} className="h-3" />
          <p className="text-xs text-muted-foreground">
            계속 활동하여 다음 레벨에 도달하세요!
          </p>
        </CardContent>
      </Card>

      {/* 개요 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-3">
        {overviewCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card
              key={index}
              className={cn(
                'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
                'transition-all cursor-pointer'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div
                  className={cn(
                    'p-2 rounded-full border-2 border-black',
                    card.bgColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
