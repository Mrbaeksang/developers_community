'use client'

import { Eye, Heart, MessageCircle } from 'lucide-react'
import { formatCount } from '@/lib/common-types'
import { cn } from '@/lib/utils'

interface PostStatsProps {
  viewCount?: number
  likeCount?: number
  commentCount?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'pill' | 'minimal'
  className?: string
}

export function PostStats({
  viewCount = 0,
  likeCount = 0,
  commentCount = 0,
  size = 'sm',
  variant = 'default',
  className,
}: PostStatsProps) {
  const sizeClasses = {
    sm: {
      icon: 'h-3 w-3',
      text: 'text-xs',
      gap: 'gap-1',
      padding: 'px-2 py-1',
    },
    md: {
      icon: 'h-4 w-4',
      text: 'text-sm',
      gap: 'gap-1.5',
      padding: 'px-2.5 py-1.5',
    },
    lg: {
      icon: 'h-5 w-5',
      text: 'text-base',
      gap: 'gap-2',
      padding: 'px-3 py-2',
    },
  }

  const variantClasses = {
    default: 'text-gray-600',
    pill: 'rounded-full border',
    minimal: '',
  }

  const stats = [
    {
      icon: Eye,
      count: viewCount,
      color:
        variant === 'pill'
          ? 'bg-gray-100/80 border-gray-200 hover:bg-gray-200/80'
          : '',
      iconColor: variant === 'pill' ? 'text-gray-600' : 'text-blue-500',
      textColor: variant === 'pill' ? 'text-gray-700' : '',
    },
    {
      icon: Heart,
      count: likeCount,
      color:
        variant === 'pill'
          ? 'bg-red-50/80 border-red-200 hover:bg-red-100/80'
          : '',
      iconColor: 'text-red-500',
      textColor: variant === 'pill' ? 'text-red-600' : '',
    },
    {
      icon: MessageCircle,
      count: commentCount,
      color:
        variant === 'pill'
          ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/80'
          : '',
      iconColor: variant === 'pill' ? 'text-blue-500' : 'text-green-500',
      textColor: variant === 'pill' ? 'text-blue-600' : '',
    },
  ]

  const sizes = sizeClasses[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {stats.map(
        ({ icon: Icon, count, color, iconColor, textColor }, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center',
              sizes.gap,
              variantClasses[variant],
              variant === 'pill' && [sizes.padding, color, 'transition-colors'],
              variant === 'minimal' && index < stats.length - 1 && 'mr-2'
            )}
          >
            <Icon className={cn(sizes.icon, iconColor)} />
            <span className={cn(sizes.text, 'font-medium', textColor)}>
              {formatCount(count)}
            </span>
          </div>
        )
      )}
    </div>
  )
}
