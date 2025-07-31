import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// 카테고리 목록 조회 + 새 카테고리 생성
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (user?.globalRole !== 'ADMIN' && user?.globalRole !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 모든 카테고리 조회
    const categories = await prisma.mainCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color,
        icon: category.icon,
        order: category.order,
        isActive: category.isActive,
        requiresApproval: category.requiresApproval,
        postCount: category._count.posts,
      })),
    })
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 새 카테고리 생성
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (user?.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { name, slug, description, color, icon, requiresApproval } = body

    // 필수 필드 검증
    if (!name || !slug) {
      return NextResponse.json(
        { error: '카테고리 이름과 슬러그는 필수입니다.' },
        { status: 400 }
      )
    }

    // 슬러그 중복 확인
    const existingCategory = await prisma.mainCategory.findUnique({
      where: { slug },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: '이미 존재하는 슬러그입니다.' },
        { status: 400 }
      )
    }

    // 최대 order 값 조회
    const maxOrderCategory = await prisma.mainCategory.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    // 카테고리 생성
    const category = await prisma.mainCategory.create({
      data: {
        name,
        slug,
        description: description || '',
        color: color || '#6366f1',
        icon: icon || 'Folder',
        order: (maxOrderCategory?.order || 0) + 1,
        requiresApproval: requiresApproval ?? true,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('카테고리 생성 실패:', error)
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
