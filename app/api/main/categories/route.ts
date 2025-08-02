import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

export async function GET() {
  try {
    const categories = await prisma.mainCategory.findMany({
      where: {
        isActive: true, // 활성화된 카테고리만 조회
      },
      orderBy: {
        order: 'asc', // order 필드로 정렬
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    return NextResponse.json(
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        color: category.color, // DB의 color 필드 추가
        icon: category.icon, // DB의 icon 필드 추가
        postCount: category._count.posts,
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

// 카테고리 생성 (관리자만)
export async function POST(req: Request) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result

    const body = await req.json()
    const { name, slug, description, color, icon, order, isActive } = body

    // 필수 필드 검증
    if (!name || !slug) {
      return NextResponse.json(
        { error: '이름과 슬러그는 필수입니다.' },
        { status: 400 }
      )
    }

    // 중복 확인
    const existing = await prisma.mainCategory.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 카테고리입니다.' },
        { status: 400 }
      )
    }

    const category = await prisma.mainCategory.create({
      data: {
        name,
        slug,
        description,
        color: color || '#6366f1',
        icon,
        order: order || 0,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 생성 실패:', error)
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
