// OpenRouter AI 클라이언트 설정
import OpenAI from 'openai'

// OpenRouter 클라이언트 인스턴스 생성
export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Developer Community', // 영어로 변경 (인코딩 문제 회피)
  },
})

// AI 모델 설정
export const AI_MODELS = {
  // 1순위: GPT OSS 120B (더 높은 품질)
  PRIMARY: 'openai/gpt-oss-120b',

  // 2순위: DeepSeek R1 T2 Chimera (무료 백업)
  SECONDARY: 'tngtech/deepseek-r1t2-chimera:free',

  // 기본 모델
  DEFAULT: 'openai/gpt-oss-120b',
} as const

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS]
