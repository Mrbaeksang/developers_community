import { prisma } from '@/lib/core/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole } from '@prisma/client'
import { successResponse } from '@/lib/api/response'
import { handleError, throwValidationError } from '@/lib/api/errors'

// GET /api/communities/[id]/announcements - 공지사항 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const communityId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // 공지사항 조회 (고정된 것 먼저, 최신순)
    const [announcements, total] = await Promise.all([
      prisma.communityAnnouncement.findMany({
        where: { communityId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.communityAnnouncement.count({
        where: { communityId },
      }),
    ])

    return successResponse({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/communities/[id]/announcements - 공지사항 작성 (관리자만)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const communityId = resolvedParams.id

    // 관리자 권한 확인 (MODERATOR 이상)
    const session = await requireCommunityRoleAPI(communityId, [
      CommunityRole.MODERATOR,
    ])
    if (session instanceof Response) {
      return session
    }

    const body = await request.json()
    const { title, content, isPinned = false } = body

    if (!title?.trim() || !content?.trim()) {
      throw throwValidationError('제목과 내용은 필수입니다.')
    }

    const announcement = await prisma.communityAnnouncement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        communityId,
        authorId: session.session.user.id,
        authorRole: session.membership.role, // 작성 시점의 역할 저장
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return successResponse({ announcement }, undefined, 201)
  } catch (error) {
    return handleError(error)
  }
}
