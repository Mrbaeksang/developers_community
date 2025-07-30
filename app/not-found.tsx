'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Home } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 숫자 */}
        <div className="mb-8 relative">
          <h1 className="text-[10rem] font-black leading-none text-foreground">
            404
          </h1>
          {/* 노란색 악센트 바 - 404 텍스트 아래로 더 내리고 길게 */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-4 w-64 bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
        </div>

        {/* 메시지 */}
        <div className="mb-8 space-y-4 mt-12">
          <h2 className="text-2xl font-bold text-foreground">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground">
            요청하신 페이지가 존재하지 않거나 삭제되었습니다.
          </p>
        </div>

        {/* 버튼 */}
        <Button
          onClick={() => router.push('/')}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Home className="mr-2 h-5 w-5" />
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
