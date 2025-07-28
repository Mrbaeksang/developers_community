import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST: 커뮤니티 가입
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 멤버인지 확인
    if (community.members.length > 0) {
      const existingMember = community.members[0]

      if (existingMember.status === 'ACTIVE') {
        return NextResponse.json(
          { error: '이미 가입한 커뮤니티입니다.' },
          { status: 400 }
        )
      }

      if (existingMember.status === 'BANNED') {
        return NextResponse.json(
          { error: '이 커뮤니티에서 차단되었습니다.' },
          { status: 403 }
        )
      }

      if (existingMember.status === 'PENDING') {
        return NextResponse.json(
          { error: '가입 승인 대기 중입니다.' },
          { status: 400 }
        )
      }
    }

    // 비공개 커뮤니티는 PENDING 상태로, 공개 커뮤니티는 ACTIVE로
    const status = community.visibility === 'PRIVATE' ? 'PENDING' : 'ACTIVE'

    // 멤버 추가
    const membership = await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: id,
        status,
        role: 'MEMBER',
      },
    })

    // 공개 커뮤니티인 경우 멤버 수 증가
    if (status === 'ACTIVE') {
      await prisma.community.update({
        where: { id },
        data: { memberCount: { increment: 1 } },
      })
    }

    return NextResponse.json({
      message:
        community.visibility === 'PRIVATE'
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 멤버십 확인
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
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

    // 소유자는 탈퇴할 수 없음
    if (membership.community.ownerId === session.user.id) {
      return NextResponse.json(
        { error: '커뮤니티 소유자는 탈퇴할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 멤버십 삭제
    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: id,
        },
      },
    })

    // 멤버 수 감소
    if (membership.status === 'ACTIVE') {
      await prisma.community.update({
        where: { id },
        data: { memberCount: { decrement: 1 } },
      })
    }

    return NextResponse.json({ message: '커뮤니티에서 탈퇴했습니다.' })
  } catch (error) {
    console.error('Failed to leave community:', error)
    return NextResponse.json(
      { error: '커뮤니티 탈퇴에 실패했습니다.' },
      { status: 500 }
    )
  }
}
