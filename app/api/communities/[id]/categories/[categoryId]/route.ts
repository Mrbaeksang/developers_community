import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  checkAuth,
  checkCommunityRole,
  checkCommunityMembership,
} from '@/lib/auth-helpers'
import { CommunityRole } from '@prisma/client'

// PATCH /api/communities/[id]/categories/[categoryId] - 카테고리 수정
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
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
    const { id, categoryId } = resolvedParams
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

    // 카테고리 존재 확인
    const category = await prisma.communityCategory.findFirst({
      where: {
        id: categoryId,
        communityId: community.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, slug, description, color } = body

    // 입력값 검증
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: '카테고리 이름은 비어있을 수 없습니다.' },
        { status: 400 }
      )
    }

    if (slug !== undefined && !slug.trim()) {
      return NextResponse.json(
        { error: '슬러그는 비어있을 수 없습니다.' },
        { status: 400 }
      )
    }

    if (color !== undefined) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/
      if (!colorRegex.test(color)) {
        return NextResponse.json(
          { error: '올바른 색상 형식이 아닙니다. (#RRGGBB)' },
          { status: 400 }
        )
      }
    }

    // 중복 확인 (이름 또는 슬러그 변경 시)
    if (name || slug) {
      const existing = await prisma.communityCategory.findFirst({
        where: {
          communityId: community.id,
          id: { not: categoryId },
          OR: [
            ...(name ? [{ name: name.trim() }] : []),
            ...(slug ? [{ slug: slug.trim() }] : []),
          ],
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: '이미 사용 중인 이름 또는 슬러그입니다.' },
          { status: 409 }
        )
      }
    }

    // 카테고리 업데이트
    const updatedCategory = await prisma.communityCategory.update({
      where: { id: categoryId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(color !== undefined && { color }),
      },
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    console.error('카테고리 수정 실패:', error)
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/communities/[id]/categories/[categoryId] - 카테고리 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
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
    const { id, categoryId } = resolvedParams
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

    // 카테고리 존재 확인
    const category = await prisma.communityCategory.findFirst({
      where: {
        id: categoryId,
        communityId: community.id,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 게시글이 있는 경우 경고
    if (category._count.posts > 0) {
      return NextResponse.json(
        {
          error: `이 카테고리에 ${category._count.posts}개의 게시글이 있습니다. 정말 삭제하시겠습니까?`,
          postCount: category._count.posts,
          requireConfirmation: true,
        },
        { status: 400 }
      )
    }

    // 카테고리 삭제 (소프트 삭제)
    await prisma.communityCategory.update({
      where: { id: categoryId },
      data: { isActive: false },
    })

    return NextResponse.json({ message: '카테고리가 삭제되었습니다.' })
  } catch (error) {
    console.error('카테고리 삭제 실패:', error)
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
