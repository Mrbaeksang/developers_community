'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  /** 스피너 크기 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** 스피너 변형 */
  variant?: 'default' | 'primary' | 'secondary' | 'brutal'
  /** 전체 화면 모드 */
  fullScreen?: boolean
  /** 오버레이 모드 (부모 요소 기준) */
  overlay?: boolean
  /** 로딩 텍스트 */
  text?: string
  /** 텍스트 위치 */
  textPosition?: 'bottom' | 'right'
  /** 추가 클래스 */
  className?: string
  /** 애니메이션 타입 */
  animation?: 'spin' | 'pulse' | 'bounce'
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  fullScreen = false,
  overlay = false,
  text,
  textPosition = 'bottom',
  className,
  animation = 'spin',
}: LoadingSpinnerProps) {
  // 애니메이션 클래스 선택
  const animationClass = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  }[animation]

  // 변형별 스타일
  const variantClasses = {
    default: 'text-gray-600',
    primary: 'text-primary',
    secondary: 'text-secondary',
    brutal: 'text-black',
  }[variant]

  // 스피너 컴포넌트
  const spinner = (
    <div
      className={cn(
        'flex items-center gap-3',
        textPosition === 'bottom' && 'flex-col',
        textPosition === 'right' && 'flex-row',
        className
      )}
    >
      {variant === 'brutal' ? (
        // 네오브루탈리즘 커스텀 스피너
        <div className={cn('relative', sizeClasses[size])}>
          <div
            className={cn(
              'absolute inset-0 rounded-full border-4 border-black',
              'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
              animationClass
            )}
          />
          <div
            className={cn(
              'absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent',
              'border-r-yellow-400 border-b-yellow-400',
              animationClass
            )}
          />
        </div>
      ) : (
        // 기본 Lucide 아이콘 스피너
        <Loader2
          className={cn(sizeClasses[size], variantClasses, animationClass)}
        />
      )}

      {text && (
        <span
          className={cn(
            'font-bold',
            textSizeClasses[size],
            variant === 'brutal' && 'text-black',
            variantClasses
          )}
        >
          {text}
        </span>
      )}
    </div>
  )

  // 전체 화면 모드
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="rounded-lg border-2 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {spinner}
        </div>
      </div>
    )
  }

  // 오버레이 모드
  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {spinner}
      </div>
    )
  }

  return spinner
}

// 버튼용 인라인 스피너
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('mr-2 h-4 w-4 animate-spin', className)}
      aria-hidden="true"
    />
  )
}

// 페이지 로딩 스피너
export function PageLoadingSpinner() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner
        size="xl"
        variant="brutal"
        text="페이지를 불러오는 중..."
        animation="spin"
      />
    </div>
  )
}

// 카드 로딩 스피너
export function CardLoadingSpinner() {
  return <LoadingSpinner overlay size="lg" variant="brutal" text="로딩 중..." />
}

// 스켈레톤 로더 (대체용)
export function SkeletonLoader({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded border-2 border-black bg-gray-200',
            'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            'animate-pulse',
            i === lines - 1 && 'w-3/4'
          )}
        />
      ))}
    </div>
  )
}
