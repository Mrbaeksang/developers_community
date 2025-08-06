import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { handleError, throwValidationError } from '@/lib/error-handler'

interface ErrorReport {
  message: string
  stack?: string
  context?: Record<string, unknown>
  timestamp: string
  userAgent: string
  url: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const errorData: ErrorReport = await request.json()

    // Validate the error data
    if (!errorData.message || !errorData.timestamp) {
      throw throwValidationError('Invalid error data')
    }

    // Add user context if available
    const enrichedErrorData = {
      ...errorData,
      userId: session?.user?.id || 'anonymous',
      userEmail: session?.user?.email || 'unknown',
      reportedAt: new Date().toISOString(),
    }

    // Log to console (in production, you'd send to a service like Sentry)
    console.error('Client Error Report:', {
      ...enrichedErrorData,
      // Sanitize sensitive data
      stack:
        process.env.NODE_ENV === 'development' ? errorData.stack : '[REDACTED]',
    })

    // Here you would typically send to an error monitoring service
    // Examples:
    // - Sentry: Sentry.captureException(new Error(errorData.message))
    // - LogRocket: LogRocket.captureException(new Error(errorData.message))
    // - DataDog: ddLogger.error(errorData.message, enrichedErrorData)

    // For now, we'll just acknowledge receipt
    return NextResponse.json(
      { success: true, id: `error_${Date.now()}` },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing error report:', error)
    return handleError(error)
  }
}
