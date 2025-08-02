import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

// 관리자용 전체 카테고리 조회 (비활성 포함)
export async function GET() {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result

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
