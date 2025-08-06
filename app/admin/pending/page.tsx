import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/core/prisma'
import { PendingPostsManager } from '@/components/admin/PendingPostsManager'

async function getPendingPosts() {
  try {
    const posts = await prisma.mainPost.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || undefined,
      createdAt: post.createdAt.toISOString(),
      viewCount: post.viewCount,
      author: {
        id: post.author.id,
        name: post.author.name || 'Unknown',
        email: post.author.email,
        image: post.author.image || undefined,
      },
      category: post.category,
      tags: post.tags.map((t) => t.tag),
      commentCount: post._count.comments,
      likeCount: post._count.likes,
    }))
  } catch (error) {
    console.error('승인 대기 게시글 조회 실패:', error)
    return []
  }
}

export default async function PendingPostsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // 관리자 권한 확인
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  })

  if (!user || (user.globalRole !== 'ADMIN' && user.globalRole !== 'MANAGER')) {
    redirect('/')
  }

  const pendingPosts = await getPendingPosts()

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">게시글 승인 관리</h1>
        <p className="text-muted-foreground">
          승인 대기 중인 게시글을 검토하고 승인/거부 처리하세요.
        </p>
      </div>

      <PendingPostsManager initialPosts={pendingPosts} />
    </div>
  )
}
