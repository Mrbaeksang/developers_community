'use client'

import { User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface AuthorAvatarProps {
  author: {
    id?: string
    name?: string | null
    username?: string | null
    email?: string | null
    image?: string | null
  }
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showName?: boolean
  showDate?: boolean
  date?: string | Date
  className?: string
  avatarClassName?: string
  textClassName?: string
}

export function AuthorAvatar({
  author,
  size = 'sm',
  showName = false,
  showDate = false,
  date,
  className,
  avatarClassName,
  textClassName,
}: AuthorAvatarProps) {
  const sizeClasses = {
    xs: {
      avatar: 'h-5 w-5',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    sm: {
      avatar: 'h-6 w-6',
      icon: 'h-3 w-3',
      text: 'text-sm',
    },
    md: {
      avatar: 'h-8 w-8',
      icon: 'h-4 w-4',
      text: 'text-base',
    },
    lg: {
      avatar: 'h-10 w-10',
      icon: 'h-5 w-5',
      text: 'text-lg',
    },
  }

  const sizes = sizeClasses[size]
  const displayName = author.name || author.username || '익명'
  const initial = displayName[0]?.toUpperCase() || '?'

  const avatarElement = (
    <Avatar
      className={cn(
        sizes.avatar,
        'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        avatarClassName
      )}
    >
      <AvatarImage src={author.image || undefined} alt={displayName} />
      <AvatarFallback className="bg-primary/10 font-bold">
        {author.name || author.username ? (
          initial
        ) : (
          <User className={sizes.icon} />
        )}
      </AvatarFallback>
    </Avatar>
  )

  if (!showName && !showDate) {
    return avatarElement
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {avatarElement}
      {(showName || showDate) && (
        <div className="flex flex-col">
          {showName && (
            <span
              className={cn(
                sizes.text,
                'font-bold line-clamp-1',
                textClassName
              )}
            >
              {displayName}
            </span>
          )}
          {showDate && date && (
            <time
              className={cn(
                sizes.text,
                'text-muted-foreground font-medium',
                textClassName
              )}
            >
              {typeof date === 'string' ? date : date.toLocaleDateString()}
            </time>
          )}
        </div>
      )}
    </div>
  )
}
