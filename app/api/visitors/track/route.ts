import { successResponse } from '@/lib/api/response'

export async function POST() {
  // 비활성화됨 - 방문자 추적 기능 일시 중단
  return successResponse({ tracked: false, disabled: true })
}
