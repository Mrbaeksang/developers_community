import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { FileType } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import {
  checkBanStatus,
  checkCommunityMembership,
  unauthorized,
} from '@/lib/auth-helpers'

// 파일 타입 확인 함수
function getFileType(mimeType: string): FileType {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (mimeType.includes('pdf') || mimeType.includes('document'))
    return 'DOCUMENT'
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar')
  )
    return 'ARCHIVE'
  return 'OTHER'
}

// 이미지 크기 체크 (간단한 구현)
async function getImageDimensions(): Promise<{
  width?: number
  height?: number
}> {
  // 실제 구현에서는 sharp 또는 다른 이미지 처리 라이브러리 사용
  // 여기서는 간단히 null 반환
  return { width: undefined, height: undefined }
}

// POST: 파일 업로드
// TODO: 실제 파일 저장 구현 필요 (Vercel Blob, S3, Cloudinary 등)
// 현재는 메타데이터만 DB에 저장하고 실제 파일은 저장하지 않음
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return unauthorized()
    }

    // Ban 상태 체크
    await checkBanStatus(session.user.id)

    const formData = await req.formData()
    const file = formData.get('file') as File
    const communityId = formData.get('communityId') as string | null
    const postId = formData.get('postId') as string | null

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    // 파일 크기 체크 (기본 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 커뮤니티별 파일 크기 제한 체크
    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { maxFileSize: true, allowFileUpload: true },
      })

      if (!community) {
        return NextResponse.json(
          { error: '커뮤니티를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }

      // 커뮤니티 멤버십 확인
      await checkCommunityMembership(session.user.id, communityId)

      if (!community.allowFileUpload) {
        return NextResponse.json(
          { error: '이 커뮤니티는 파일 업로드를 허용하지 않습니다.' },
          { status: 403 }
        )
      }

      if (file.size > community.maxFileSize) {
        return NextResponse.json(
          {
            error: `파일 크기는 ${community.maxFileSize / 1024 / 1024}MB를 초과할 수 없습니다.`,
          },
          { status: 400 }
        )
      }
    }

    // 파일 정보 준비
    // 실제 환경에서는 파일을 읽어서 저장
    // const bytes = await file.arrayBuffer()
    // const buffer = Buffer.from(bytes)
    const fileType = getFileType(file.type)
    const storedName = `${uuidv4()}-${file.name}`

    // 실제 환경에서는 클라우드 스토리지 사용
    // const uploadDir = join(process.cwd(), 'public', 'uploads')
    // const filePath = join(uploadDir, storedName)
    // await writeFile(filePath, buffer)

    // 임시 URL (실제로는 클라우드 스토리지 URL)
    const url = `/uploads/${storedName}`
    const downloadUrl = `/api/files/${storedName}/download`

    // 이미지인 경우 크기 정보 가져오기
    let width: number | undefined
    let height: number | undefined
    if (fileType === 'IMAGE') {
      const dimensions = await getImageDimensions()
      width = dimensions.width
      height = dimensions.height
    }

    // 파일 정보 DB 저장
    const savedFile = await prisma.file.create({
      data: {
        filename: file.name,
        storedName,
        mimeType: file.type,
        size: file.size,
        type: fileType,
        url,
        downloadUrl,
        width,
        height,
        uploaderId: session.user.id,
        postId: postId || undefined,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: savedFile.id,
      filename: savedFile.filename,
      url: savedFile.url,
      downloadUrl: savedFile.downloadUrl,
      mimeType: savedFile.mimeType,
      size: savedFile.size,
      type: savedFile.type,
      width: savedFile.width,
      height: savedFile.height,
      uploadedAt: savedFile.createdAt,
      uploader: savedFile.uploader,
    })
  } catch (error) {
    console.error('Failed to upload file:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
