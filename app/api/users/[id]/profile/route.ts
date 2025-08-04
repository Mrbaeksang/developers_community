import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            mainPosts: {
              where: {
                status: 'PUBLISHED',
              },
            },
            communityPosts: {
              where: {
                status: 'PUBLISHED',
              },
            },
            mainComments: true,
            mainLikes: true,
            mainBookmarks: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
      _count: user._count,
    })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json(
      { error: '프로필을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
