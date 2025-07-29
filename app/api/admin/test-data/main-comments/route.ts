import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkGlobalRole } from '@/lib/auth-helpers'
import { faker } from '@faker-js/faker'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const roleError = await checkGlobalRole(session.user.id, [
      'ADMIN',
      'MANAGER',
    ])
    if (roleError) {
      return NextResponse.json({ error: roleError }, { status: 403 })
    }

    const { count = 50 } = await request.json()

    // 사용 가능한 사용자와 게시글 가져오기
    const [users, posts] = await Promise.all([
      prisma.user.findMany({ select: { id: true } }),
      prisma.mainPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true },
      }),
    ])

    if (users.length === 0 || posts.length === 0) {
      return NextResponse.json(
        { error: '댓글을 생성하기 위한 사용자 또는 게시글이 없습니다.' },
        { status: 400 }
      )
    }

    const comments = []
    for (let i = 0; i < count; i++) {
      const comment = await prisma.mainComment.create({
        data: {
          content: faker.lorem.paragraph(),
          authorId: faker.helpers.arrayElement(users).id,
          postId: faker.helpers.arrayElement(posts).id,
        },
      })
      comments.push(comment)
    }

    return NextResponse.json({
      success: true,
      message: `${count}개의 댓글이 생성되었습니다.`,
      comments: comments.map((c) => ({
        id: c.id,
        postId: c.postId,
      })),
    })
  } catch (error) {
    console.error('Failed to create test comments:', error)
    return NextResponse.json(
      { error: '테스트 댓글 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
