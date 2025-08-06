import { prisma } from '@/lib/core/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole } from '@prisma/client'
import { canModifyCommunityContent } from '@/lib/auth/roles'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/api/errors'

// GET /api/communities/[id]/announcements/[announcementId] - 공지사항 상세 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const resolvedParams = await params
    const { id: communityId, announcementId } = resolvedParams

    const announcement = await prisma.communityAnnouncement.findFirst({
      where: {
        id: announcementId,
        communityId,
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

    if (!announcement) {
      throw throwNotFoundError('공지사항을 찾을 수 없습니다.')
    }

    return successResponse({ announcement })
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/communities/[id]/announcements/[announcementId] - 공지사항 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const resolvedParams = await params
    const { id: communityId, announcementId } = resolvedParams

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
      select: { id: true },
    })

    if (!community) {
      throw throwNotFoundError('커뮤니티를 찾을 수 없습니다.')
    }

    const actualCommunityId = community.id

    // 멤버십 확인 (MEMBER 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MEMBER,
    ])
    if (session instanceof Response) {
      return session
    }

    const userId = session.session.user.id

    // 공지사항 조회
    const announcement = await prisma.communityAnnouncement.findFirst({
      where: {
        id: announcementId,
        communityId: actualCommunityId,
      },
    })

    if (!announcement) {
      throw throwNotFoundError('공지사항을 찾을 수 없습니다.')
    }

    // 수정 권한 확인
    const isAuthor = announcement.authorId === userId
    const canModify = canModifyCommunityContent(
      session.membership.role,
      isAuthor,
      announcement.authorRole
    )

    if (!canModify) {
      throw throwAuthorizationError('수정 권한이 없습니다.')
    }

    const body = await request.json()
    const { title, content, isPinned } = body

    const updated = await prisma.communityAnnouncement.update({
      where: { id: announcementId },
      data: {
        title: title?.trim() || announcement.title,
        content: content?.trim() || announcement.content,
        isPinned: isPinned !== undefined ? isPinned : announcement.isPinned,
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

    return successResponse({ announcement: updated })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/communities/[id]/announcements/[announcementId] - 공지사항 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const resolvedParams = await params
    const { id: communityId, announcementId } = resolvedParams

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id: communityId }, { slug: communityId }],
      },
      select: { id: true },
    })

    if (!community) {
      throw throwNotFoundError('커뮤니티를 찾을 수 없습니다.')
    }

    const actualCommunityId = community.id

    // 멤버십 확인 (MEMBER 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MEMBER,
    ])
    if (session instanceof Response) {
      return session
    }

    const userId = session.session.user.id

    // 공지사항 조회
    const announcement = await prisma.communityAnnouncement.findFirst({
      where: {
        id: announcementId,
        communityId: actualCommunityId,
      },
    })

    if (!announcement) {
      throw throwNotFoundError('공지사항을 찾을 수 없습니다.')
    }

    // 삭제 권한 확인
    const isAuthor = announcement.authorId === userId
    const canDelete = canModifyCommunityContent(
      session.membership.role,
      isAuthor,
      announcement.authorRole
    )

    if (!canDelete) {
      throw throwAuthorizationError('삭제 권한이 없습니다.')
    }

    await prisma.communityAnnouncement.delete({
      where: { id: announcementId },
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleError(error)
  }
}
