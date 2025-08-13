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
  // 텍스트 전용 모델
  PRIMARY: 'openai/gpt-oss-120b',
  SECONDARY: 'tngtech/deepseek-r1t2-chimera:free',

  // Vision 모델 (이미지 + 파일 포함 Q&A용 - 커뮤니티 전용)
  // 메인 사이트는 파일 업로드 불가하므로 텍스트 전용 모델만 사용
  VISION: 'openai/gpt-5-nano',

  // 기본 모델
  DEFAULT: 'openai/gpt-oss-120b',
} as const

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS]
