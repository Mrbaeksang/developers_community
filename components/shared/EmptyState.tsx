'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'ghost'
  }
  variant?: 'default' | 'search' | 'error' | 'success'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const variantStyles = {
  default: {
    container: 'bg-white',
    icon: 'text-gray-400',
    title: 'text-gray-900',
    description: 'text-gray-500',
  },
  search: {
    container: 'bg-blue-50',
    icon: 'text-blue-400',
    title: 'text-blue-900',
    description: 'text-blue-600',
  },
  error: {
    container: 'bg-red-50',
    icon: 'text-red-400',
    title: 'text-red-900',
    description: 'text-red-600',
  },
  success: {
    container: 'bg-green-50',
    icon: 'text-green-400',
    title: 'text-green-900',
    description: 'text-green-600',
  },
}

const sizeStyles = {
  sm: {
    container: 'py-8 px-6',
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-sm',
    spacing: 'space-y-2',
  },
  md: {
    container: 'py-12 px-8',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-base',
    spacing: 'space-y-3',
  },
  lg: {
    container: 'py-16 px-10',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-lg',
    spacing: 'space-y-4',
  },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  size = 'md',
  className,
}: EmptyStateProps) {
  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center text-center',
        'border-2 border-black rounded-lg',
        'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        'transition-all duration-200',
        'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
        variantStyle.container,
        sizeStyle.container,
        sizeStyle.spacing,
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex items-center justify-center',
            'border-2 border-black rounded-full',
            'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            'p-3 mb-2',
            variant === 'default' && 'bg-gray-50',
            variant === 'search' && 'bg-blue-100',
            variant === 'error' && 'bg-red-100',
            variant === 'success' && 'bg-green-100'
          )}
        >
          <Icon className={cn(sizeStyle.icon, variantStyle.icon)} />
        </div>
      )}

      <h3 className={cn('font-bold', sizeStyle.title, variantStyle.title)}>
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'max-w-sm',
            sizeStyle.description,
            variantStyle.description
          )}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
            className={cn(
              'border-2 border-black',
              'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
              'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
              'transition-all duration-200',
              'font-semibold'
            )}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

// 특수 목적 Empty State 컴포넌트들
export function NoDataEmptyState({
  title = '데이터가 없습니다',
  description = '표시할 데이터가 없습니다.',
  action,
  className,
}: Partial<EmptyStateProps>) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      variant="default"
      className={className}
    />
  )
}

export function SearchEmptyState({
  title = '검색 결과가 없습니다',
  description = '다른 검색어를 시도해보세요.',
  onReset,
  className,
}: {
  title?: string
  description?: string
  onReset?: () => void
  className?: string
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        onReset
          ? {
              label: '검색 초기화',
              onClick: onReset,
              variant: 'outline',
            }
          : undefined
      }
      variant="search"
      className={className}
    />
  )
}

export function ErrorEmptyState({
  title = '오류가 발생했습니다',
  description = '잠시 후 다시 시도해주세요.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: '다시 시도',
              onClick: onRetry,
              variant: 'default',
            }
          : undefined
      }
      variant="error"
      className={className}
    />
  )
}
