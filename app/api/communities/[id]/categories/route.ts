import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { checkAuth, checkCommunityRole, checkCommunityMembership } from '@/lib/auth-helpers'
import { CommunityRole } from '@prisma/client'

// GET /api/communities/[id]/categories - 카테고리 목록 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const communityId = resolvedParams.id

    // 커뮤니티 존재 여부 확인
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { id: true }
    })

    if (!community) {
      return NextResponse.json(
        { error: '커뮤니티를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 활성화된 카테고리만 조회 (순서대로)
    const categories = await prisma.communityCategory.findMany({
      where: {
        communityId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: 'PUBLISHED'
              }
            }
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        order: cat.order,
        postCount: cat._count.posts
      }))
    })
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
    const authCheck = checkAuth(session)
    if (authCheck) {
      return authCheck
    }

    const resolvedParams = await params
    const communityId = resolvedParams.id
    const userId = session!.user!.id

    // 커뮤니티 멤버십 확인
    const membershipCheck = await checkCommunityMembership(userId, communityId)
    if (membershipCheck) {
      return membershipCheck
    }

    // 관리자 권한 확인 (OWNER, ADMIN만 가능)
    const roleCheck = await checkCommunityRole(
      userId,
      communityId,
      CommunityRole.ADMIN
    )
    if (roleCheck) {
      return roleCheck
    }

    const body = await request.json()
    const { name, description, order = 0 } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '카테고리 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // slug 생성 (한글 지원)
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^가-힣a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 중복 확인
    const existing = await prisma.communityCategory.findFirst({
      where: {
        communityId,
        OR: [
          { name: name.trim() },
          { slug }
        ]
      }
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
        order,
        communityId
      }
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