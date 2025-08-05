import { NextResponse } from 'next/server'
import { trackApiCall, logError } from '@/lib/monitoring'

export async function GET() {
  const start = Date.now()
  const endpoint = '/api/test-monitoring'

  try {
    // API 호출 추적
    const responseTime = Date.now() - start
    await trackApiCall(endpoint, responseTime)

    return NextResponse.json({
      success: true,
      message: 'Monitoring test successful',
      responseTime,
    })
  } catch (error) {
    // 에러 로깅
    await logError({
      endpoint,
      method: 'GET',
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  const start = Date.now()
  const endpoint = '/api/test-monitoring'

  try {
    // 의도적으로 에러 발생
    throw new Error('Test error for monitoring')
  } catch (error) {
    const responseTime = Date.now() - start

    // API 호출 추적
    await trackApiCall(endpoint, responseTime)

    // 에러 로깅
    await logError({
      endpoint,
      method: 'POST',
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Test error',
      },
      { status: 400 }
    )
  }
}
