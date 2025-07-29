import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// 파일 타입 변환
function getFileType(
  mimeType: string
): 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'ARCHIVE' | 'OTHER' {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text')
  )
    return 'DOCUMENT'
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('archive')
  )
    return 'ARCHIVE'
  return 'OTHER'
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // Vercel Blob Storage에 파일 업로드
    const blob = await put(file.name, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // DB에 파일 정보 저장
    const fileRecord = await prisma.file.create({
      data: {
        filename: file.name,
        storedName: blob.pathname,
        mimeType: file.type,
        size: file.size,
        type: getFileType(file.type),
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        uploaderId: session.user.id,
      },
    })

    return NextResponse.json({
      id: fileRecord.id,
      name: fileRecord.filename,
      size: fileRecord.size,
      type: fileRecord.mimeType,
      url: fileRecord.url,
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
