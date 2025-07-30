import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkCommunityRole } from '@/lib/auth-helpers'
import { CommunityRole, MembershipStatus } from '@prisma/client'
import { z } from 'zod'

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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 본문 검증
    const body = await req.json()
    const { ban } = deleteMemberSchema.parse(body)

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 요청자의 권한 확인 (MODERATOR 이상)
    const roleCheck = await checkCommunityRole(
      session.user.id,
      id,
      CommunityRole.MODERATOR
    )
    if (roleCheck) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

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

    if (!targetMember || targetMember.communityId !== id) {
      return NextResponse.json(
        { error: '멤버를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // OWNER는 추방/차단할 수 없음
    if (targetMember.role === CommunityRole.OWNER) {
      return NextResponse.json(
        { error: '소유자는 추방할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 자기 자신은 추방할 수 없음
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { error: '자신을 추방할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 요청자의 역할 가져오기
    const requesterMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: id,
        },
      },
      select: { role: true },
    })

    if (!requesterMember) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
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
      return NextResponse.json(
        { error: '동일하거나 상위 역할의 멤버는 추방할 수 없습니다.' },
        { status: 403 }
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

    return NextResponse.json({
      message: ban ? '멤버가 차단되었습니다.' : '멤버가 추방되었습니다.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
    }

    console.error('Failed to kick/ban member:', error)
    return NextResponse.json({ error: '작업에 실패했습니다.' }, { status: 500 })
  }
}
