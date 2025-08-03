import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

// 에러 타입 정의
export type ErrorType =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT_ERROR'

// 에러 응답 인터페이스
export interface ErrorResponse {
  success: false
  error: {
    type: ErrorType
    message: string
    details?: unknown
    code?: string
    timestamp: string
  }
}

// 에러 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  // 인증/인가
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',

  // 리소스
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  ALREADY_EXISTS: '이미 존재하는 리소스입니다.',

  // 검증
  INVALID_INPUT: '입력값이 올바르지 않습니다.',
  REQUIRED_FIELD: '필수 항목을 입력해주세요.',

  // 서버
  INTERNAL_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  DATABASE_ERROR: '데이터베이스 오류가 발생했습니다.',
  SERVICE_UNAVAILABLE: '서비스를 일시적으로 사용할 수 없습니다.',

  // 제한
  RATE_LIMIT: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
  PAYLOAD_TOO_LARGE: '요청 데이터가 너무 큽니다.',

  // 비즈니스 로직
  ALREADY_PROCESSED: '이미 처리된 요청입니다.',
  INVALID_STATUS: '현재 상태에서는 처리할 수 없습니다.',
  EXPIRED: '만료된 요청입니다.',
}

// 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(
    public type: ErrorType,
    public statusCode: number,
    message?: string,
    public details?: unknown,
    public code?: string
  ) {
    super(message || getDefaultMessage(type))
    this.name = 'ApiError'
  }
}

// 에러 타입별 기본 메시지
function getDefaultMessage(type: ErrorType): string {
  switch (type) {
    case 'VALIDATION_ERROR':
      return ERROR_MESSAGES.INVALID_INPUT
    case 'AUTHENTICATION_ERROR':
      return ERROR_MESSAGES.UNAUTHORIZED
    case 'AUTHORIZATION_ERROR':
      return ERROR_MESSAGES.FORBIDDEN
    case 'NOT_FOUND':
      return ERROR_MESSAGES.NOT_FOUND
    case 'CONFLICT':
      return ERROR_MESSAGES.ALREADY_EXISTS
    case 'DATABASE_ERROR':
      return ERROR_MESSAGES.DATABASE_ERROR
    case 'EXTERNAL_SERVICE_ERROR':
      return ERROR_MESSAGES.SERVICE_UNAVAILABLE
    case 'RATE_LIMIT_ERROR':
      return ERROR_MESSAGES.RATE_LIMIT
    case 'INTERNAL_ERROR':
    default:
      return ERROR_MESSAGES.INTERNAL_ERROR
  }
}

// 에러 타입별 HTTP 상태 코드
function getStatusCode(type: ErrorType): number {
  switch (type) {
    case 'VALIDATION_ERROR':
      return 400
    case 'AUTHENTICATION_ERROR':
      return 401
    case 'AUTHORIZATION_ERROR':
      return 403
    case 'NOT_FOUND':
      return 404
    case 'CONFLICT':
      return 409
    case 'RATE_LIMIT_ERROR':
      return 429
    case 'DATABASE_ERROR':
    case 'EXTERNAL_SERVICE_ERROR':
    case 'INTERNAL_ERROR':
    default:
      return 500
  }
}

// 메인 에러 핸들러
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // ApiError 인스턴스
  if (error instanceof ApiError) {
    return createErrorResponse(
      error.type,
      error.message,
      error.statusCode,
      error.details,
      error.code
    )
  }

  // Zod 검증 에러
  if (error instanceof z.ZodError) {
    return createErrorResponse(
      'VALIDATION_ERROR',
      ERROR_MESSAGES.INVALID_INPUT,
      400,
      error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    )
  }

  // Prisma 에러
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error)
  }

  // 일반 Error 인스턴스
  if (error instanceof Error) {
    // 특정 에러 메시지 매칭
    if (
      error.message.includes('Unauthorized') ||
      error.message.includes('로그인')
    ) {
      return createErrorResponse('AUTHENTICATION_ERROR', error.message, 401)
    }

    if (error.message.includes('Forbidden') || error.message.includes('권한')) {
      return createErrorResponse('AUTHORIZATION_ERROR', error.message, 403)
    }

    if (
      error.message.includes('Not found') ||
      error.message.includes('찾을 수 없')
    ) {
      return createErrorResponse('NOT_FOUND', error.message, 404)
    }

    // 기본 에러
    return createErrorResponse(
      'INTERNAL_ERROR',
      process.env.NODE_ENV === 'production'
        ? ERROR_MESSAGES.INTERNAL_ERROR
        : error.message,
      500
    )
  }

  // 알 수 없는 에러
  return createErrorResponse(
    'INTERNAL_ERROR',
    ERROR_MESSAGES.INTERNAL_ERROR,
    500
  )
}

// Prisma 에러 핸들러
function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
): NextResponse {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      return createErrorResponse(
        'CONFLICT',
        '이미 존재하는 데이터입니다.',
        409,
        { field: error.meta?.target }
      )

    case 'P2025': // Record not found
      return createErrorResponse('NOT_FOUND', '데이터를 찾을 수 없습니다.', 404)

    case 'P2003': // Foreign key constraint violation
      return createErrorResponse(
        'VALIDATION_ERROR',
        '참조하는 데이터가 존재하지 않습니다.',
        400
      )

    default:
      return createErrorResponse(
        'DATABASE_ERROR',
        ERROR_MESSAGES.DATABASE_ERROR,
        500,
        process.env.NODE_ENV === 'development'
          ? { code: error.code, meta: error.meta }
          : undefined
      )
  }
}

// 에러 응답 생성
function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number,
  details?: unknown,
  code?: string
): NextResponse {
  const errorObj: ErrorResponse['error'] = {
    type,
    message,
    timestamp: new Date().toISOString(),
  }

  if (details !== undefined) {
    errorObj.details = details
  }

  if (code !== undefined) {
    errorObj.code = code
  }

  const response: ErrorResponse = {
    success: false,
    error: errorObj,
  }

  return NextResponse.json(response, { status: statusCode })
}

// 간편 에러 생성 헬퍼
export function throwApiError(
  type: ErrorType,
  message?: string,
  details?: unknown,
  code?: string
): never {
  throw new ApiError(type, getStatusCode(type), message, details, code)
}

// 특정 에러 타입 헬퍼
export function throwValidationError(
  message?: string,
  details?: unknown
): never {
  throwApiError(
    'VALIDATION_ERROR',
    message || ERROR_MESSAGES.INVALID_INPUT,
    details
  )
}

export function throwAuthenticationError(message?: string): never {
  throwApiError('AUTHENTICATION_ERROR', message || ERROR_MESSAGES.UNAUTHORIZED)
}

export function throwAuthorizationError(message?: string): never {
  throwApiError('AUTHORIZATION_ERROR', message || ERROR_MESSAGES.FORBIDDEN)
}

export function throwNotFoundError(message?: string): never {
  throwApiError('NOT_FOUND', message || ERROR_MESSAGES.NOT_FOUND)
}

export function throwConflictError(message?: string, details?: unknown): never {
  throwApiError('CONFLICT', message || ERROR_MESSAGES.ALREADY_EXISTS, details)
}

export function throwRateLimitError(message?: string): never {
  throwApiError('RATE_LIMIT_ERROR', message || ERROR_MESSAGES.RATE_LIMIT)
}

// try-catch 래퍼
export async function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return handleError(error)
  }
}
