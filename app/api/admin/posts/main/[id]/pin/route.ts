import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET: 현재 고정 상태 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || user.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const post = await prisma.mainPost.findUnique({
      where: { id },
      select: { isPinned: true },
    })

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ isPinned: post.isPinned })
  } catch (error) {
    console.error('고정 상태 조회 실패:', error)
    return NextResponse.json(
      { error: '고정 상태 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH: 고정/고정해제 토글
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || user.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 현재 고정 상태 확인
    const currentPost = await prisma.mainPost.findUnique({
      where: { id },
      select: { isPinned: true, status: true },
    })

    if (!currentPost) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // PUBLISHED 상태인 게시글만 고정 가능
    if (currentPost.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: '게시된 글만 고정할 수 있습니다.' },
        { status: 400 }
      )
    }

    // 고정 상태 토글
    const updatedPost = await prisma.mainPost.update({
      where: { id },
      data: { isPinned: !currentPost.isPinned },
      select: {
        id: true,
        isPinned: true,
      },
    })

    return NextResponse.json({
      success: true,
      isPinned: updatedPost.isPinned,
      message: updatedPost.isPinned
        ? '게시글이 고정되었습니다.'
        : '게시글 고정이 해제되었습니다.',
    })
  } catch (error) {
    console.error('고정 상태 변경 실패:', error)
    return NextResponse.json(
      { error: '고정 상태 변경에 실패했습니다.' },
      { status: 500 }
    )
  }
}
