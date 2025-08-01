import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { CommunityVisibility } from '@prisma/client'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const session = await auth()
    const { communityId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!admin || admin.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const {
      name,
      description,
      visibility,
      allowFileUpload,
      allowChat,
      maxFileSize,
    } = await req.json()

    // 커뮤니티 업데이트
    const community = await prisma.community.update({
      where: { id: communityId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(visibility && { visibility: visibility as CommunityVisibility }),
        ...(allowFileUpload !== undefined && { allowFileUpload }),
        ...(allowChat !== undefined && { allowChat }),
        ...(maxFileSize && { maxFileSize }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
            categories: true,
            announcements: true,
          },
        },
      },
    })

    return NextResponse.json(community)
  } catch (error) {
    console.error('Error updating community:', error)
    return NextResponse.json(
      { error: 'Failed to update community' },
      { status: 500 }
    )
  }
}

// 커뮤니티 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const session = await auth()
    const { communityId } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 관리자 권한 확인
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { globalRole: true },
    })

    if (!admin || admin.globalRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 커뮤니티 삭제
    await prisma.community.delete({
      where: { id: communityId },
    })

    return NextResponse.json({ message: 'Community deleted successfully' })
  } catch (error) {
    console.error('Error deleting community:', error)
    return NextResponse.json(
      { error: 'Failed to delete community' },
      { status: 500 }
    )
  }
}
