'use client'

import React from 'react'
import { User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/core/utils'
import { ProfileDropdown } from '@/components/shared/ProfileDropdown'

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
  date?: string | Date | React.ReactNode
  className?: string
  avatarClassName?: string
  textClassName?: string
  enableDropdown?: boolean
  dropdownAlign?: 'start' | 'center' | 'end'
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
  enableDropdown = false,
  dropdownAlign = 'start',
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

  // Google 이미지는 프록시를 통해 로드 (429 에러 방지)
  const getImageSrc = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return undefined

    if (imageUrl.startsWith('https://lh3.googleusercontent.com/')) {
      return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
    }

    return imageUrl
  }

  const avatarElement = (
    <Avatar
      className={cn(
        sizes.avatar,
        'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        enableDropdown &&
          'cursor-pointer hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all',
        avatarClassName
      )}
    >
      <AvatarImage src={getImageSrc(author.image)} alt={displayName} />
      <AvatarFallback className="bg-primary/10 font-bold">
        {author.name || author.username ? (
          initial
        ) : (
          <User className={sizes.icon} />
        )}
      </AvatarFallback>
    </Avatar>
  )

  // 드롭다운이 활성화되고 author.id가 있을 때만 ProfileDropdown으로 감싸기
  const wrappedAvatar =
    enableDropdown && author.id ? (
      <ProfileDropdown userId={author.id} align={dropdownAlign}>
        <div className="inline-block">{avatarElement}</div>
      </ProfileDropdown>
    ) : (
      avatarElement
    )

  if (!showName && !showDate) {
    return wrappedAvatar
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {wrappedAvatar}
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
              suppressHydrationWarning
            >
              {React.isValidElement(date)
                ? date
                : typeof date === 'string'
                  ? date
                  : date instanceof Date
                    ? date.toLocaleDateString()
                    : date}
            </time>
          )}
        </div>
      )}
    </div>
  )
}
