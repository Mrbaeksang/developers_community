import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // 태그별 게시글 수를 집계하여 인기 태그 조회
    const tags = await prisma.mainTag.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: 'desc',
        },
      },
      take: limit,
    })

    return NextResponse.json({
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag._count.posts,
      })),
    })
  } catch (error) {
    console.error('태그 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '태그 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
