import { Button } from '@/components/ui/button'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { RiKakaoTalkFill } from 'react-icons/ri'
import { auth, signIn } from '@/auth'
import { redirect } from 'next/navigation'

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">로그인</h2>
          <p className="mt-2 text-sm text-gray-600">
            소셜 계정으로 간편하게 로그인하세요
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <form
            action={async () => {
              'use server'
              await signInWithProvider('github')
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full py-6 text-base"
            >
              <FaGithub className="mr-2 h-5 w-5" />
              GitHub로 로그인
            </Button>
          </form>

          <form
            action={async () => {
              'use server'
              await signInWithProvider('google')
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full py-6 text-base"
            >
              <FaGoogle className="mr-2 h-5 w-5 text-red-500" />
              Google로 로그인
            </Button>
          </form>

          <form
            action={async () => {
              'use server'
              await signInWithProvider('kakao')
            }}
          >
            <Button
              type="submit"
              variant="outline"
              className="w-full py-6 text-base"
            >
              <RiKakaoTalkFill className="mr-2 h-5 w-5 text-yellow-600" />
              카카오로 로그인
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          계속 진행하면{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            이용약관
          </a>{' '}
          및{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            개인정보처리방침
          </a>
          에 동의하는 것으로 간주됩니다.
        </div>
      </div>
    </div>
  )
}