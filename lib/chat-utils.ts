// 채팅 관련 유틸리티 함수들

export interface FileUploadResult {
  fileId: string
  file: {
    id: string
    filename: string
    size: number
    type: string
    url: string
    mimeType: string
    width?: number
    height?: number
  }
}

// 파일 업로드 함수
export async function uploadChatFile(file: File): Promise<FileUploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/chat/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '파일 업로드에 실패했습니다.')
  }

  const result = await response.json()
  return result
}

// 파일 크기를 사람이 읽기 쉬운 형태로 변환
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 파일 타입이 이미지인지 확인
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

// 파일 타입이 비디오인지 확인
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

// 파일 타입이 오디오인지 확인
export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

// 파일 아이콘 결정
export function getFileIcon(mimeType: string): string {
  if (isImageFile(mimeType)) return 'image'
  if (isVideoFile(mimeType)) return 'video'
  if (isAudioFile(mimeType)) return 'audio'
  if (mimeType.includes('pdf')) return 'file-text'
  if (mimeType.includes('word') || mimeType.includes('document'))
    return 'file-text'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive'
  return 'file'
}

// 메시지 타입 결정 (파일 기반)
export function getMessageType(mimeType: string): 'TEXT' | 'IMAGE' | 'FILE' {
  if (isImageFile(mimeType)) return 'IMAGE'
  return 'FILE'
}

// 허용되는 파일 타입 목록
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/zip',
  'application/x-zip-compressed',
]

// 최대 파일 크기 (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// 파일 유효성 검증
export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return '지원하지 않는 파일 형식입니다.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 10MB를 초과할 수 없습니다.'
  }

  return null
}
