import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// 관리자용 전체 카테고리 조회 (비활성 포함)
export async function GET() {
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

    const categories = await prisma.mainCategory.findMany({
      orderBy: {
        order: 'asc',
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
        color: category.color,
        icon: category.icon,
        order: category.order,
        isActive: category.isActive,
        requiresApproval: category.requiresApproval,
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
