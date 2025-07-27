import { PrismaClient, PostStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create main site categories
  const categories = await Promise.all([
    prisma.mainCategory.upsert({
      where: { slug: 'free' },
      update: {},
      create: {
        name: '자유게시판',
        slug: 'free',
        description: '자유로운 주제로 이야기를 나누는 공간입니다.',
        color: '#3b82f6',
        icon: 'MessageSquare',
        order: 1,
        requiresApproval: false, // 자유게시판은 승인 불필요
      },
    }),
    prisma.mainCategory.upsert({
      where: { slug: 'qna' },
      update: {},
      create: {
        name: 'Q&A',
        slug: 'qna',
        description: '궁금한 점을 질문하고 답변을 받는 공간입니다.',
        color: '#f59e0b',
        icon: 'HelpCircle',
        order: 2,
        requiresApproval: true, // Q&A는 승인 필요
      },
    }),
    prisma.mainCategory.upsert({
      where: { slug: 'react' },
      update: {},
      create: {
        name: 'React',
        slug: 'react',
        description: 'React 관련 지식과 경험을 공유하는 공간입니다.',
        color: '#61dafb',
        icon: 'Code',
        order: 3,
        requiresApproval: true,
      },
    }),
    prisma.mainCategory.upsert({
      where: { slug: 'nextjs' },
      update: {},
      create: {
        name: 'Next.js',
        slug: 'nextjs',
        description: 'Next.js 관련 지식과 경험을 공유하는 공간입니다.',
        color: '#000000',
        icon: 'Code',
        order: 4,
        requiresApproval: true,
      },
    }),
  ])

  // Create main site tags
  const tags = await Promise.all([
    prisma.mainTag.upsert({
      where: { slug: 'javascript' },
      update: {},
      create: { name: 'JavaScript', slug: 'javascript', color: '#f7df1e' },
    }),
    prisma.mainTag.upsert({
      where: { slug: 'typescript' },
      update: {},
      create: { name: 'TypeScript', slug: 'typescript', color: '#3178c6' },
    }),
    prisma.mainTag.upsert({
      where: { slug: 'react' },
      update: {},
      create: { name: 'React', slug: 'react', color: '#61dafb' },
    }),
    prisma.mainTag.upsert({
      where: { slug: 'nextjs' },
      update: {},
      create: { name: 'Next.js', slug: 'nextjs', color: '#000000' },
    }),
    prisma.mainTag.upsert({
      where: { slug: 'nodejs' },
      update: {},
      create: { name: 'Node.js', slug: 'nodejs', color: '#339933' },
    }),
  ])

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '관리자',
      username: 'admin',
      globalRole: 'ADMIN',
      bio: '플랫폼 관리자입니다.',
    },
  })

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: '매니저',
      username: 'manager',
      globalRole: 'MANAGER',
      bio: '콘텐츠 매니저입니다.',
    },
  })

  // Create sample user
  const sampleUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '개발자',
      username: 'developer',
      globalRole: 'USER',
      bio: '프론트엔드 개발자입니다.',
    },
  })

  // Create sample posts for main site
  const post1 = await prisma.mainPost.create({
    data: {
      title: '개발자 커뮤니티에 오신 것을 환영합니다!',
      content: `# 환영합니다! 🎉

개발자 커뮤니티 플랫폼에 오신 것을 환영합니다.

## 주요 기능

### 메인 사이트
- 📝 자유게시판 (즉시 게시)
- ❓ Q&A (승인 후 게시)
- 💻 기술별 카테고리 (React, Next.js 등)

### 커뮤니티 기능
- 👥 사용자 생성 커뮤니티
- 💬 실시간 채팅
- 📎 파일 업로드
- 🔔 알림 시스템

함께 성장하는 개발자 커뮤니티를 만들어갑시다!`,
      slug: 'welcome-to-developers-community',
      excerpt: '개발자 커뮤니티 플랫폼에 오신 것을 환영합니다.',
      status: PostStatus.PUBLISHED,
      isPinned: true,
      approvedAt: new Date(),
      approvedById: adminUser.id,
      authorId: adminUser.id,
      categoryId: categories[0].id, // 자유게시판
    },
  })

  const post2 = await prisma.mainPost.create({
    data: {
      title: 'Next.js 15 새로운 기능들',
      content: `# Next.js 15의 새로운 기능들

Next.js 15에서 추가된 주요 기능들을 소개합니다.

## 주요 변경사항

1. **React Server Components 개선**
   - 더 나은 성능
   - 향상된 개발자 경험

2. **App Router 안정화**
   - 프로덕션 준비 완료
   - 새로운 라우팅 패턴

3. **성능 최적화**
   - 번들 크기 감소
   - 빌드 속도 향상

더 자세한 내용은 공식 문서를 참고하세요.`,
      slug: 'nextjs-15-new-features',
      excerpt: 'Next.js 15에서 추가된 새로운 기능들을 알아보세요.',
      status: PostStatus.PUBLISHED,
      approvedAt: new Date(),
      approvedById: managerUser.id,
      authorId: sampleUser.id,
      categoryId: categories.find(c => c.slug === 'nextjs')!.id,
    },
  })

  const post3 = await prisma.mainPost.create({
    data: {
      title: 'React 18 동시성 기능 이해하기',
      content: `# React 18 동시성 기능

React 18의 새로운 동시성 기능에 대해 알아봅시다.

## Suspense와 함께 사용하기

\`\`\`jsx
<Suspense fallback={<Loading />}>
  <DataComponent />
</Suspense>
\`\`\`

더 많은 예제와 설명이 필요합니다...`,
      slug: 'react-18-concurrent-features',
      excerpt: 'React 18의 동시성 기능을 이해해봅시다.',
      status: PostStatus.PENDING, // 승인 대기 중
      authorId: sampleUser.id,
      categoryId: categories.find(c => c.slug === 'react')!.id,
    },
  })

  // Connect tags to posts
  await prisma.mainPostTag.createMany({
    data: [
      { postId: post2.id, tagId: tags.find((t) => t.slug === 'nextjs')!.id },
      { postId: post2.id, tagId: tags.find((t) => t.slug === 'react')!.id },
      {
        postId: post2.id,
        tagId: tags.find((t) => t.slug === 'typescript')!.id,
      },
      { postId: post3.id, tagId: tags.find((t) => t.slug === 'react')!.id },
      {
        postId: post3.id,
        tagId: tags.find((t) => t.slug === 'javascript')!.id,
      },
    ],
  })

  // Create sample comments
  await prisma.mainComment.create({
    data: {
      content: '정말 유용한 정보네요! Next.js 15 업데이트가 기대됩니다.',
      authorId: sampleUser.id,
      postId: post2.id,
    },
  })

  await prisma.mainComment.create({
    data: {
      content: '환영합니다! 좋은 커뮤니티가 되길 바랍니다.',
      authorId: managerUser.id,
      postId: post1.id,
    },
  })

  // Create a sample community
  const community = await prisma.community.create({
    data: {
      name: 'React 개발자 모임',
      slug: 'react-developers',
      description: 'React를 사랑하는 개발자들의 모임입니다.',
      ownerId: sampleUser.id,
      memberCount: 1,
    },
  })

  // Add owner as a member
  await prisma.communityMember.create({
    data: {
      userId: sampleUser.id,
      communityId: community.id,
      role: 'OWNER',
    },
  })

  // Create community category
  const communityCategory = await prisma.communityCategory.create({
    data: {
      name: '일반',
      slug: 'general',
      description: '일반적인 토론을 위한 공간',
      communityId: community.id,
    },
  })

  // Create default chat channel
  await prisma.chatChannel.create({
    data: {
      name: 'general',
      description: '일반 채팅',
      isDefault: true,
      communityId: community.id,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📝 Created ${categories.length} main categories`)
  console.log(`🏷️ Created ${tags.length} tags`)
  console.log(`👤 Created 3 users (admin, manager, user)`)
  console.log(`📄 Created 3 main posts (2 published, 1 pending)`)
  console.log(`💬 Created 2 comments`)
  console.log(`👥 Created 1 community`)
  console.log(`💭 Created 1 chat channel`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
