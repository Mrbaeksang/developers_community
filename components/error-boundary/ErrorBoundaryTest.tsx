'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * Development component for testing error boundaries
 * Only available in development mode
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false)

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const ThrowError = () => {
    if (shouldThrow) {
      throw new Error('Test error boundary - This is intentional for testing')
    }
    return (
      <div className="p-4 bg-green-100 border-3 border-black">
        <p className="text-green-800 font-bold">
          No error - component working normally
        </p>
      </div>
    )
  }

  const triggerAsyncError = async () => {
    // Test async error handling
    setTimeout(() => {
      throw new Error(
        'Async error test - This should be caught by AsyncErrorBoundary'
      )
    }, 100)
  }

  const triggerPromiseRejection = () => {
    // Test unhandled promise rejection
    Promise.reject(new Error('Promise rejection test - This should be caught'))
  }

  return (
    <div className="p-6 bg-yellow-50 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] m-4">
      <h3 className="text-lg font-bold mb-4 text-yellow-800">
        🧪 Error Boundary Testing (Development Only)
      </h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-bold mb-2">Synchronous Error Test:</h4>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
          <div className="mt-2 space-x-2">
            <Button
              onClick={() => setShouldThrow(!shouldThrow)}
              variant={shouldThrow ? 'destructive' : 'default'}
              size="sm"
              className="border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {shouldThrow ? 'Reset Component' : 'Trigger Error'}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-2">Async Error Tests:</h4>
          <div className="space-x-2">
            <Button
              onClick={triggerAsyncError}
              variant="outline"
              size="sm"
              className="border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Trigger Async Error
            </Button>
            <Button
              onClick={triggerPromiseRejection}
              variant="outline"
              size="sm"
              className="border-3 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Trigger Promise Rejection
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Note:</strong> Check console for error logs and network tab
            for error reporting API calls.
          </p>
        </div>
      </div>
    </div>
  )
}
