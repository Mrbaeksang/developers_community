'use client'

import Link from 'next/link'
import { Tag as TagIcon } from 'lucide-react'
import { getTextColor } from '@/lib/color-utils'
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  tag: {
    id: string
    name: string
    slug?: string
    color?: string | null
  }
  showIcon?: boolean
  clickable?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function TagBadge({
  tag,
  showIcon = true,
  clickable = true,
  size = 'sm',
  className,
}: TagBadgeProps) {
  const backgroundColor = tag.color || '#e5e7eb'
  const textColor = getTextColor(backgroundColor)

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const badgeContent = (
    <span
      className={cn(
        'rounded-full font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        'transition-all duration-200 inline-flex items-center gap-1',
        clickable && 'hover:scale-105 cursor-pointer',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
      }}
    >
      {showIcon && <TagIcon className={cn(iconSizes[size], 'flex-shrink-0')} />}
      <span>{tag.name}</span>
    </span>
  )

  if (!clickable || !tag.slug) {
    return badgeContent
  }

  return (
    <Link
      href={`/main/tags/${encodeURIComponent(tag.slug || tag.name)}`}
      className="group"
    >
      {badgeContent}
    </Link>
  )
}
