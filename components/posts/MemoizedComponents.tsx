'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { getLuminance } from '@/lib/color-utils'

interface TagBadgeProps {
  tag: {
    id: string
    name: string
    color: string
  }
  onRemove?: () => void
}

export const MemoizedTagBadge = memo<TagBadgeProps>(({ tag, onRemove }) => {
  const isLight = getLuminance(tag.color) > 128
  const textColor = isLight ? '#000000' : '#FFFFFF'

  return (
    <Badge
      style={{
        backgroundColor: tag.color,
        color: textColor,
        borderColor: tag.color,
      }}
      className="px-2.5 py-1 text-xs flex items-center gap-1.5"
    >
      {tag.name}
      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-3 w-3 p-0 hover:bg-transparent"
          onClick={onRemove}
        >
          <X className="h-2.5 w-2.5" />
        </Button>
      )}
    </Badge>
  )
})

MemoizedTagBadge.displayName = 'MemoizedTagBadge'

interface CharacterCountProps {
  current: number
  max: number
}

export const MemoizedCharacterCount = memo<CharacterCountProps>(
  ({ current, max }) => {
    const percentage = (current / max) * 100
    const isWarning = percentage > 80
    const isError = percentage >= 100

    return (
      <span
        className={`text-xs ${
          isError
            ? 'text-red-500'
            : isWarning
              ? 'text-yellow-600'
              : 'text-gray-500'
        }`}
      >
        {current} / {max}
      </span>
    )
  }
)

MemoizedCharacterCount.displayName = 'MemoizedCharacterCount'

interface MarkdownToolbarButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}

export const MemoizedToolbarButton = memo<MarkdownToolbarButtonProps>(
  ({ icon, label, onClick, active = false }) => {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${active ? 'bg-gray-200' : ''}`}
        onClick={onClick}
        title={label}
      >
        {icon}
      </Button>
    )
  }
)

MemoizedToolbarButton.displayName = 'MemoizedToolbarButton'
