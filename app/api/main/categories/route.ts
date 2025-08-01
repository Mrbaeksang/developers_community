import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (user?.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

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
