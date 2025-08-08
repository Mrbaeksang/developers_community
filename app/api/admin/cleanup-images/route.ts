import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { del } from '@vercel/blob'
import { requireRole } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'

// 30일 이상 접근하지 않은 이미지 정리
const CLEANUP_DAYS = 30

export async function POST(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Promise<Record<string, string | string[]>> }
) {
  try {
    // ADMIN 권한 체크 - requireRole은 배열을 받음
    const roleCheck = await requireRole(['ADMIN'])
    if (roleCheck instanceof Response) {
      return roleCheck
    }

    // 30일 이상 된 미사용 파일 찾기
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_DAYS)

    // 게시글에 연결되지 않은 파일 찾기 (File 모델은 CommunityPost만 지원)
    const unusedFiles = await prisma.file.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // 게시글에 연결되지 않은 파일
        postId: null,
        // 채팅 메시지에도 연결되지 않은 파일
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

    // Vercel Blob에서 파일 삭제
    const deletedFiles = []
    const failedFiles = []
    let totalSizeFreed = 0

    for (const file of unusedFiles) {
      try {
        // Blob URL에서 삭제
        if (file.url) {
          await del(file.url, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
        }

        // DB에서 삭제
        await prisma.file.delete({
          where: { id: file.id },
        })

        deletedFiles.push({
          id: file.id,
          filename: file.filename,
          size: file.size,
        })
        totalSizeFreed += file.size
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error)
        failedFiles.push({
          id: file.id,
          filename: file.filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // 로그 출력 (systemLog 모델이 없으므로 콘솔로 대체)
    // eslint-disable-next-line no-console
    console.log('Image cleanup completed:', {
      type: 'IMAGE_CLEANUP',
      message: `Cleaned up ${deletedFiles.length} unused images`,
      metadata: {
        deletedCount: deletedFiles.length,
        failedCount: failedFiles.length,
        totalSizeFreed,
        cutoffDate: cutoffDate.toISOString(),
      },
    })

    return successResponse({
      message: '이미지 정리 완료',
      stats: {
        totalFound: unusedFiles.length,
        deleted: deletedFiles.length,
        failed: failedFiles.length,
        sizeFreed: `${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`,
      },
      deletedFiles: deletedFiles.slice(0, 10), // 처음 10개만 표시
      failedFiles,
    })
  } catch (error) {
    return handleError(error)
  }
}

// Vercel Cron으로 매일 새벽 3시에 실행하려면:
// vercel.json에 추가:
// {
//   "crons": [{
//     "path": "/api/admin/cleanup-images",
//     "schedule": "0 3 * * *"
//   }]
// }
