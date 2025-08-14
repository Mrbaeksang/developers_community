/**
 * Vercel 최적화를 위한 배치 API 유틸리티
 * 여러 API 호출을 하나로 묶어 Function Invocations 감소
 */

interface BatchRequest {
  id: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown>
}

interface BatchResponse {
  id: string
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

/**
 * 여러 API 요청을 배치로 처리
 * @param requests 배치 처리할 요청 배열
 * @returns 각 요청에 대한 응답 배열
 */
export async function batchApiCall(
  requests: BatchRequest[]
): Promise<BatchResponse[]> {
  try {
    const response = await fetch('/api/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    })

    if (!response.ok) {
      throw new Error(`Batch API failed: ${response.status}`)
    }

    const result = await response.json()
    return result.responses || []
  } catch (error) {
    console.error('Batch API error:', error)
    // 배치 처리 실패 시 개별 처리로 폴백
    return Promise.all(
      requests.map(async (req) => {
        try {
          const res = await fetch(req.endpoint, {
            method: req.method || 'GET',
            headers: req.body
              ? { 'Content-Type': 'application/json' }
              : undefined,
            body: req.body ? JSON.stringify(req.body) : undefined,
          })
          const data = await res.json()
          return {
            id: req.id,
            success: res.ok,
            data: res.ok ? data : undefined,
            error: res.ok ? undefined : data.error || 'Request failed',
          }
        } catch (err) {
          return {
            id: req.id,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      })
    )
  }
}

/**
 * 배치 요청 빌더 클래스
 * 여러 요청을 쉽게 구성하고 실행
 */
export class BatchRequestBuilder {
  private requests: BatchRequest[] = []

  add(id: string, endpoint: string, options?: Partial<BatchRequest>): this {
    this.requests.push({
      id,
      endpoint,
      ...options,
    })
    return this
  }

  async execute(): Promise<Map<string, BatchResponse>> {
    const responses = await batchApiCall(this.requests)
    return new Map(responses.map((res) => [res.id, res]))
  }

  clear(): void {
    this.requests = []
  }
}

/**
 * 대시보드용 배치 데이터 페처
 * 여러 대시보드 API를 한 번에 호출
 */
export async function fetchDashboardDataBatch() {
  const builder = new BatchRequestBuilder()

  builder
    .add('activities', '/api/activities/realtime')
    .add('errors', '/api/admin/monitoring/errors')
    .add('traffic', '/api/admin/monitoring/traffic')
    .add('stats', '/api/admin/stats')

  const results = await builder.execute()

  return {
    activities: results.get('activities')?.data,
    errors: results.get('errors')?.data,
    traffic: results.get('traffic')?.data,
    stats: results.get('stats')?.data,
  }
}
