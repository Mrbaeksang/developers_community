import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: 커뮤니티 상세 조회
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await auth()

    // 커뮤니티 조회
    const community = await prisma.community.findUnique({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, image: true },
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
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 비공개 커뮤니티 접근 제한
    if (community.visibility === 'PRIVATE') {
      const isMember = community.members && community.members.length > 0
      if (!isMember && (!session || community.ownerId !== session.user?.id)) {
        return NextResponse.json(
          { error: '비공개 커뮤니티입니다.' },
          { status: 403 }
        )
      }
    }

    // 현재 사용자의 멤버십 정보 추출
    const currentMembership = community.members?.[0] || null
    const { members, ...communityData } = community

    return NextResponse.json({
      ...communityData,
      currentMembership,
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (community.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '커뮤니티 소유자만 수정할 수 있습니다.' },
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
        _count: {
          select: { members: true, posts: true },
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

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 커뮤니티 확인
    const community = await prisma.community.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (community.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '커뮤니티 소유자만 삭제할 수 있습니다.' },
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
