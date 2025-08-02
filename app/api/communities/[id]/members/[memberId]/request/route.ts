import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCommunityRoleAPI } from '@/lib/auth-utils'
import { CommunityRole, MembershipStatus } from '@prisma/client'
import { z } from 'zod'

// 가입 신청 처리 스키마
const handleRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
})

// PATCH: 가입 신청 승인/거절
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id, memberId } = await context.params

    // 요청자의 권한 확인 (MODERATOR 이상)
    const session = await requireCommunityRoleAPI(id, [CommunityRole.MODERATOR])
    if (session instanceof NextResponse) {
      return session
    }

    // 요청 본문 검증
    const body = await req.json()
    const { action } = handleRequestSchema.parse(body)

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 대상 멤버 확인 (PENDING 상태여야 함)
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

    if (!targetMember || targetMember.communityId !== id) {
      return NextResponse.json(
        { error: '가입 신청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (targetMember.status !== MembershipStatus.PENDING) {
      return NextResponse.json(
        { error: '이미 처리된 가입 신청입니다.' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // 승인: PENDING -> ACTIVE
      const updatedMember = await prisma.communityMember.update({
        where: { id: memberId },
        data: {
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
            },
          },
        },
      })

      // TODO: 알림 생성 - 가입이 승인되었음을 알림
      // await prisma.notification.create({
      //   data: {
      //     userId: targetMember.userId,
      //     type: 'COMMUNITY_JOIN_APPROVED',
      //     content: `${community.name} 커뮤니티 가입이 승인되었습니다.`,
      //     relatedCommunityId: id,
      //   },
      // })

      return NextResponse.json({
        message: '가입 신청이 승인되었습니다.',
        member: {
          id: updatedMember.id,
          userId: updatedMember.userId,
          role: updatedMember.role,
          status: updatedMember.status,
          joinedAt: updatedMember.joinedAt,
          user: {
            id: updatedMember.user.id,
            name: updatedMember.user.name || undefined,
            username: updatedMember.user.username || undefined,
            email: updatedMember.user.email,
            image: updatedMember.user.image || undefined,
          },
        },
      })
    } else {
      // 거절: 멤버십 삭제
      await prisma.communityMember.delete({
        where: { id: memberId },
      })

      // TODO: 알림 생성 - 가입이 거절되었음을 알림
      // await prisma.notification.create({
      //   data: {
      //     userId: targetMember.userId,
      //     type: 'COMMUNITY_JOIN_REJECTED',
      //     content: `${community.name} 커뮤니티 가입이 거절되었습니다.`,
      //     relatedCommunityId: id,
      //   },
      // })

      return NextResponse.json({
        message: '가입 신청이 거절되었습니다.',
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    console.error('Failed to handle join request:', error)
    return NextResponse.json(
      { error: '가입 신청 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
