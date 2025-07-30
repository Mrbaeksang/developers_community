import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { del } from '@vercel/blob'

// 파일 상세 조회 - GET /api/files/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params

    const file = await prisma.file.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            communityId: true,
          },
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 파일 접근 권한 확인 (업로더이거나 관련 게시글/채팅에 접근 가능한 경우)
    const canAccess =
      file.uploaderId === session.user.id || session.user.role === 'ADMIN'

    if (!canAccess && file.post) {
      // 커뮤니티 멤버십 확인
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: file.post.communityId,
          },
        },
        select: {
          status: true,
        },
      })

      if (!membership || membership.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: '파일에 접근할 수 없습니다.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      id: file.id,
      filename: file.filename,
      mimeType: file.mimeType,
      size: file.size,
      type: file.type,
      url: file.url,
      downloadUrl: file.downloadUrl,
      width: file.width,
      height: file.height,
      createdAt: file.createdAt.toISOString(),
      uploader: {
        id: file.uploader.id,
        name: file.uploader.name || 'Unknown',
        username: file.uploader.username,
        image: file.uploader.image || undefined,
      },
      post: file.post
        ? {
            id: file.post.id,
            title: file.post.title,
          }
        : undefined,
      usageCount: file._count.chatMessages + (file.post ? 1 : 0),
    })
  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json(
      { error: '파일 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// 파일 삭제 - DELETE /api/files/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params

    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        id: true,
        uploaderId: true,
        storedName: true,
        post: {
          select: {
            id: true,
            communityId: true,
          },
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    })

    if (!file) {
      return NextResponse.json(
        { error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 삭제 권한 확인
    const isUploader = file.uploaderId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    // 커뮤니티 관리자 확인
    let isCommunityAdmin = false
    if (file.post) {
      const membership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: file.post.communityId,
          },
        },
        select: {
          role: true,
        },
      })

      isCommunityAdmin =
        membership?.role === 'OWNER' || membership?.role === 'ADMIN'
    }

    if (!isUploader && !isAdmin && !isCommunityAdmin) {
      return NextResponse.json(
        { error: '파일 삭제 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 파일이 사용 중인지 확인
    if (file.post || file._count.chatMessages > 0) {
      return NextResponse.json(
        { error: '사용 중인 파일은 삭제할 수 없습니다.' },
        { status: 400 }
      )
    }

    // Vercel Blob에서 파일 삭제
    try {
      await del(file.storedName, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
    } catch (blobError) {
      console.error('Blob deletion error:', blobError)
      // Blob 삭제 실패해도 DB 레코드는 삭제 진행
    }

    // DB에서 파일 레코드 삭제
    await prisma.file.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: '파일 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
