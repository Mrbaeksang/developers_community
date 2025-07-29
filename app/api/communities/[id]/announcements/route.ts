import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { checkAuth, checkCommunityMembership } from '@/lib/auth-helpers'
import { canCreateAnnouncement } from '@/lib/permission-helpers'

// GET /api/communities/[id]/announcements - 공지사항 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const communityId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // 공지사항 조회 (고정된 것 먼저, 최신순)
    const [announcements, total] = await Promise.all([
      prisma.communityAnnouncement.findMany({
        where: { communityId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.communityAnnouncement.count({
        where: { communityId },
      }),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('공지사항 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '공지사항 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[id]/announcements - 공지사항 작성 (관리자만)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
    const communityId = resolvedParams.id
    const userId = session.user.id

    // 커뮤니티 멤버십 확인
    let membership
    try {
      membership = await checkCommunityMembership(userId, communityId)
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 관리자 권한 확인 (OWNER, ADMIN, MODERATOR 가능)
    if (!canCreateAnnouncement(membership.role)) {
      return NextResponse.json(
        { error: '공지사항 작성 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, isPinned = false } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: '제목과 내용은 필수입니다.' },
        { status: 400 }
      )
    }

    const announcement = await prisma.communityAnnouncement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        communityId,
        authorId: userId,
        authorRole: membership.role, // 작성 시점의 역할 저장
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

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('공지사항 작성 실패:', error)
    return NextResponse.json(
      { error: '공지사항 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
