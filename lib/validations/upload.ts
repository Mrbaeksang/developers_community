import { z } from 'zod'

// 파일 타입 검증 스키마
export const allowedFileTypes = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  archive: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-tar',
  ],
} as const

// 모든 허용된 MIME 타입
const allAllowedTypes = Object.values(
  allowedFileTypes
).flat() as readonly string[]

// 파일 업로드 스키마 (FormData 기반)
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: '파일이 필요합니다' })
    .refine((file) => file.size > 0, '파일이 비어 있습니다')
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      '파일 크기는 10MB를 초과할 수 없습니다'
    )
    .refine(
      (file) => allAllowedTypes.includes(file.type),
      '지원되지 않는 파일 형식입니다'
    ),
  communityId: z
    .string()
    .cuid('올바른 커뮤니티 ID가 아닙니다')
    .optional()
    .nullable(),
  postId: z.string().cuid('올바른 게시글 ID가 아닙니다').optional().nullable(),
  channelId: z.string().cuid('올바른 채널 ID가 아닙니다').optional().nullable(),
})

// 파일 업로드 폼 데이터 검증 스키마 (string fields)
export const fileUploadFormSchema = z.object({
  communityId: z.string().cuid('올바른 커뮤니티 ID가 아닙니다').optional(),
  postId: z.string().cuid('올바른 게시글 ID가 아닙니다').optional(),
  channelId: z.string().cuid('올바른 채널 ID가 아닙니다').optional(),
})

// 파일 메타데이터 스키마
export const fileMetadataSchema = z.object({
  filename: z
    .string()
    .min(1, '파일명은 필수입니다')
    .max(255, '파일명은 255자 이내여야 합니다'),
  mimeType: z
    .string()
    .refine(
      (type) => allAllowedTypes.includes(type),
      '지원되지 않는 MIME 타입입니다'
    ),
  size: z
    .number()
    .int('파일 크기는 정수여야 합니다')
    .min(1, '파일 크기는 1바이트 이상이어야 합니다')
    .max(10 * 1024 * 1024, '파일 크기는 10MB 이하여야 합니다'),
  width: z
    .number()
    .int('너비는 정수여야 합니다')
    .positive('너비는 양수여야 합니다')
    .optional(),
  height: z
    .number()
    .int('높이는 정수여야 합니다')
    .positive('높이는 양수여야 합니다')
    .optional(),
})

// 채팅 파일 업로드 스키마 (채팅에 특화)
export const chatFileUploadFormSchema = z.object({
  channelId: z.string().cuid('올바른 채널 ID가 아닙니다'),
  messageType: z
    .enum(['IMAGE', 'FILE'], '올바른 메시지 타입이 아닙니다')
    .default('FILE'),
})

export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type FileUploadFormInput = z.infer<typeof fileUploadFormSchema>
export type FileMetadataInput = z.infer<typeof fileMetadataSchema>
export type ChatFileUploadFormInput = z.infer<typeof chatFileUploadFormSchema>
