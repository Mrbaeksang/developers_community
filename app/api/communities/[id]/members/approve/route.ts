import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth, canManageCommunity } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notifications'
import { MembershipStatus } from '@prisma/client'

// POST: 가입 승인 (비공개 커뮤니티)
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // 인증 확인
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { userIds } = await req.json()

    // 커뮤니티 관리 권한 확인
    const canManage = await canManageCommunity(session.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { error: '가입 승인 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 커뮤니티 정보 조회
    const community = await prisma.community.findUnique({
      where: { id },
      select: { name: true, visibility: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 대기 중인 멤버십 확인
    const pendingMembers = await prisma.communityMember.findMany({
      where: {
        communityId: id,
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
      return NextResponse.json(
        { error: '승인 대기 중인 멤버가 없습니다.' },
        { status: 400 }
      )
    }

    // 승인 처리
    const [updated] = await prisma.$transaction([
      prisma.communityMember.updateMany({
        where: {
          communityId: id,
          userId: { in: pendingMembers.map((m) => m.userId) },
          status: MembershipStatus.PENDING,
        },
        data: {
          status: MembershipStatus.ACTIVE,
        },
      }),
      // 멤버 수 증가
      prisma.community.update({
        where: { id },
        data: { memberCount: { increment: pendingMembers.length } },
      }),
    ])

    // 알림 전송
    await Promise.all(
      pendingMembers.map((member) =>
        createNotification({
          userId: member.userId,
          type: 'COMMUNITY_JOIN',
          senderId: session.user.id,
          title: '커뮤니티 가입 승인',
          message: `${community.name} 커뮤니티 가입이 승인되었습니다.`,
          resourceIds: { communityId: id },
        })
      )
    )

    return NextResponse.json({
      message: `${updated.count}명의 가입이 승인되었습니다.`,
      approved: pendingMembers.map((m) => ({
        userId: m.userId,
        userName: m.user.name,
      })),
    })
  } catch (error) {
    console.error('Failed to approve members:', error)
    return NextResponse.json(
      { error: '멤버 승인에 실패했습니다.' },
      { status: 500 }
    )
  }
}
