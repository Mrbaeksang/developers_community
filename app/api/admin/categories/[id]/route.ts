import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface Context {
  params: Promise<{ id: string }>
}

// 카테고리 수정
export async function PATCH(req: NextRequest, context: Context) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (user?.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const body = await req.json()
    const {
      name,
      slug,
      description,
      color,
      icon,
      order,
      isActive,
      requiresApproval,
    } = body

    // 카테고리 존재 확인
    const existingCategory = await prisma.mainCategory.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 슬러그 변경 시 중복 확인
    if (slug && slug !== existingCategory.slug) {
      const duplicateSlug = await prisma.mainCategory.findUnique({
        where: { slug },
      })

      if (duplicateSlug) {
        return NextResponse.json(
          { error: '이미 존재하는 슬러그입니다.' },
          { status: 400 }
        )
      }
    }

    // 카테고리 업데이트
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
        ...(requiresApproval !== undefined && { requiresApproval }),
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    return NextResponse.json({
      category: {
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
      },
    })
  } catch (error) {
    console.error('카테고리 수정 실패:', error)
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 카테고리 삭제
export async function DELETE(req: NextRequest, context: Context) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (user?.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    // 카테고리 존재 및 게시글 확인
    const category = await prisma.mainCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: '카테고리를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 게시글이 있는 카테고리는 삭제 불가
    if (category._count.posts > 0) {
      return NextResponse.json(
        {
          error: `이 카테고리에 ${category._count.posts}개의 게시글이 있습니다. 게시글을 먼저 삭제하거나 다른 카테고리로 이동하세요.`,
        },
        { status: 400 }
      )
    }

    // 카테고리 삭제
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
