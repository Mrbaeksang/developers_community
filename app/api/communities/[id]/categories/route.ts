import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import {
  checkAuth,
  checkCommunityRole,
  checkCommunityMembership,
} from '@/lib/auth-helpers'
import { CommunityRole } from '@prisma/client'

// GET /api/communities/[id]/categories - 카테고리 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

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

    // 활성화된 카테고리만 조회 (순서대로)
    // 설정 페이지에서는 모든 카테고리를 보여줌
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'

    const categories = await prisma.communityCategory.findMany({
      where: {
        communityId: community.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED',
              },
            },
          },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(
      categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        color: cat.color,
        order: cat.order,
        isActive: cat.isActive,
        postCount: cat._count.posts,
      }))
    )
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/communities/[id]/categories - 카테고리 생성 (관리자만)
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

    // 관리자 권한 확인 (OWNER, ADMIN만 가능)
    const roleCheck = await checkCommunityRole(
      userId,
      community.id,
      CommunityRole.ADMIN
    )
    if (roleCheck) {
      return roleCheck
    }

    const body = await request.json()
    const {
      name,
      slug: customSlug,
      description,
      color = '#6366f1',
      order = 0,
    } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // slug 생성 또는 사용자 지정 slug 사용
    const slug =
      customSlug ||
      name
        .trim()
        .toLowerCase()
        .replace(/[^가-힣a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // 색상 형식 검증
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (!colorRegex.test(color)) {
      return NextResponse.json(
        { error: '올바른 색상 형식이 아닙니다. (#RRGGBB)' },
        { status: 400 }
      )
    }

    // 중복 확인 (같은 커뮤니티 내에서)
    const existing = await prisma.communityCategory.findFirst({
      where: {
        communityId: community.id,
        OR: [{ name: name.trim() }, { slug }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 카테고리입니다.' },
        { status: 409 }
      )
    }

    const category = await prisma.communityCategory.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim(),
        color,
        order,
        communityId: community.id,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('카테고리 생성 실패:', error)
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
