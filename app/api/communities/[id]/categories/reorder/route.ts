import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  checkAuth,
  checkCommunityRole,
  checkCommunityMembership,
} from '@/lib/auth-helpers'
import { CommunityRole } from '@prisma/client'

// PATCH /api/communities/[id]/categories/reorder - 카테고리 순서 변경
export async function PATCH(
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
    const { id } = resolvedParams
    const userId = session.user.id

    // 커뮤니티 찾기 (ID 또는 slug)
    const community = await prisma.community.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 커뮤니티 멤버십 확인
    try {
      await checkCommunityMembership(userId, community.id)
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 관리자 권한 확인
    const roleCheck = await checkCommunityRole(
      userId,
      community.id,
      CommunityRole.ADMIN
    )
    if (roleCheck) {
      return roleCheck
    }

    const body = await request.json()
    const { categoryIds } = body

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: '카테고리 ID 목록이 필요합니다.' },
        { status: 400 }
      )
    }

    // 모든 카테고리가 해당 커뮤니티에 속하는지 확인
    const categories = await prisma.communityCategory.findMany({
      where: {
        id: { in: categoryIds },
        communityId: community.id,
      },
      select: { id: true },
    })

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: '유효하지 않은 카테고리가 포함되어 있습니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 순서 업데이트
    await prisma.$transaction(
      categoryIds.map((categoryId, index) =>
        prisma.communityCategory.update({
          where: { id: categoryId },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ message: '카테고리 순서가 변경되었습니다.' })
  } catch (error) {
    console.error('카테고리 순서 변경 실패:', error)
    return NextResponse.json(
      { error: '카테고리 순서 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}
