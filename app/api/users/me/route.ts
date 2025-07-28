import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// 프로필 수정 스키마
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .max(50, '이름은 50자 이하로 입력해주세요.')
    .optional(),
  username: z
    .string()
    .min(2, '사용자명은 2자 이상이어야 합니다.')
    .max(20, '사용자명은 20자 이하로 입력해주세요.')
    .optional(),
  bio: z.string().max(500, '자기소개는 500자 이하로 입력해주세요.').optional(),
  showEmail: z.boolean().optional(),
})

// 내 정보 조회 - GET /api/users/me
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Unknown',
        username: user.username,
        image: user.image || undefined,
        bio: user.bio,
        role: user.globalRole,
        showEmail: user.showEmail,
        joinedAt: user.createdAt.toISOString(),
        stats: {
          postCount: user._count.mainPosts,
          commentCount: user._count.mainComments,
          likeCount: user._count.mainLikes,
        },
      },
    })
  } catch (error) {
    console.error('내 정보 조회 실패:', error)
    return NextResponse.json(
      { error: '내 정보 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 내 정보 수정 - PUT /api/users/me
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 데이터 검증
    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // 사용자명 중복 확인 (변경하는 경우만)
    if (validatedData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: validatedData.username,
          id: { not: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: '이미 사용 중인 사용자명입니다.' },
          { status: 400 }
        )
      }
    }

    // 사용자 정보 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.username !== undefined && {
          username: validatedData.username,
        }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.showEmail !== undefined && {
          showEmail: validatedData.showEmail,
        }),
      },
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

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || 'Unknown',
        username: updatedUser.username,
        image: updatedUser.image || undefined,
        bio: updatedUser.bio,
        role: updatedUser.globalRole,
        showEmail: updatedUser.showEmail,
        joinedAt: updatedUser.createdAt.toISOString(),
        stats: {
          postCount: updatedUser._count.mainPosts,
          commentCount: updatedUser._count.mainComments,
          likeCount: updatedUser._count.mainLikes,
        },
      },
    })
  } catch (error) {
    console.error('프로필 수정 실패:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '프로필 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}
