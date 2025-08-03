import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CommunityVisibility } from '@prisma/client'
import { requireRoleAPI } from '@/lib/auth-utils'
import { successResponse, deletedResponse } from '@/lib/api-response'
import { handleError } from '@/lib/error-handler'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result
    const { communityId } = await params

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

    return successResponse(community)
  } catch (error) {
    return handleError(error)
  }
}

// 커뮤니티 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const result = await requireRoleAPI(['ADMIN'])
    if (result instanceof NextResponse) return result
    const { communityId } = await params

    // 커뮤니티 삭제
    await prisma.community.delete({
      where: { id: communityId },
    })

    return deletedResponse('커뮤니티가 삭제되었습니다.')
  } catch (error) {
    return handleError(error)
  }
}
