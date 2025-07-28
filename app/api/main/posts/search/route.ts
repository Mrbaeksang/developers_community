import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    // 검색 조건 구성
    const where: any = {
      status: 'PUBLISHED',
    }

    switch (type) {
      case 'title':
        where.title = {
          contains: query,
          mode: 'insensitive',
        }
        break

      case 'content':
        where.content = {
          contains: query,
          mode: 'insensitive',
        }
        break

      case 'tag':
        where.tags = {
          some: {
            tag: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        }
        break

      case 'all':
      default:
        where.OR = [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            content: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            excerpt: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
          {
            category: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ]
        break
    }

    // 검색 실행
    const results = await prisma.mainPost.findMany({
      where,
      take: limit,
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('검색 실패:', error)
    return NextResponse.json({ error: '검색에 실패했습니다.' }, { status: 500 })
  }
}
