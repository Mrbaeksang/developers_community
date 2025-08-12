import { NextRequest } from 'next/server'
import { prisma } from '@/lib/core/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth/session'
import { CommunityRole, MembershipStatus } from '@prisma/client'
import { z } from 'zod'
import { successResponse, validationErrorResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
} from '@/lib/api/errors'

// 추방/차단 요청 스키마
const deleteMemberSchema = z.object({
  ban: z.boolean().optional().default(false),
})

// DELETE: 멤버 추방 또는 차단
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await context.params

    // 커뮤니티 확인 (ID 또는 slug로 찾기)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
      },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    // 요청자의 권한 확인 (MODERATOR 이상 - OWNER, ADMIN, MODERATOR)
    const session = await requireCommunityRoleAPI(community.id, [
      CommunityRole.OWNER,
      CommunityRole.ADMIN,
      CommunityRole.MODERATOR,
    ])
    if (session instanceof Response) {
      return session
    }

    // 요청 본문 검증
    const body = await req.json()
    const validation = deleteMemberSchema.safeParse(body)

    if (!validation.success) {
      const errors: Record<string, string[]> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })
      return validationErrorResponse(errors)
    }

    const { ban } = validation.data

    // 대상 멤버 확인
    const targetMember = await prisma.communityMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!targetMember || targetMember.communityId !== community.id) {
      throwNotFoundError('멤버를 찾을 수 없습니다')
    }

    // OWNER는 추방/차단할 수 없음
    if (targetMember.role === CommunityRole.OWNER) {
      throwAuthorizationError('소유자는 추방할 수 없습니다')
    }

    // 자기 자신은 추방할 수 없음
    if (targetMember.userId === session.session.user.id) {
      throwAuthorizationError('자신을 추방할 수 없습니다')
    }

    // 요청자의 역할은 이미 requireCommunityRoleAPI에서 확인됨
    const requesterMember = session.membership

    if (!requesterMember) {
      throwAuthorizationError('권한이 없습니다')
    }

    // 역할 계층 확인 (상위 역할만 하위 역할을 추방할 수 있음)
    const roleHierarchy = {
      [CommunityRole.OWNER]: 4,
      [CommunityRole.ADMIN]: 3,
      [CommunityRole.MODERATOR]: 2,
      [CommunityRole.MEMBER]: 1,
    }

    if (
      roleHierarchy[requesterMember.role] <= roleHierarchy[targetMember.role]
    ) {
      throwAuthorizationError(
        '동일하거나 상위 역할의 멤버는 추방할 수 없습니다'
      )
    }

    if (ban) {
      // 차단: 멤버십 상태를 BANNED로 변경
      await prisma.communityMember.update({
        where: { id: memberId },
        data: {
          status: MembershipStatus.BANNED,
          bannedAt: new Date(),
          bannedReason: '커뮤니티 규칙 위반',
        },
      })

      // TODO: 알림 생성 - 차단되었음을 알림
    } else {
      // 추방: 멤버십 삭제
      await prisma.communityMember.delete({
        where: { id: memberId },
      })

      // TODO: 알림 생성 - 추방되었음을 알림
    }

    return successResponse(
      {},
      ban ? '멤버가 차단되었습니다' : '멤버가 추방되었습니다'
    )
  } catch (error) {
    return handleError(error)
  }
}
