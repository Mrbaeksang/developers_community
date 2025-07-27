import { auth } from '@/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-5xl">
        <h1 className="mb-8 text-center text-4xl font-bold">
          개발자 커뮤니티 플랫폼
        </h1>
        
        <div className="mb-8 text-center">
          {session ? (
            <div className="space-y-4">
              <p className="text-lg">
                환영합니다, <span className="font-semibold">{session.user?.name || session.user?.email}</span>님!
              </p>
              <p className="text-sm text-gray-600">
                역할: {session.user?.role || 'USER'}
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/dashboard">
                  <Button>대시보드로 이동</Button>
                </Link>
                <Link href="/api/auth/signout">
                  <Button variant="outline">로그아웃</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-600">
                로그인하여 커뮤니티에 참여하세요
              </p>
              <Link href="/signin">
                <Button size="lg">로그인</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 text-xl font-semibold">자유게시판</h3>
            <p className="text-gray-600">
              자유롭게 이야기를 나누는 공간입니다
            </p>
          </div>
          
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 text-xl font-semibold">Q&A</h3>
            <p className="text-gray-600">
              개발 관련 질문과 답변을 주고받는 공간입니다
            </p>
          </div>
          
          <div className="rounded-lg border p-6">
            <h3 className="mb-2 text-xl font-semibold">커뮤니티</h3>
            <p className="text-gray-600">
              관심사별 커뮤니티를 만들고 참여하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}