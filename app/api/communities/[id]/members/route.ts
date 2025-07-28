import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: 커뮤니티 멤버 목록 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: { id: true, visibility: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 비공개 커뮤니티 접근 확인
    if (community.visibility === 'PRIVATE') {
      const membership = session?.user?.id
        ? await prisma.communityMember.findUnique({
            where: {
              userId_communityId: {
                userId: session.user.id,
                communityId: id,
              },
            },
          })
        : null

      if (!membership || membership.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: '비공개 커뮤니티입니다.' },
          { status: 403 }
        )
      }
    }

    // 멤버 필터 조건
    const where: {
      communityId: string
      status: 'ACTIVE'
      role?: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
      user?: {
        OR: Array<{
          name?: { contains: string; mode: 'insensitive' }
          username?: { contains: string; mode: 'insensitive' }
        }>
      }
    } = {
      communityId: id,
      status: 'ACTIVE',
    }

    if (role) {
      where.role = role as 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
    }

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    // 멤버 조회
    const [members, total] = await Promise.all([
      prisma.communityMember.findMany({
        where,
        orderBy: [
          { role: 'asc' }, // OWNER -> ADMIN -> MODERATOR -> MEMBER 순
          { joinedAt: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              bio: true,
              _count: {
                select: {
                  communityPosts: {
                    where: {
                      communityId: id,
                    },
                  },
                  communityComments: {
                    where: {
                      post: {
                        communityId: id,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.communityMember.count({ where }),
    ])

    // 멤버 정보 포맷팅
    const formattedMembers = members.map((member) => ({
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        id: member.user.id,
        name: member.user.name || undefined,
        username: member.user.username || undefined,
        image: member.user.image || undefined,
        bio: member.user.bio || undefined,
        postCount: member.user._count.communityPosts,
        commentCount: member.user._count.communityComments,
      },
    }))

    return NextResponse.json({
      members: formattedMembers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Failed to fetch community members:', error)
    return NextResponse.json(
      { error: '멤버 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}