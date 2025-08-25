'use client'

import { useEffect, useState } from 'react'

interface ClientOnlyWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientOnlyWrapper({
  children,
  fallback = (
    <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  ),
}: ClientOnlyWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 클라이언트에서만 렌더링
  if (!mounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
