import { z } from 'zod'

const envSchema = z.object({
  // 데이터베이스
  DATABASE_URL: z.string().url('올바른 데이터베이스 URL이 아닙니다'),

  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET은 최소 32자 이상이어야 합니다'),

  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  KAKAO_CLIENT_ID: z.string().optional(),
  KAKAO_CLIENT_SECRET: z.string().optional(),

  // Vercel Blob Storage
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  // Redis KV
  KV_URL: z.string().optional(),
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  KV_REST_API_READ_ONLY_TOKEN: z.string().optional(),

  // Node Environment
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})

// 환경 변수 검증 및 타입 안전성 보장
const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ 환경 변수 검증 실패:')
      error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
      })
      throw new Error(
        '환경 변수 설정이 올바르지 않습니다. .env 파일을 확인해주세요.'
      )
    }
    throw error
  }
}

export const env = parseEnv()

// 타입 내보내기
export type Env = z.infer<typeof envSchema>
