'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to the console and external service
    console.error('App Router Error:', error)

    // Send to error reporting service
    if (typeof window !== 'undefined') {
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          digest: error.digest,
          timestamp: new Date().toISOString(),
          userAgent: window.navigator.userAgent,
          url: window.location.href,
          context: {
            type: 'app_router_error',
            component: 'error.tsx',
          },
        }),
      }).catch((reportError) => {
        console.error('Failed to report error:', reportError)
      })
    }
  }, [error])

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="text-center mb-6">
          <div className="bg-red-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-4 inline-block">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2">애플리케이션 오류</h1>
          <p className="text-gray-700 mb-4">
            애플리케이션에서 예상치 못한 오류가 발생했습니다.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left">
              <div className="bg-gray-100 border-3 border-black p-3 text-sm">
                <h3 className="font-bold mb-2">오류 정보:</h3>
                <p className="text-red-600 font-mono text-xs break-all mb-2">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-gray-600 text-xs">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  )
}
