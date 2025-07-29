import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { faker } from '@faker-js/faker'
import { PostStatus } from '@prisma/client'

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
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      )
    }

    const {
      count = 1,
      status = 'PUBLISHED',
      title,
      content,
      categoryId,
    } = await request.json()

    // 사용 가능한 사용자, 카테고리, 태그 가져오기
    const [users, categories, tags] = await Promise.all([
      prisma.user.findMany({ select: { id: true } }),
      prisma.mainCategory.findMany({ select: { id: true } }),
      prisma.mainTag.findMany({ select: { id: true } }),
    ])

    if (users.length === 0 || categories.length === 0) {
      return NextResponse.json(
        { error: '게시글을 생성하기 위한 사용자 또는 카테고리가 없습니다.' },
        { status: 400 }
      )
    }

    const posts = []
    for (let i = 0; i < count; i++) {
      // 단일 생성이고 제목/내용이 제공된 경우
      const postTitle = count === 1 && title ? title : faker.lorem.sentence()
      const postContent =
        count === 1 && content
          ? content
          : `# ${postTitle}\n\n${faker.lorem.paragraphs(3, '\n\n')}\n\n## 주요 내용\n\n${faker.lorem.paragraphs(2, '\n\n')}\n\n### 마무리\n\n${faker.lorem.paragraph()}`

      // 카테고리 ID 처리
      let selectedCategoryId = faker.helpers.arrayElement(categories).id
      if (categoryId) {
        const categoryExists = categories.find((c) => c.id === categoryId)
        if (categoryExists) {
          selectedCategoryId = categoryId
        }
      }

      const post = await prisma.mainPost.create({
        data: {
          title: postTitle,
          content: postContent,
          slug: faker.helpers.slugify(postTitle).toLowerCase(),
          status: status as PostStatus,
          authorId: session.user.id, // 현재 사용자가 작성자
          categoryId: selectedCategoryId,
          viewCount: faker.number.int({ min: 0, max: 1000 }),
          approvedAt: status === 'PUBLISHED' ? new Date() : null,
          approvedById: status === 'PUBLISHED' ? session.user.id : null,
        },
      })

      // 태그 연결 (랜덤하게 1-3개)
      if (tags.length > 0) {
        const selectedTags = faker.helpers.arrayElements(tags, {
          min: 1,
          max: Math.min(3, tags.length),
        })
        await prisma.mainPostTag.createMany({
          data: selectedTags.map((tag) => ({
            postId: post.id,
            tagId: tag.id,
          })),
        })
      }

      posts.push(post)
    }

    return NextResponse.json({
      success: true,
      message: `${count}개의 ${status === 'PUBLISHED' ? '게시된' : '승인 대기'} 게시글이 생성되었습니다.`,
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
      })),
    })
  } catch (error) {
    console.error('Failed to create test posts:', error)
    return NextResponse.json(
      { error: '테스트 게시글 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
