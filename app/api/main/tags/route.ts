import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // 태그별 PUBLISHED 게시글 수를 집계하여 인기 태그 조회
    const tags = await prisma.mainTag.findMany({
      include: {
        posts: {
          where: {
            post: {
              status: 'PUBLISHED',
            },
          },
        },
      },
      take: limit,
    })

    // PUBLISHED 게시글 수로 정렬
    const sortedTags = tags
      .map((tag) => ({
        ...tag,
        publishedCount: tag.posts.length,
      }))
      .sort((a, b) => b.publishedCount - a.publishedCount)

    return NextResponse.json({
      tags: sortedTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.publishedCount,
        color: tag.color,
      })),
    })
  } catch {
    return NextResponse.json(
      { error: '태그 목록 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 태그 생성 (관리자/모더레이터만 가능)
export async function POST(request: Request) {
  try {
    const session = await requireRoleAPI(['ADMIN', 'MANAGER'])
    if (session instanceof NextResponse) {
      return session
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '태그 이름은 필수입니다.' },
        { status: 400 }
      )
    }

    // 슬러그 생성 (한글 지원)
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^가-힣a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // 중복 확인
    const existing = await prisma.mainTag.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug }],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 태그입니다.' },
        { status: 409 }
      )
    }

    const tag = await prisma.mainTag.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim(),
        color: color || '#64748b',
      },
    })

    return NextResponse.json({ tag }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '태그 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
