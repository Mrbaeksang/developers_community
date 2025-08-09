'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface ProfileActivityProps {
  activities: Array<{
    date: string
    count: number
  }>
}

export function ProfileActivity({ activities }: ProfileActivityProps) {
  const maxCount = Math.max(...activities.map((a) => a.count), 1)

  // 활동 레벨 계산
  const totalActivity = activities.reduce((sum, a) => sum + a.count, 0)
  const averageActivity = totalActivity / activities.length

  const getActivityLevel = () => {
    if (averageActivity < 1) return { label: '조용함', color: 'text-gray-500' }
    if (averageActivity < 3) return { label: '보통', color: 'text-blue-500' }
    if (averageActivity < 5) return { label: '활발함', color: 'text-green-500' }
    return { label: '매우 활발함', color: 'text-purple-500' }
  }

  const activityLevel = getActivityLevel()

  const cardClasses =
    'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white'
  const barClasses =
    'w-full bg-gradient-to-t from-primary to-primary/70 rounded-t transition-all hover:from-primary/90 hover:to-primary/60 cursor-pointer border-2 border-black'

  return (
    <Card className={cardClasses}>
      <CardHeader className="border-b-2 border-dashed border-gray-300">
        <CardTitle className="flex items-center justify-between font-black">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            최근 7일 활동
          </span>
          <span className={`text-sm font-bold ${activityLevel.color}`}>
            {activityLevel.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-end gap-1 h-32">
            {activities.map((activity, index) => {
              const height =
                activity.count === 0 ? 4 : (activity.count / maxCount) * 100
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full bg-gray-100 rounded-t relative group">
                    <div
                      className={barClasses}
                      style={{ height: `${Math.max(height, 4)}px` }}
                    >
                      {activity.count > 0 && (
                        <div
                          className={cn(
                            'absolute -top-6 left-1/2 -translate-x-1/2',
                            'bg-black text-white text-xs px-1 py-0.5 rounded',
                            'opacity-0 group-hover:opacity-100 transition-opacity',
                            'whitespace-nowrap'
                          )}
                        >
                          {activity.count}개
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.date}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 활동 요약 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>최근 7일 활동</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black">{totalActivity}</p>
              <p className="text-xs text-muted-foreground">총 활동</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
