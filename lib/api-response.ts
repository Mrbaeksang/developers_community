import { NextResponse } from 'next/server'

// API 응답 타입 정의
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 성공 응답 헬퍼
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    } as ApiResponse<T>,
    { status }
  )
}

// 에러 응답 헬퍼
export function errorResponse(
  error: string,
  status: number = 400,
  data?: unknown
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
  }

  if (data !== undefined) {
    response.data = data
  }

  return NextResponse.json(response, { status })
}

// 생성 응답 헬퍼 (201 Created)
export function createdResponse<T>(
  data: T,
  message: string = '생성되었습니다.'
): NextResponse {
  return successResponse(data, message, 201)
}

// 삭제 응답 헬퍼 (204 No Content)
export function deletedResponse(
  message: string = '삭제되었습니다.'
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
    },
    { status: 200 } // 204는 body를 가질 수 없으므로 200 사용
  )
}

// 업데이트 응답 헬퍼
export function updatedResponse<T>(
  data: T,
  message: string = '수정되었습니다.'
): NextResponse {
  return successResponse(data, message)
}

// 페이지네이션 메타 생성 헬퍼
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// 페이지네이션 응답 헬퍼
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination: createPaginationMeta(page, limit, total),
      ...(message && { message }),
    } as PaginatedResponse<T>,
    { status: 200 }
  )
}

// 변환 헬퍼 - undefined/null 값 제거
export function transformForResponse<T extends Record<string, unknown>>(
  data: T
): T {
  const transformed = { ...data } as Record<string, unknown>

  // undefined와 null 값 제거
  Object.keys(transformed).forEach((key) => {
    if (transformed[key] === undefined || transformed[key] === null) {
      delete transformed[key]
    }
  })

  return transformed as T
}

// 배치 응답 헬퍼
export function batchResponse<T>(
  results: Array<{ success: boolean; data?: T; error?: string }>,
  message?: string
): NextResponse {
  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  return NextResponse.json(
    {
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
      ...(message && { message }),
    },
    { status: failed === 0 ? 200 : 207 } // 207 Multi-Status
  )
}

// 유효성 검사 에러 응답
export function validationErrorResponse(
  errors: Record<string, string | string[]>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: '입력값이 올바르지 않습니다.',
      errors,
    },
    { status: 400 }
  )
}
