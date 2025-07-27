import { MainLayout } from '@/components/layouts/MainLayout'
import { HeroSection } from '@/components/home/HeroSection'
import { PostList } from '@/components/home/PostList'
import { Sidebar } from '@/components/home/Sidebar'

export default async function Home() {
  // TODO: 실제 데이터는 API에서 가져오기
  const mockPosts = [
    {
      id: '1',
      title: 'Next.js 15에서 달라진 점들',
      slug: 'nextjs-15-whats-new',
      content: 'Next.js 15가 출시되었습니다. 이번 버전에서는...',
      excerpt: 'Next.js 15의 주요 변경사항을 살펴봅니다.',
      type: 'ARTICLE' as const,
      status: 'PUBLISHED' as const,
      published: true,
      viewCount: 342,
      authorId: 'user1',
      categoryId: 'cat1',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
      author: {
        id: 'user1',
        name: '김개발',
        email: 'kimdev@example.com',
        image: null,
      },
      category: {
        id: 'cat1',
        name: 'Frontend',
        slug: 'frontend',
      },
      tags: [
        { id: 'posttag1', tag: { id: 'tag1', name: 'nextjs', slug: 'nextjs' } },
        { id: 'posttag2', tag: { id: 'tag2', name: 'react', slug: 'react' } },
      ],
      _count: {
        comments: 12,
        postLikes: 45,
      },
    },
    {
      id: '2',
      title: 'TypeScript 5.0 새로운 기능들',
      slug: 'typescript-5-new-features',
      content: 'TypeScript 5.0이 출시되면서 많은 새로운 기능들이...',
      excerpt: 'TypeScript 5.0의 혁신적인 기능들을 소개합니다.',
      type: 'ARTICLE' as const,
      status: 'PUBLISHED' as const,
      published: true,
      viewCount: 567,
      authorId: 'user2',
      categoryId: 'cat1',
      createdAt: new Date('2024-01-14').toISOString(),
      updatedAt: new Date('2024-01-14').toISOString(),
      author: {
        id: 'user2',
        name: '이코딩',
        email: 'leecoding@example.com',
        image: null,
      },
      category: {
        id: 'cat1',
        name: 'Frontend',
        slug: 'frontend',
      },
      tags: [
        { id: 'posttag3', tag: { id: 'tag3', name: 'typescript', slug: 'typescript' } },
        { id: 'posttag4', tag: { id: 'tag4', name: 'javascript', slug: 'javascript' } },
      ],
      _count: {
        comments: 23,
        postLikes: 89,
      },
    },
  ]

  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Post List */}
          <main>
            <PostList initialPosts={mockPosts} />
          </main>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </MainLayout>
  )
}
