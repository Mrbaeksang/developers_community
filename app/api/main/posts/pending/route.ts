import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { successResponse, errorResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'
import { formatTimeAgo } from '@/lib/date-utils'
import {
  getCursorCondition,
  formatCursorResponse,
} from '@/lib/pagination-utils'
import { mainPostSelect } from '@/lib/prisma-select-patterns'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (
      !user ||
      (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')
    ) {
      return errorResponse('승인 권한이 없습니다.', 403)
    }

    // URL 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const cursor = searchParams.get('cursor')
    const cursorCondition = getCursorCondition(cursor)

    // 승인 대기 게시글 조회 - 선택적 필드 로딩 적용
    const pendingPosts = await prisma.mainPost.findMany({
      where: {
        status: 'PENDING',
        ...cursorCondition,
      },
      select: {
        ...mainPostSelect.detail, // 상세 정보 포함 (관리자용)
        authorRole: true, // 작성자 역할 추가
        metaTitle: true,
        metaDescription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1, // 다음 페이지 확인용
    })

    // 페이지네이션 처리
    const hasMore = pendingPosts.length > limit
    const posts = hasMore ? pendingPosts.slice(0, -1) : pendingPosts

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      thumbnail: post.thumbnail,
      thumbnailBlur: post.thumbnailBlur,
      createdAt: post.createdAt, // Date 객체 유지
      timeAgo: formatTimeAgo(post.createdAt),
      author: {
        id: post.author.id,
        name: post.author.name || 'Unknown',
        email: post.author.email,
        image: post.author.image || undefined,
        role: post.author.role,
      },
      authorRole: post.authorRole,
      category: post.category,
      tags: post.tags.map((t) => t.tag),
      _count: post._count,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    }))

    return successResponse(formatCursorResponse(formattedPosts, limit))
  } catch (error) {
    return handleError(error)
  }
}
