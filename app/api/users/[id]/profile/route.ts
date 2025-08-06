import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleError, throwNotFoundError } from '@/lib/error-handler'

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
      throw throwNotFoundError('사용자를 찾을 수 없습니다.')
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
    return handleError(error)
  }
}
