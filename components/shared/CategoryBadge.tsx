'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getTextColor } from '@/lib/ui/colors'
import { getCategoryIcon } from '@/lib/post/display'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface CategoryBadgeProps {
  category: {
    id: string
    name: string
    slug: string
    color?: string | null
    icon?: string | null
  }
  icon?: LucideIcon
  showIcon?: boolean
  clickable?: boolean
  className?: string
}

export function CategoryBadge({
  category,
  icon: IconProp,
  showIcon = true,
  clickable = true,
  className,
}: CategoryBadgeProps) {
  const backgroundColor = category.color || '#f3f4f6'
  const textColor = getTextColor(backgroundColor)

  // 아이콘 결정: prop으로 받은 것 우선, 없으면 category.icon에서 찾기
  const Icon =
    IconProp || (showIcon ? getCategoryIcon(category.icon) : undefined)

  const badgeContent = (
    <>
      {showIcon && Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
      {category.name}
    </>
  )

  const badgeElement = (
    <Badge
      className={cn(
        'px-3 py-1.5 text-xs font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
        'flex items-center gap-1.5 transition-all duration-200',
        clickable && 'hover:scale-105 cursor-pointer',
        className
      )}
      style={{
        backgroundColor: backgroundColor,
        color: textColor,
        borderColor: backgroundColor,
      }}
    >
      {badgeContent}
    </Badge>
  )

  if (!clickable) {
    return badgeElement
  }

  return (
    <Link href={`/main/posts?category=${category.slug}`}>{badgeElement}</Link>
  )
}
