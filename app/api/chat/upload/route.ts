import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuthAPI } from '@/lib/auth-utils'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

// 허용되는 파일 타입 및 크기 정의
const ALLOWED_TYPES = {
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/webp': 'IMAGE',
  'application/pdf': 'DOCUMENT',
  'text/plain': 'DOCUMENT',
  'application/msword': 'DOCUMENT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'DOCUMENT',
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'audio/mpeg': 'AUDIO',
  'audio/wav': 'AUDIO',
  'application/zip': 'ARCHIVE',
  'application/x-zip-compressed': 'ARCHIVE',
} as const

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// POST: 채팅용 파일 업로드
export async function POST(req: Request) {
  try {
    // 인증 확인
    const session = await requireAuthAPI()
    if (session instanceof NextResponse) {
      return session
    }

    const userId = session.user.id

    // FormData 파싱
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      )
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 파일 타입 검증
    const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]
    if (!fileType) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      )
    }

    // 파일명 생성
    const fileExtension = file.name.split('.').pop() || ''
    const storedName = `${uuidv4()}.${fileExtension}`

    // Vercel Blob에 영구 파일로 업로드
    const blob = await put(`chat/${storedName}`, file, {
      access: 'public',
    })

    // 이미지 메타데이터 추출 (이미지인 경우)
    let width: number | undefined
    let height: number | undefined

    if (fileType === 'IMAGE' && file.type.startsWith('image/')) {
      try {
        // 브라우저 환경이 아니므로 간단한 처리만
        // 실제 구현에서는 sharp 등을 사용할 수 있음
        width = undefined
        height = undefined
      } catch (error) {
        console.warn('이미지 메타데이터 추출 실패:', error)
      }
    }

    // 데이터베이스에 파일 정보 저장 (영구 보관)
    const savedFile = await prisma.file.create({
      data: {
        filename: file.name,
        storedName,
        mimeType: file.type,
        size: file.size,
        type: fileType,
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        width,
        height,
        uploaderId: userId,
        // isTemporary와 expiresAt는 기본값 사용 (false, null)
      },
    })

    return NextResponse.json({
      file: {
        id: savedFile.id,
        filename: savedFile.filename,
        size: savedFile.size,
        type: savedFile.type,
        url: savedFile.url,
        mimeType: savedFile.mimeType,
        width: savedFile.width,
        height: savedFile.height,
        expiresAt: savedFile.expiresAt,
        isTemporary: savedFile.isTemporary,
      },
      fileId: savedFile.id, // 편의를 위해 fileId도 추가
    })
  } catch (error) {
    console.error('파일 업로드 실패:', error)
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
