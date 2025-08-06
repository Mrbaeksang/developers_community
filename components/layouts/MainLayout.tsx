'use client'

import { Header } from './Header'
import { cn } from '@/lib/core/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={cn('flex-1', className)}>{children}</main>
    </div>
  )
}
