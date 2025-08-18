import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'

export async function GET() {
  try {
    // 환경변수 확인
    const hasDbUrl = !!process.env.DATABASE_URL
    const dbUrlPrefix = process.env.DATABASE_URL?.substring(0, 50) + '...'

    // 간단한 DB 쿼리 테스트
    const userCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      hasDbUrl,
      dbUrlPrefix,
      userCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('DB Test Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hasDbUrl: !!process.env.DATABASE_URL,
        environment: process.env.NODE_ENV,
      },
      { status: 500 }
    )
  }
}
