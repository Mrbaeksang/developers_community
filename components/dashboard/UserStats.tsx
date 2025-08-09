'use client'

import { Card, CardContent } from '@/components/ui/card'
import { FileText, MessageSquare, Heart, Bookmark, Users } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface UserStatsProps {
  stats: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    mainLikes: number
    mainBookmarks: number
  }
  showOnlineStatus?: boolean
  isOnline?: boolean
  className?: string
}

const statItems = [
  {
    key: 'mainPosts' as const,
    label: '게시글',
    icon: FileText,
    color: 'text-blue-900',
    bgColor: 'bg-blue-400',
    hoverBg: 'group-hover:bg-blue-500',
  },
  {
    key: 'communityPosts' as const,
    label: '커뮤니티 글',
    icon: Users,
    color: 'text-green-900',
    bgColor: 'bg-green-400',
    hoverBg: 'group-hover:bg-green-500',
  },
  {
    key: 'mainComments' as const,
    label: '댓글',
    icon: MessageSquare,
    color: 'text-purple-900',
    bgColor: 'bg-purple-400',
    hoverBg: 'group-hover:bg-purple-500',
  },
  {
    key: 'mainLikes' as const,
    label: '좋아요',
    icon: Heart,
    color: 'text-red-900',
    bgColor: 'bg-red-400',
    hoverBg: 'group-hover:bg-red-500',
  },
  {
    key: 'mainBookmarks' as const,
    label: '북마크',
    icon: Bookmark,
    color: 'text-yellow-900',
    bgColor: 'bg-yellow-400',
    hoverBg: 'group-hover:bg-yellow-500',
  },
]

export function UserStats({
  stats,
  showOnlineStatus = false,
  isOnline = false,
  className,
}: UserStatsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* 온라인 상태 표시 (향후 구현) */}
      {showOnlineStatus && (
        <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-3 h-3 rounded-full border-2 border-black',
                  isOnline ? 'bg-green-400' : 'bg-gray-400'
                )}
              />
              <span className="text-sm font-semibold">
                {isOnline ? '온라인' : '오프라인'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 통계 그리드 - 개선된 레이아웃 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon
          const value = stats[item.key] || 0

          return (
            <Card
              key={item.key}
              className={cn(
                'border-2 border-black',
                'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
                'hover:translate-x-[-2px] hover:translate-y-[-2px]',
                'transition-all duration-200 cursor-pointer',
                'overflow-hidden group'
              )}
            >
              <CardContent className="p-6 text-center relative">
                {/* 배경 색상 블록 */}
                <div
                  className={cn(
                    'absolute inset-0 transition-colors duration-200',
                    item.bgColor,
                    item.hoverBg
                  )}
                />

                {/* 컨텐츠 */}
                <div className="relative z-10">
                  {/* 큰 아이콘 */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border-2 border-black mb-3 group-hover:rotate-6 transition-transform">
                    <Icon className={cn('h-8 w-8', item.color)} />
                  </div>

                  {/* 큰 숫자 */}
                  <div className="text-3xl font-black mb-1">
                    {value.toLocaleString()}
                  </div>

                  {/* 라벨 */}
                  <p className="text-sm font-bold uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// 간단한 버전 (아이콘 없이) - 개선된 스타일
export function SimpleUserStats({
  stats,
  className,
}: Omit<UserStatsProps, 'showOnlineStatus' | 'isOnline'>) {
  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-5 gap-4', className)}>
      {statItems.map((item) => {
        const value = stats[item.key] || 0

        return (
          <Card
            key={item.key}
            className={cn(
              'border-2 border-black',
              'shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
              'hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
              'transition-shadow cursor-pointer',
              item.bgColor
            )}
          >
            <CardContent className="py-4 px-3 text-center">
              <div className="text-2xl font-black">
                {value.toLocaleString()}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {item.label}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
