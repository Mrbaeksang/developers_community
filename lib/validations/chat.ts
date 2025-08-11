import { z } from 'zod'

// 채팅 메시지 생성 스키마
export const createChatMessageSchema = z.object({
  content: z
    .string()
    .min(1, '메시지 내용은 필수입니다')
    .max(1000, '메시지는 1000자 이내여야 합니다')
    .trim(),
  fileId: z.string().cuid('올바른 파일 ID가 아닙니다').optional(),
  type: z
    .enum(['TEXT', 'IMAGE', 'FILE'], '올바른 메시지 타입이 아닙니다')
    .default('TEXT'),
  replyToId: z
    .string()
    .cuid('올바른 답글 대상 메시지 ID가 아닙니다')
    .optional(),
})

// 채팅 메시지 수정 스키마
export const updateChatMessageSchema = z.object({
  content: z
    .string()
    .min(1, '메시지 내용은 필수입니다')
    .max(1000, '메시지는 1000자 이내여야 합니다')
    .trim(),
})

// 채널 생성 스키마 (커뮤니티 채널용)
export const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, '채널명은 필수입니다')
    .max(50, '채널명은 50자 이내여야 합니다')
    .regex(
      /^[가-힣a-zA-Z0-9\s\-_]+$/,
      '채널명은 한글, 영문, 숫자, 공백, 하이픈, 언더스코어만 사용 가능합니다'
    )
    .trim(),
  description: z
    .string()
    .max(200, '채널 설명은 200자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  communityId: z.string().cuid('올바른 커뮤니티 ID가 아닙니다'),
  order: z
    .number()
    .int('순서는 정수여야 합니다')
    .min(0, '순서는 0 이상이어야 합니다')
    .max(9999, '순서는 9999 이하여야 합니다')
    .default(0),
  isDefault: z.boolean().default(false),
})

// 채널 업데이트 스키마
export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(1, '채널명은 필수입니다')
    .max(50, '채널명은 50자 이내여야 합니다')
    .regex(
      /^[가-힣a-zA-Z0-9\s\-_]+$/,
      '채널명은 한글, 영문, 숫자, 공백, 하이픈, 언더스코어만 사용 가능합니다'
    )
    .trim()
    .optional(),
  description: z
    .string()
    .max(200, '채널 설명은 200자 이내여야 합니다')
    .trim()
    .optional()
    .nullable(),
  order: z
    .number()
    .int('순서는 정수여야 합니다')
    .min(0, '순서는 0 이상이어야 합니다')
    .max(9999, '순서는 9999 이하여야 합니다')
    .optional(),
})

// 채널 멤버 관리 스키마
export const manageChatChannelMemberSchema = z.object({
  userId: z.string().cuid('올바른 사용자 ID가 아닙니다'),
  action: z.enum(['add', 'remove', 'mute', 'unmute'], '올바른 액션이 아닙니다'),
})

export type CreateChatMessageInput = z.infer<typeof createChatMessageSchema>
export type UpdateChatMessageInput = z.infer<typeof updateChatMessageSchema>
export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>
export type ManageChatChannelMemberInput = z.infer<
  typeof manageChatChannelMemberSchema
>
