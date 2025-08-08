import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { del } from '@vercel/blob'
import { handleError } from '@/lib/api/errors'

// 30일 이상 된 이미지 정리 (메인 게시판 자유게시판/Q&A 제외)
const CLEANUP_DAYS = 30

export async function GET(req: NextRequest) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS)

    // 1. 커뮤니티 게시글의 오래된 이미지 정리
    const oldCommunityFiles = await prisma.file.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        post: {
          isNot: null,
        },
      },
      select: {
        id: true,
        url: true,
        filename: true,
        size: true,
      },
    })

    // 2. 오래된 미사용 파일 정리 (어디에도 연결 안된 파일)
    const unusedFiles = await prisma.file.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        postId: null,
        chatMessages: {
          none: {},
        },
      },
      select: {
        id: true,
        url: true,
        filename: true,
        size: true,
      },
    })

    const allFilesToDelete = [...oldCommunityFiles, ...unusedFiles]
    let deletedCount = 0
    let totalSizeFreed = 0

    // Vercel Blob에서 삭제 및 DB 정리
    for (const file of allFilesToDelete) {
      try {
        if (file.url) {
          await del(file.url, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
        }

        await prisma.file.delete({
          where: { id: file.id },
        })

        deletedCount++
        totalSizeFreed += file.size
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `정리 완료: ${deletedCount}개 파일 삭제`,
      stats: {
        deleted: deletedCount,
        sizeFreed: `${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Cleanup cron error:', error)
    return handleError(error)
  }
}
