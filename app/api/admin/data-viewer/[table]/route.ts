import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const TABLE_MAP: Record<string, string> = {
  users: 'user',
  mainPosts: 'mainPost',
  mainComments: 'mainComment',
  communities: 'community',
  communityPosts: 'communityPost',
  mainLikes: 'mainLike',
  mainBookmarks: 'mainBookmark',
  mainTags: 'mainTag',
}

export async function GET(
  request: Request,
  context: { params: Promise<{ table: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!user || !['ADMIN', 'MANAGER'].includes(user.globalRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { table } = await context.params
    const modelName = TABLE_MAP[table]

    if (!modelName) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 })
    }

    // @ts-expect-error Prisma dynamic model access
    const data = await prisma[modelName].findMany({
      take: 100, // 최대 100개만
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Data viewer error:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
