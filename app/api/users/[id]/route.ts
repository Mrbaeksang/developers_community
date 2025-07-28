import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 사용자 프로필 조회 - GET /api/users/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        globalRole: true,
        showEmail: true,
        createdAt: true,
        isActive: true,
        isBanned: true,
        _count: {
          select: {
            mainPosts: {
              where: {
                status: 'PUBLISHED',
              },
            },
            mainComments: true,
            mainLikes: true,
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

    // 비활성화되거나 밴된 사용자 처리
    if (!user.isActive || user.isBanned) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name || 'Unknown',
        username: user.username,
        image: user.image || undefined,
        bio: user.bio,
        role: user.globalRole,
        joinedAt: user.createdAt.toISOString(),
        // 이메일은 showEmail 설정에 따라 공개
        ...(user.showEmail && { email: user.email }),
        stats: {
          postCount: user._count.mainPosts,
          commentCount: user._count.mainComments,
          likeCount: user._count.mainLikes,
        },
      },
    })
  } catch (error) {
    console.error('사용자 프로필 조회 실패:', error)
    return NextResponse.json(
      { error: '사용자 프로필 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
