import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || !['ADMIN', 'MANAGER'].includes(user.globalRole)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    const body = await request.json()
    const { count = 50 } = body

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
        { error: '북마크를 추가할 사용자 또는 게시글이 없습니다.' },
        { status: 400 }
      )
    }

    const bookmarks = []
    const createdBookmarks = new Set<string>()

    for (let i = 0; i < count; i++) {
      const userId = faker.helpers.arrayElement(users).id
      const isMainPost = faker.datatype.boolean()

      if (isMainPost && mainPosts.length > 0) {
        const postId = faker.helpers.arrayElement(mainPosts).id
        const key = `main-${userId}-${postId}`

        if (!createdBookmarks.has(key)) {
          const existing = await prisma.mainBookmark.findUnique({
            where: { userId_postId: { userId, postId } },
          })

          if (!existing) {
            const bookmark = await prisma.mainBookmark.create({
              data: { userId, postId },
            })
            bookmarks.push({ type: 'main', ...bookmark })
            createdBookmarks.add(key)
          }
        }
      } else if (!isMainPost && communityPosts.length > 0) {
        const postId = faker.helpers.arrayElement(communityPosts).id
        const key = `community-${userId}-${postId}`

        if (!createdBookmarks.has(key)) {
          const existing = await prisma.communityBookmark.findUnique({
            where: { userId_postId: { userId, postId } },
          })

          if (!existing) {
            const bookmark = await prisma.communityBookmark.create({
              data: { userId, postId },
            })
            bookmarks.push({ type: 'community', ...bookmark })
            createdBookmarks.add(key)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${bookmarks.length}개의 북마크가 추가되었습니다.`,
      bookmarks: bookmarks.map((b) => ({
        type: b.type,
        postId: b.postId,
      })),
    })
  } catch (error) {
    console.error('Failed to create bookmarks:', error)
    return NextResponse.json(
      { error: '북마크 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
