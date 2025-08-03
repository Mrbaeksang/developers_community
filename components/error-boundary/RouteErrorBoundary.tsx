'use client'

import React, { ReactNode } from 'react'
import { AsyncErrorBoundary } from './AsyncErrorBoundary'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  children: ReactNode
  level?: 'page' | 'section' | 'component'
}

/**
 * Route-specific error boundary with navigation controls
 * Provides different fallback UIs based on the error level
 */
export function RouteErrorBoundary({ children, level = 'component' }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const handleGoBack = () => {
    router.back()
  }

  const handleRefresh = () => {
    router.refresh()
  }

  const getErrorFallback = () => {
    switch (level) {
      case 'page':
        return (
          <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8">
              <div className="text-center mb-6">
                <div className="bg-red-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-4 inline-block">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-black mb-2">페이지 오류</h1>
                <p className="text-gray-700 mb-2">
                  이 페이지를 불러오는 중 오류가 발생했습니다.
                </p>
                <p className="text-sm text-gray-500">경로: {pathname}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  페이지 새로고침
                </button>

                <button
                  onClick={handleGoBack}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전 페이지
                </button>
              </div>
            </div>
          </div>
        )

      case 'section':
        return (
          <div className="bg-yellow-50 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 m-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500 border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">섹션 오류</h3>
                <p className="text-gray-600 text-sm">
                  이 섹션을 불러오는 중 문제가 발생했습니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        )

      case 'component':
      default:
        return (
          <div className="bg-red-50 border-2 border-red-300 border-dashed p-4 m-2 rounded">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium text-sm">컴포넌트 오류</span>
            </div>
            <p className="text-red-600 text-xs mt-1">
              컴포넌트를 렌더링할 수 없습니다.
            </p>
          </div>
        )
    }
  }

  return (
    <AsyncErrorBoundary fallback={getErrorFallback()}>
      {children}
    </AsyncErrorBoundary>
  )
}
