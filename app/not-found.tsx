'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 h-4 w-64 bg-yellow-400 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
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

        {/* 버튼들 */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Home className="mr-2 h-5 w-5" />
            홈으로 돌아가기
          </Button>

          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
            className="w-full border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            이전 페이지
          </Button>
        </div>

        {/* 자주 찾는 페이지 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">자주 찾는 페이지</p>
          <div className="space-y-2">
            <Link
              href="/communities"
              className="block text-primary hover:text-primary/80 text-sm underline transition-colors"
            >
              커뮤니티
            </Link>
            <Link
              href="/posts"
              className="block text-primary hover:text-primary/80 text-sm underline transition-colors"
            >
              게시글
            </Link>
            <Link
              href="/profile"
              className="block text-primary hover:text-primary/80 text-sm underline transition-colors"
            >
              프로필
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
