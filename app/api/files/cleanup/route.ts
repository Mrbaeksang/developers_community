import { NextResponse } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { del } from '@vercel/blob'
import { successResponse } from '@/lib/api/response'
import { handleError } from '@/lib/api/errors'
import { requireRoleAPI } from '@/lib/auth/session'

// 파일 정리 배치 작업 - POST /api/files/cleanup
export async function POST() {
  try {
    // 관리자 권한 확인
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof NextResponse) {
      return session
    }

    const now = new Date()
    const cleanupResults = {
      orphanedFiles: 0,
      oldUnusedFiles: 0,
      deletedPostFiles: 0,
      errors: [] as string[],
    }

    // 1. 고아 파일 찾기 (게시글에 연결되지 않은 파일, 24시간 이상 된 것)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const orphanedFiles = await prisma.file.findMany({
      where: {
        postId: null,
        createdAt: {
          lt: oneDayAgo,
        },
      },
      select: {
        id: true,
        storedName: true,
      },
    })

    // 2. 오래된 미사용 파일 (30일 이상, 게시글 연결 없음)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const oldUnusedFiles = await prisma.file.findMany({
      where: {
        postId: null,
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
        storedName: true,
      },
    })

    // 3. 삭제된 게시글의 파일 (7일 이상 된 것)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const deletedPostFiles = await prisma.file.findMany({
      where: {
        post: {
          status: 'DELETED',
          updatedAt: {
            lt: sevenDaysAgo,
          },
        },
      },
      select: {
        id: true,
        storedName: true,
      },
    })

    // 파일 삭제 처리
    const filesToDelete = [
      ...orphanedFiles.map((f) => ({ ...f, type: 'orphaned' })),
      ...oldUnusedFiles.map((f) => ({ ...f, type: 'oldUnused' })),
      ...deletedPostFiles.map((f) => ({ ...f, type: 'deletedPost' })),
    ]

    // 중복 제거
    const uniqueFiles = filesToDelete.filter(
      (file, index, self) => index === self.findIndex((f) => f.id === file.id)
    )

    // 배치로 삭제 처리
    for (const file of uniqueFiles) {
      try {
        // Vercel Blob에서 삭제
        try {
          await del(file.storedName, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          })
        } catch (blobError) {
          console.error('Blob deletion error:', blobError)
        }

        // DB에서 삭제
        await prisma.file.delete({
          where: { id: file.id },
        })

        // 통계 업데이트
        switch (file.type) {
          case 'orphaned':
            cleanupResults.orphanedFiles++
            break
          case 'oldUnused':
            cleanupResults.oldUnusedFiles++
            break
          case 'deletedPost':
            cleanupResults.deletedPostFiles++
            break
        }
      } catch {
        cleanupResults.errors.push(`Failed to delete file ${file.id}`)
      }
    }

    // 스토리지 사용량 계산
    const remainingFiles = await prisma.file.aggregate({
      _sum: {
        size: true,
      },
      _count: true,
    })

    const totalSizeGB = (remainingFiles._sum.size || 0) / (1024 * 1024 * 1024)
    const monthlyCost = totalSizeGB * 0.15 // $0.15/GB/month

    return successResponse({
      cleanupResults,
      storage: {
        totalFiles: remainingFiles._count,
        totalSizeGB: totalSizeGB.toFixed(2),
        estimatedMonthlyCost: `$${monthlyCost.toFixed(2)}`,
      },
      message: `정리 완료: ${
        cleanupResults.orphanedFiles +
        cleanupResults.oldUnusedFiles +
        cleanupResults.deletedPostFiles
      }개 파일 삭제`,
    })
  } catch (error) {
    return handleError(error)
  }
}

// 스토리지 사용량 조회 - GET /api/files/cleanup
export async function GET() {
  try {
    // 관리자 권한 확인
    const session = await requireRoleAPI(['ADMIN'])
    if (session instanceof NextResponse) {
      return session
    }

    // 전체 파일 통계
    const totalStats = await prisma.file.aggregate({
      _sum: {
        size: true,
      },
      _count: true,
    })

    // 카테고리별 통계
    const orphanedCount = await prisma.file.count({
      where: {
        postId: null,
      },
    })

    const postFilesCount = await prisma.file.count({
      where: {
        postId: {
          not: null,
        },
      },
    })

    // 타입별 통계
    const typeStats = await prisma.file.groupBy({
      by: ['type'],
      _count: true,
      _sum: {
        size: true,
      },
    })

    const totalSizeGB = (totalStats._sum.size || 0) / (1024 * 1024 * 1024)
    const monthlyCost = totalSizeGB * 0.15

    return successResponse({
      summary: {
        totalFiles: totalStats._count,
        totalSizeGB: totalSizeGB.toFixed(2),
        estimatedMonthlyCost: `$${monthlyCost.toFixed(2)}`,
      },
      usage: {
        orphanedFiles: orphanedCount,
        postFiles: postFilesCount,
      },
      byType: typeStats.map((stat) => ({
        type: stat.type,
        count: stat._count,
        sizeGB: ((stat._sum.size || 0) / (1024 * 1024 * 1024)).toFixed(2),
      })),
    })
  } catch (error) {
    return handleError(error)
  }
}
