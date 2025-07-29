import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { checkAuth, checkCommunityMembership } from '@/lib/auth-helpers'
import { canModifyCommunityContent } from '@/lib/role-hierarchy'

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
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('공지사항 조회 실패:', error)
    return NextResponse.json(
      { error: '공지사항 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT /api/communities/[id]/announcements/[announcementId] - 공지사항 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const session = await auth()
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { id: communityId, announcementId } = resolvedParams
    const userId = session.user.id

    // 커뮤니티 멤버십 확인
    try {
      await checkCommunityMembership(userId, communityId)
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 현재 사용자의 커뮤니티 역할 확인
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 공지사항 조회
    const announcement = await prisma.communityAnnouncement.findFirst({
      where: {
        id: announcementId,
        communityId,
      },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 수정 권한 확인
    const isAuthor = announcement.authorId === userId
    const canModify = canModifyCommunityContent(
      membership.role,
      isAuthor,
      announcement.authorRole
    )

    if (!canModify) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
      )
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

    return NextResponse.json({ announcement: updated })
  } catch (error) {
    console.error('공지사항 수정 실패:', error)
    return NextResponse.json(
      { error: '공지사항 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/communities/[id]/announcements/[announcementId] - 공지사항 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; announcementId: string }> }
) {
  try {
    const session = await auth()
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const { id: communityId, announcementId } = resolvedParams
    const userId = session.user.id

    // 커뮤니티 멤버십 확인
    try {
      await checkCommunityMembership(userId, communityId)
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 현재 사용자의 커뮤니티 역할 확인
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: { role: true },
    })

    if (!membership) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 공지사항 조회
    const announcement = await prisma.communityAnnouncement.findFirst({
      where: {
        id: announcementId,
        communityId,
      },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: '공지사항을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 삭제 권한 확인
    const isAuthor = announcement.authorId === userId
    const canDelete = canModifyCommunityContent(
      membership.role,
      isAuthor,
      announcement.authorRole
    )

    if (!canDelete) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    await prisma.communityAnnouncement.delete({
      where: { id: announcementId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('공지사항 삭제 실패:', error)
    return NextResponse.json(
      { error: '공지사항 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
