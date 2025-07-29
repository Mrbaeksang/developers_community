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

    const { count = 100 } = await request.json()

    // 사용자와 게시글 정보 가져오기
    const [users, mainPosts, communityPosts] = await Promise.all([
      prisma.user.findMany({ select: { id: true } }),
      prisma.mainPost.findMany({
        where: { status: 'PUBLISHED' },
        select: { id: true },
      }),
      prisma.communityPost.findMany({ select: { id: true } }),
    ])

    if (
      users.length === 0 ||
      (mainPosts.length === 0 && communityPosts.length === 0)
    ) {
      return NextResponse.json(
        { error: '좋아요를 추가할 사용자 또는 게시글이 없습니다.' },
        { status: 400 }
      )
    }

    const likes = []
    const createdLikes = new Set<string>()

    for (let i = 0; i < count; i++) {
      const userId = faker.helpers.arrayElement(users).id
      const isMainPost = faker.datatype.boolean()

      if (isMainPost && mainPosts.length > 0) {
        const postId = faker.helpers.arrayElement(mainPosts).id
        const key = `main-${userId}-${postId}`

        if (!createdLikes.has(key)) {
          const existing = await prisma.mainLike.findUnique({
            where: { userId_postId: { userId, postId } },
          })

          if (!existing) {
            const like = await prisma.mainLike.create({
              data: { userId, postId },
            })
            likes.push({ type: 'main', ...like })
            createdLikes.add(key)
          }
        }
      } else if (!isMainPost && communityPosts.length > 0) {
        const postId = faker.helpers.arrayElement(communityPosts).id
        const key = `community-${userId}-${postId}`

        if (!createdLikes.has(key)) {
          const existing = await prisma.communityLike.findUnique({
            where: { userId_postId: { userId, postId } },
          })

          if (!existing) {
            const like = await prisma.communityLike.create({
              data: { userId, postId },
            })
            likes.push({ type: 'community', ...like })
            createdLikes.add(key)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${likes.length}개의 좋아요가 추가되었습니다.`,
      likes: likes.map((l) => ({
        type: l.type,
        postId: l.postId,
      })),
    })
  } catch (error) {
    console.error('Failed to create likes:', error)
    return NextResponse.json(
      { error: '좋아요 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
