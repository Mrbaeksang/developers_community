import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { checkAuth, checkGlobalRole } from '@/lib/auth-helpers'

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
    const session = await auth()
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 또는 모더레이터만 태그 생성 가능
    const userId = session.user.id
    const roleCheck = await checkGlobalRole(userId, ['ADMIN', 'MANAGER'])
    if (roleCheck) {
      return roleCheck
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
