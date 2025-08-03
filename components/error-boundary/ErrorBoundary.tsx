'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Log error to console and external service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Send to external error reporting service
    this.logErrorToService(error, errorInfo)
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Add your error reporting service here (e.g., Sentry, LogRocket, etc.)
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== 'undefined'
            ? window.navigator.userAgent
            : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      }

      // Example: Send to your API endpoint
      if (typeof window !== 'undefined') {
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        }).catch((fetchError) => {
          console.error('Failed to log error to service:', fetchError)
        })
      }
    } catch (loggingError) {
      console.error('Error logging failed:', loggingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    })
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }))
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI with neubrutalism design
      return (
        <div className="min-h-screen bg-yellow-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="text-center mb-6">
              <div className="bg-red-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 mb-4 inline-block">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black mb-2">앗! 뭔가 잘못됐어요</h1>
              <p className="text-gray-700 mb-4">
                예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                홈으로 가기
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="border-t-3 border-black pt-4">
                <button
                  onClick={this.toggleDetails}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-100 flex items-center justify-center gap-2"
                >
                  {this.state.showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      오류 정보 숨기기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      오류 정보 보기
                    </>
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-4 p-4 bg-gray-100 border-3 border-black text-sm">
                    <div className="mb-4">
                      <h3 className="font-bold mb-2">오류 메시지:</h3>
                      <p className="text-red-600 font-mono text-xs break-all">
                        {this.state.error?.message}
                      </p>
                    </div>

                    {this.state.error?.stack && (
                      <div className="mb-4">
                        <h3 className="font-bold mb-2">스택 트레이스:</h3>
                        <pre className="text-xs overflow-auto max-h-32 bg-white p-2 border-2 border-gray-300">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <h3 className="font-bold mb-2">컴포넌트 스택:</h3>
                        <pre className="text-xs overflow-auto max-h-32 bg-white p-2 border-2 border-gray-300">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
