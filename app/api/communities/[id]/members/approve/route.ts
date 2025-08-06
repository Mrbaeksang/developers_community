import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole, MembershipStatus } from '@prisma/client'
import { createNotification } from '@/lib/notifications'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwValidationError,
} from '@/lib/api/errors'

// POST: 가입 승인 (비공개 커뮤니티)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    const actualCommunityId = community.id

    // 관리자 권한 확인 (MODERATOR 이상)
    const session = await requireCommunityRoleAPI(actualCommunityId, [
      CommunityRole.MODERATOR,
    ])
    if (session instanceof Response) {
      return session
    }

    const { userIds } = await req.json()

    // 커뮤니티 정보 조회
    const communityInfo = await prisma.community.findUnique({
      where: { id: actualCommunityId },
      select: { name: true, visibility: true },
    })

    if (!communityInfo) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 대기 중인 멤버십 확인
    const pendingMembers = await prisma.communityMember.findMany({
      where: {
        communityId: actualCommunityId,
        userId: { in: userIds },
        status: MembershipStatus.PENDING,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    })

    if (pendingMembers.length === 0) {
      throwValidationError('승인 대기 중인 멤버가 없습니다')
    }

    // 승인 처리
    const [updated] = await prisma.$transaction([
      prisma.communityMember.updateMany({
        where: {
          communityId: actualCommunityId,
          userId: { in: pendingMembers.map((m) => m.userId) },
          status: MembershipStatus.PENDING,
        },
        data: {
          status: MembershipStatus.ACTIVE,
        },
      }),
      // 멤버 수 증가
      prisma.community.update({
        where: { id: actualCommunityId },
        data: { memberCount: { increment: pendingMembers.length } },
      }),
    ])

    // 알림 전송
    await Promise.all(
      pendingMembers.map((member) =>
        createNotification({
          userId: member.userId,
          type: 'COMMUNITY_JOIN',
          senderId: session.session.user.id,
          title: '커뮤니티 가입 승인',
          message: `${communityInfo.name} 커뮤니티 가입이 승인되었습니다.`,
          resourceIds: { communityId: actualCommunityId },
        })
      )
    )

    return successResponse(
      {
        approved: pendingMembers.map((m) => ({
          userId: m.userId,
          userName: m.user.name,
        })),
      },
      `${updated.count}명의 가입이 승인되었습니다`
    )
  } catch (error) {
    return handleError(error)
  }
}
