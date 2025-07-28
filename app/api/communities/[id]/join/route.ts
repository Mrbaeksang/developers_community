import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkAuth, checkCommunityBan } from '@/lib/auth-helpers'
import { createNotification } from '@/lib/notifications'
import {
  MembershipStatus,
  CommunityVisibility,
  CommunityRole,
} from '@prisma/client'

// POST: 커뮤니티 가입
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    const userId = session!.user.id

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        visibility: true,
        ownerId: true,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 멤버인지 확인
    const existingMember = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: id,
        },
      },
    })

    if (existingMember) {
      // 상태에 따른 처리
      if (existingMember.status === MembershipStatus.ACTIVE) {
        return NextResponse.json(
          { error: '이미 가입한 커뮤니티입니다.' },
          { status: 400 }
        )
      }

      if (existingMember.status === MembershipStatus.PENDING) {
        return NextResponse.json(
          { error: '가입 승인 대기 중입니다.' },
          { status: 400 }
        )
      }

      if (existingMember.status === MembershipStatus.BANNED) {
        // Ban 체크
        const banError = await checkCommunityBan(userId, id)
        if (banError) return banError

        // Ban이 해제된 경우 재가입 가능
        await prisma.communityMember.update({
          where: { id: existingMember.id },
          data: {
            status:
              community.visibility === CommunityVisibility.PUBLIC
                ? MembershipStatus.ACTIVE
                : MembershipStatus.PENDING,
            bannedAt: null,
            bannedReason: null,
            bannedUntil: null,
            joinedAt: new Date(),
          },
        })
      }

      if (existingMember.status === MembershipStatus.LEFT) {
        // 재가입
        await prisma.communityMember.update({
          where: { id: existingMember.id },
          data: {
            status:
              community.visibility === CommunityVisibility.PUBLIC
                ? MembershipStatus.ACTIVE
                : MembershipStatus.PENDING,
            joinedAt: new Date(),
          },
        })
      }
    }

    if (!existingMember) {
      // 새로운 멤버 생성
      const newStatus =
        community.visibility === CommunityVisibility.PUBLIC
          ? MembershipStatus.ACTIVE
          : MembershipStatus.PENDING

      await prisma.communityMember.create({
        data: {
          userId,
          communityId: id,
          status: newStatus,
          role: CommunityRole.MEMBER,
        },
      })

      // 멤버 수 증가 (PUBLIC 커뮤니티만)
      if (community.visibility === CommunityVisibility.PUBLIC) {
        await prisma.community.update({
          where: { id },
          data: { memberCount: { increment: 1 } },
        })
      }

      // PRIVATE 커뮤니티의 경우 오너에게 알림
      if (community.visibility === CommunityVisibility.PRIVATE) {
        await createNotification({
          userId: community.ownerId,
          type: 'COMMUNITY_JOIN',
          senderId: userId,
          title: '커뮤니티 가입 요청',
          message: `${session!.user.name || '사용자'}님이 ${community.name} 커뮤니티 가입을 요청했습니다.`,
          resourceIds: { communityId: id },
        })
      }
    }

    // 현재 멤버십 정보 조회
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: id,
        },
      },
      select: {
        id: true,
        role: true,
        status: true,
        joinedAt: true,
      },
    })

    return NextResponse.json({
      message:
        community.visibility === CommunityVisibility.PRIVATE
          ? '가입 신청이 완료되었습니다. 승인을 기다려주세요.'
          : '커뮤니티에 가입했습니다.',
      membership,
    })
  } catch (error) {
    console.error('Failed to join community:', error)
    return NextResponse.json(
      { error: '커뮤니티 가입에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 커뮤니티 탈퇴
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    const userId = session!.user.id

    // 멤버십 확인
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId: id,
        },
      },
      include: {
        community: {
          select: { ownerId: true },
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: '가입하지 않은 커뮤니티입니다.' },
        { status: 404 }
      )
    }

    // ACTIVE 상태가 아니면 탈퇴 불가
    if (membership.status !== MembershipStatus.ACTIVE) {
      const statusMessages = {
        [MembershipStatus.PENDING]: '아직 가입 승인이 되지 않았습니다.',
        [MembershipStatus.BANNED]: '차단된 상태에서는 탈퇴할 수 없습니다.',
        [MembershipStatus.LEFT]: '이미 탈퇴한 커뮤니티입니다.',
      }

      return NextResponse.json(
        {
          error:
            statusMessages[membership.status] || '탈퇴할 수 없는 상태입니다.',
        },
        { status: 400 }
      )
    }

    // 소유자는 탈퇴할 수 없음
    if (membership.community.ownerId === userId) {
      return NextResponse.json(
        {
          error:
            '커뮤니티 소유자는 탈퇴할 수 없습니다. 소유권을 이전하거나 커뮤니티를 삭제해주세요.',
        },
        { status: 400 }
      )
    }

    // 멤버십 상태를 LEFT로 변경 (소프트 삭제)
    await prisma.communityMember.update({
      where: {
        userId_communityId: {
          userId,
          communityId: id,
        },
      },
      data: {
        status: MembershipStatus.LEFT,
        role: CommunityRole.MEMBER, // 역할 초기화
      },
    })

    // 멤버 수 감소
    await prisma.community.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    })

    return NextResponse.json({
      message: '커뮤니티에서 탈퇴했습니다.',
      membership: {
        status: MembershipStatus.LEFT,
      },
    })
  } catch (error) {
    console.error('Failed to leave community:', error)
    return NextResponse.json(
      { error: '커뮤니티 탈퇴에 실패했습니다.' },
      { status: 500 }
    )
  }
}
