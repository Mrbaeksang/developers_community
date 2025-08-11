import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Zod 검증 에러를 처리하는 유틸리티 함수
 */
export function handleZodError(error: z.ZodError) {
  const formattedErrors = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }))

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    },
    { status: 400 }
  )
}

/**
 * Zod 파싱을 안전하게 수행하고 에러 응답을 반환
 */
export function safeParseWithResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      response: handleZodError(result.error),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}
