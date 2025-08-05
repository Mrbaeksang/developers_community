'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestMonitoringPage() {
  const [results, setResults] = useState<string[]>([])

  const testApiCall = async () => {
    try {
      const res = await fetch('/api/test-monitoring')
      const data = await res.json()
      setResults((prev) => [...prev, `GET success: ${JSON.stringify(data)}`])
    } catch (error) {
      setResults((prev) => [...prev, `GET error: ${error}`])
    }
  }

  const testErrorCall = async () => {
    try {
      const res = await fetch('/api/test-monitoring', { method: 'POST' })
      const data = await res.json()
      setResults((prev) => [...prev, `POST response: ${JSON.stringify(data)}`])
    } catch (error) {
      setResults((prev) => [...prev, `POST error: ${error}`])
    }
  }

  const testMultipleCalls = async () => {
    for (let i = 0; i < 10; i++) {
      await testApiCall()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>모니터링 테스트</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testApiCall}>API 호출 테스트</Button>
            <Button onClick={testErrorCall} variant="destructive">
              에러 발생 테스트
            </Button>
            <Button onClick={testMultipleCalls} variant="secondary">
              다중 호출 테스트 (10회)
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">결과:</h3>
            <div className="bg-gray-100 p-4 rounded space-y-1 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">테스트 결과가 여기에 표시됩니다</p>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              테스트 후{' '}
              <a href="/admin" className="text-blue-600 underline">
                관리자 페이지
              </a>
              에서 모니터링 데이터를 확인하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
