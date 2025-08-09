'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trophy,
  Target,
  Zap,
  Award,
  Star,
  Users,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface ProfileSidebarProps {
  userId: string
  stats: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    mainBookmarks: number
    communities: number
  }
  isOwnProfile: boolean
}

export function ProfileSidebar({ stats }: ProfileSidebarProps) {
  // 업적 계산
  const getAchievements = () => {
    const achievementList = []

    if (stats.mainPosts + stats.communityPosts >= 10) {
      achievementList.push({
        icon: Trophy,
        title: '작가',
        description: '10개 이상의 게시글 작성',
        color: 'text-yellow-500',
      })
    }

    if (stats.mainComments >= 50) {
      achievementList.push({
        icon: MessageSquare,
        title: '토론가',
        description: '50개 이상의 댓글 작성',
        color: 'text-blue-500',
      })
    }

    if (stats.communities >= 5) {
      achievementList.push({
        icon: Users,
        title: '사교가',
        description: '5개 이상의 커뮤니티 가입',
        color: 'text-green-500',
      })
    }

    if (stats.mainBookmarks >= 30) {
      achievementList.push({
        icon: Star,
        title: '큐레이터',
        description: '30개 이상 북마크',
        color: 'text-red-500',
      })
    }

    return achievementList
  }

  const userAchievements = getAchievements()

  // 레벨 계산
  const calculateLevel = () => {
    const totalActivity =
      (stats.mainPosts + stats.communityPosts) * 10 +
      stats.mainComments * 2 +
      stats.mainBookmarks * 3 +
      stats.communities * 5

    const level = Math.floor(totalActivity / 100) + 1
    const currentLevelProgress = totalActivity % 100

    return { level, progress: currentLevelProgress }
  }

  const { level, progress } = calculateLevel()

  const cardClasses =
    'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white'

  return (
    <div className="space-y-6">
      <Card className={cardClasses}>
        <CardHeader className="border-b-2 border-dashed border-gray-300">
          <CardTitle className="flex items-center gap-2 font-black">
            <Zap className="h-5 w-5 text-yellow-500" />
            레벨
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-4xl font-black">Lv.{level}</span>
              <span className="text-sm text-muted-foreground">
                {progress}/100
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 border-2 border-black">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 업적 카드 */}
      {userAchievements.length > 0 && (
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-500" />
              업적
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userAchievements.map((achievement, index) => {
                const Icon = achievement.icon
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg',
                      'border-2 border-black bg-secondary/50'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 mt-0.5', achievement.color)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 목표 카드 */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            다음 목표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.mainPosts + stats.communityPosts < 10 && (
              <div className="flex items-center justify-between text-sm">
                <span>첫 10개 게시글</span>
                <Badge variant="outline" className="border-black">
                  {stats.mainPosts + stats.communityPosts}/10
                </Badge>
              </div>
            )}
            {stats.mainComments < 50 && (
              <div className="flex items-center justify-between text-sm">
                <span>50개 댓글 작성</span>
                <Badge variant="outline" className="border-black">
                  {stats.mainComments}/50
                </Badge>
              </div>
            )}
            {stats.communities < 5 && (
              <div className="flex items-center justify-between text-sm">
                <span>5개 커뮤니티 가입</span>
                <Badge variant="outline" className="border-black">
                  {stats.communities}/5
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
