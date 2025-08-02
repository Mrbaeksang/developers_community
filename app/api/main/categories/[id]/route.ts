import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRoleAPI } from '@/lib/auth-utils'

// 카테고리 상세 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...category,
      postCount: category._count.posts,
    })
  } catch (error) {
    console.error('카테고리 조회 실패:', error)
    return NextResponse.json(
      { error: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 카테고리 수정 (관리자만)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result
    const { id } = await params
    const body = await req.json()
    const { name, slug, description, color, icon, order, isActive } = body

    // 중복 확인 (자기 자신 제외)
    if (name || slug) {
      const existing = await prisma.mainCategory.findFirst({
        where: {
          NOT: { id },
          OR: [...(name ? [{ name }] : []), ...(slug ? [{ slug }] : [])],
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: '이미 존재하는 카테고리입니다.' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.mainCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('카테고리 수정 실패:', error)
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 카테고리 삭제 (관리자만)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result
    const { id } = await params

    // 게시글이 있는지 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (category._count.posts > 0) {
      return NextResponse.json(
        { error: '게시글이 있는 카테고리는 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    await prisma.mainCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('카테고리 삭제 실패:', error)
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
