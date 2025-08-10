import { prisma } from '@/lib/core/prisma'
import { requireAuthAPI } from '@/lib/auth/session'
import { successResponse } from '@/lib/api/response'
import {
  handleError,
  throwNotFoundError,
  throwAuthorizationError,
  throwValidationError,
} from '@/lib/api/errors'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuthAPI()
    if (session instanceof Response) {
      return session
    }

    const { id } = await params
    const { newOwnerEmail } = await req.json()

    if (!newOwnerEmail) {
      throwValidationError('새 소유자의 이메일을 입력해주세요')
    }

    // 커뮤니티 확인 및 현재 사용자가 소유자인지 확인
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!community) {
      throwNotFoundError('커뮤니티를 찾을 수 없습니다')
    }

    const currentMembership = community.members[0]
    if (!currentMembership || currentMembership.role !== 'OWNER') {
      throwAuthorizationError('소유권을 이전할 권한이 없습니다')
    }

    // 새 소유자 찾기
    const newOwner = await prisma.user.findUnique({
      where: { email: newOwnerEmail },
    })

    if (!newOwner) {
      throwNotFoundError('해당 이메일의 사용자를 찾을 수 없습니다')
    }

    // 새 소유자가 이미 멤버인지 확인
    const newOwnerMembership = await prisma.communityMember.findFirst({
      where: {
        communityId: id,
        userId: newOwner.id,
      },
    })

    if (!newOwnerMembership) {
      throwValidationError('새 소유자는 커뮤니티 멤버여야 합니다')
    }

    if (newOwnerMembership && newOwnerMembership.status !== 'ACTIVE') {
      throwValidationError('새 소유자는 활성 멤버여야 합니다')
    }

    // 트랜잭션으로 소유권 이전
    await prisma.$transaction([
      // 새 소유자를 OWNER로 변경
      prisma.communityMember.updateMany({
        where: {
          communityId: id,
          userId: newOwner.id,
        },
        data: { role: 'OWNER' },
      }),
      // 현재 소유자를 ADMIN으로 변경
      prisma.communityMember.updateMany({
        where: {
          communityId: id,
          userId: session.user.id,
        },
        data: { role: 'ADMIN' },
      }),
      // 커뮤니티 소유자 변경
      prisma.community.update({
        where: { id },
        data: { ownerId: newOwner.id },
      }),
    ])

    return successResponse(
      { transferred: true },
      '소유권이 성공적으로 이전되었습니다'
    )
  } catch (error) {
    return handleError(error)
  }
}
