import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  checkAuth,
  checkMembership,
  canManageCommunity,
} from '@/lib/auth-helpers'
import { CommunityVisibility, MembershipStatus } from '@prisma/client'

// GET: 커뮤니티 상세 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // 커뮤니티 조회 - id로 먼저 찾고, 없으면 slug로 찾기
    let community = await prisma.community.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            icon: true,
          },
        },
        announcements: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 10,
          select: {
            id: true,
            title: true,
            content: true,
            isPinned: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { members: true, posts: true },
        },
        // 현재 사용자의 멤버십 상태 확인
        members: session?.user?.id
          ? {
              where: { userId: session.user.id },
              select: { role: true, status: true },
            }
          : false,
      },
    })

    if (!community) {
      // slug로 다시 시도
      community = await prisma.community.findUnique({
        where: { slug: id },
        include: {
          owner: {
            select: { id: true, name: true, email: true, image: true },
          },
          _count: {
            select: { members: true, posts: true },
          },
          categories: {
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              color: true,
              icon: true,
            },
          },
          announcements: {
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            take: 10,
            select: {
              id: true,
              title: true,
              content: true,
              isPinned: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
          // 현재 사용자의 멤버십 상태 확인
          members: session?.user?.id
            ? {
                where: { userId: session.user.id },
                select: { role: true, status: true },
              }
            : false,
        },
      })

      if (!community) {
        return NextResponse.json(
          { error: '커뮤니티를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    }

    // 비공개 커뮤니티 접근 제한
    if (community.visibility === CommunityVisibility.PRIVATE) {
      if (session?.user?.id) {
        // 로그인한 경우, 멤버십 확인
        const membershipError = await checkMembership(
          session.user.id,
          community.id
        )
        // 멤버가 아니고 오너도 아닌 경우
        if (membershipError && community.ownerId !== session.user.id) {
          return NextResponse.json(
            { error: '비공개 커뮤니티입니다.' },
            { status: 403 }
          )
        }
      } else {
        // 로그인하지 않은 경우
        return NextResponse.json(
          { error: '비공개 커뮤니티입니다.' },
          { status: 403 }
        )
      }
    }

    // 현재 사용자의 멤버십 정보 추출
    const currentMembership =
      'members' in community && Array.isArray(community.members)
        ? community.members[0] || null
        : null
    const { ...communityData } = community

    // 공지사항 가져오기 (고정된 것들만)
    const announcements = await prisma.communityAnnouncement.findMany({
      where: {
        communityId: community.id,
        isPinned: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...communityData,
      currentMembership,
      announcements,
      isOwner: session?.user?.id === community.ownerId,
      isMember: currentMembership?.status === MembershipStatus.ACTIVE,
      canPost:
        currentMembership?.status === MembershipStatus.ACTIVE ||
        session?.user?.id === community.ownerId,
    })
  } catch (error) {
    console.error('Failed to fetch community:', error)
    return NextResponse.json(
      { error: '커뮤니티 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PUT: 커뮤니티 수정 (소유자만)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // 인증 확인
    const authError = checkAuth(session)
    if (authError) return authError

    // 커뮤니티 관리 권한 확인
    const canManage = await canManageCommunity(session!.user.id, id)
    if (!canManage) {
      return NextResponse.json(
        { error: '커뮤니티를 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, rules, visibility } = body

    // 커뮤니티 업데이트
    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: {
        name,
        description,
        rules,
        visibility,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        categories: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            color: true,
            icon: true,
          },
        },
        _count: {
          select: { members: true, posts: true, announcements: true },
        },
      },
    })

    return NextResponse.json(updatedCommunity)
  } catch (error) {
    console.error('Failed to update community:', error)
    return NextResponse.json(
      { error: '커뮤니티 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE: 커뮤니티 삭제 (소유자만)
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

    // 커뮤니티 및 사용자 정보 조회
    const [community, user] = await Promise.all([
      prisma.community.findUnique({
        where: { id },
        select: { ownerId: true },
      }),
      prisma.user.findUnique({
        where: { id: session!.user.id },
        select: { globalRole: true },
      })
    ])

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 커뮤니티 소유자 또는 사이트 관리자만 삭제 가능
    const isOwner = community.ownerId === session!.user.id
    const isGlobalAdmin = user?.globalRole === 'ADMIN'

    if (!isOwner && !isGlobalAdmin) {
      return NextResponse.json(
        { error: '커뮤니티를 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 커뮤니티 삭제
    await prisma.community.delete({
      where: { id },
    })

    return NextResponse.json({ message: '커뮤니티가 삭제되었습니다.' })
  } catch (error) {
    console.error('Failed to delete community:', error)
    return NextResponse.json(
      { error: '커뮤니티 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
