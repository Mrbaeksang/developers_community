import { Button } from '@/components/ui/button'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { RiKakaoTalkFill } from 'react-icons/ri'
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { LogIn, Sparkles, Shield, Zap } from 'lucide-react'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  const params = await searchParams

  // If already logged in, redirect to callbackUrl or home
  if (session) {
    redirect(params.callbackUrl || '/')
  }

  async function signInWithProvider(provider: string) {
    'use server'
    await signIn(provider, {
      redirectTo: params.callbackUrl || '/',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 메인 카드 */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 relative overflow-hidden">
          {/* 장식 요소 */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-300 border-l-4 border-b-4 border-black -mr-1 -mt-1"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-300 border-r-4 border-t-4 border-black -ml-1 -mb-1"></div>

          {/* 헤더 */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-block mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                <LogIn className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-black mb-2 text-gray-900">
              Dev Community
            </h1>
            <p className="text-lg font-bold text-gray-700 mb-2">
              개발자들의 놀이터로 오신 것을 환영합니다!
            </p>
            <div className="text-sm text-gray-600">
              <span>간편하게 로그인하고 시작하세요</span>
            </div>
          </div>

          {/* 로그인 버튼들 */}
          <div className="space-y-4 relative z-10">
            {/* GitHub 로그인 */}
            <form
              action={async () => {
                'use server'
                await signInWithProvider('github')
              }}
            >
              <Button
                type="submit"
                className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 font-bold text-base"
              >
                <FaGithub className="mr-3 h-6 w-6" />
                GitHub로 계속하기
              </Button>
            </form>

            {/* Google 로그인 */}
            <form
              action={async () => {
                'use server'
                await signInWithProvider('google')
              }}
            >
              <Button
                type="submit"
                className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 font-bold text-base"
              >
                <FaGoogle className="mr-3 h-6 w-6 text-red-500" />
                Google로 계속하기
              </Button>
            </form>

            {/* 카카오 로그인 */}
            <form
              action={async () => {
                'use server'
                await signInWithProvider('kakao')
              }}
            >
              <Button
                type="submit"
                className="w-full h-14 bg-[#FEE500] hover:bg-[#FDD835] text-black border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 font-bold text-base"
              >
                <RiKakaoTalkFill className="mr-3 h-6 w-6 text-black" />
                카카오로 계속하기
              </Button>
            </form>
          </div>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 font-bold text-gray-700">
                소셜 계정으로 3초 가입
              </span>
            </div>
          </div>

          {/* 특징 배지들 */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-gray-100 border-2 border-black p-2 text-center">
              <Shield className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-bold">안전한 로그인</span>
            </div>
            <div className="bg-yellow-200 border-2 border-black p-2 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-bold">빠른 가입</span>
            </div>
            <div className="bg-blue-100 border-2 border-black p-2 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs font-bold">간편 인증</span>
            </div>
          </div>

          {/* 약관 동의 */}
          <div className="text-center text-xs text-gray-600 relative z-10">
            <p>
              계속 진행하면{' '}
              <a
                href="/terms"
                className="font-bold text-blue-600 hover:underline"
              >
                이용약관
              </a>{' '}
              및{' '}
              <a
                href="/privacy"
                className="font-bold text-blue-600 hover:underline"
              >
                개인정보처리방침
              </a>
              에
            </p>
            <p>동의하는 것으로 간주됩니다.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
