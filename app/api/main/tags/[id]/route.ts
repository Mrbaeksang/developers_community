import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { checkAuth, checkGlobalRole } from '@/lib/auth-helpers'

// 태그 수정 (관리자/모더레이터만 가능)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자 또는 모더레이터만 태그 수정 가능
    const userId = session.user.id
    const roleCheck = await checkGlobalRole(userId, ['ADMIN', 'MANAGER'])
    if (roleCheck) {
      return roleCheck
    }

    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await request.json()
    const { name, description, color } = body

    // 태그 존재 확인
    const existingTag = await prisma.mainTag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업데이트할 데이터 준비
    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      color?: string
    } = {}

    if (name && name !== existingTag.name) {
      updateData.name = name.trim()

      // 슬러그 재생성
      updateData.slug = name
        .trim()
        .toLowerCase()
        .replace(/[^가-힣a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // 중복 확인
      const duplicate = await prisma.mainTag.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [{ name: updateData.name }, { slug: updateData.slug }],
            },
          ],
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: '이미 존재하는 태그 이름입니다.' },
          { status: 409 }
        )
      }
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (color) {
      updateData.color = color
    }

    const updatedTag = await prisma.mainTag.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ tag: updatedTag })
  } catch {
    return NextResponse.json(
      { error: '태그 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 태그 삭제 (관리자만 가능)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!checkAuth(session)) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 관리자만 태그 삭제 가능
    const userId = session.user.id
    const roleCheck = await checkGlobalRole(userId, ['ADMIN'])
    if (roleCheck) {
      return roleCheck
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    // 태그 존재 확인 및 사용 중인지 확인
    const existingTag = await prisma.mainTag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    })

    if (!existingTag) {
      return NextResponse.json(
        { error: '태그를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용 중인 태그는 삭제 불가
    if (existingTag._count.posts > 0) {
      return NextResponse.json(
        {
          error: `이 태그는 ${existingTag._count.posts}개의 게시글에서 사용 중입니다. 먼저 게시글에서 태그를 제거해주세요.`,
        },
        { status: 400 }
      )
    }

    await prisma.mainTag.delete({
      where: { id },
    })

    return NextResponse.json({ message: '태그가 삭제되었습니다.' })
  } catch {
    return NextResponse.json(
      { error: '태그 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
