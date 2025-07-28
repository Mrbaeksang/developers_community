import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { MainCategory } from '@prisma/client'

export async function GET() {
  try {
    const categories = await prisma.mainCategory.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
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
