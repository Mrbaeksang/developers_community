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

    const { count = 30 } = await request.json()

    // 커뮤니티와 멤버 정보 가져오기
    const communities = await prisma.community.findMany({
      include: {
        members: {
          where: { status: 'ACTIVE' },
          select: { userId: true },
        },
        categories: {
          select: { id: true },
        },
      },
    })

    if (communities.length === 0) {
      return NextResponse.json(
        { error: '게시글을 생성할 커뮤니티가 없습니다.' },
        { status: 400 }
      )
    }

    const posts = []
    for (let i = 0; i < count; i++) {
      const community = faker.helpers.arrayElement(communities)

      if (community.members.length === 0 || community.categories.length === 0) {
        continue
      }

      const title = faker.lorem.sentence()
      const content = `# ${title}\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n## 주요 내용\n\n${faker.lorem.paragraphs(2, '\n\n')}`

      const post = await prisma.communityPost.create({
        data: {
          title,
          content,
          authorId: faker.helpers.arrayElement(community.members).userId,
          communityId: community.id,
          categoryId: faker.helpers.arrayElement(community.categories).id,
          viewCount: faker.number.int({ min: 0, max: 500 }),
          isPinned: faker.datatype.boolean({ probability: 0.1 }),
        },
      })

      posts.push(post)
    }

    return NextResponse.json({
      success: true,
      message: `${posts.length}개의 커뮤니티 게시글이 생성되었습니다.`,
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        communityId: p.communityId,
      })),
    })
  } catch (error) {
    console.error('Failed to create community posts:', error)
    return NextResponse.json(
      { error: '커뮤니티 게시글 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
