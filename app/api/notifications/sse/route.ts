import { NextResponse } from 'next/server'
import { handleError, throwAuthenticationError } from '@/lib/api/errors'
import { auth } from '@/auth'

// Vercel에서 SSE는 타임아웃 문제로 사용 불가
// 대신 Polling 방식 사용 권장

// GET: SSE 대신 정보 메시지 반환
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      throwAuthenticationError('로그인이 필요합니다.')
    }

    // Polling 방식으로 변경 안내
    return NextResponse.json({
      success: true,
      data: {
        message:
          'SSE is not supported in Vercel serverless. Use polling instead.',
        alternatives: {
          polling: '/api/notifications',
          interval: 5000, // 5초마다 폴링 권장
        },
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
