'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { getTextColor } from '@/lib/color-utils'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: {
    id: string
    name: string
    slug: string
    color: string
    icon?: string | null
  }
  icon?: LucideIcon
  showIcon?: boolean
  clickable?: boolean
  className?: string
}

export function CategoryBadge({
  category,
  icon: Icon,
  showIcon = true,
  clickable = true,
  className,
}: CategoryBadgeProps) {
  const textColor = getTextColor(category.color)

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
        backgroundColor: category.color,
        color: textColor,
        borderColor: category.color,
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
