'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

interface GoogleOneTapAuthProps {
  clientId?: string
}

interface CredentialResponse {
  credential: string
  select_by: string
  client_id: string
}

interface PromptMomentNotification {
  getMomentType: () => 'display' | 'skipped' | 'dismissed'
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
  getDismissedReason?: () => string
}

interface GoogleAccountsConfig {
  client_id: string
  callback: (response: CredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  prompt_parent_id?: string
  nonce?: string
  context?: 'signin' | 'signup' | 'use'
  state_cookie_domain?: string
  ux_mode?: 'popup' | 'redirect'
  login_uri?: string
  native_callback?: () => void
  intermediate_iframe_close_callback?: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleAccountsConfig) => void
          prompt: (
            callback?: (notification: PromptMomentNotification) => void
          ) => void
          disableAutoSelect: () => void
          cancel: () => void
        }
      }
    }
  }
}

export function GoogleOneTapAuth({
  clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
}: GoogleOneTapAuthProps) {
  const { status } = useSession()
  const pathname = usePathname()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 로그인 페이지나 이미 로그인한 경우 표시하지 않음
    if (
      status === 'authenticated' ||
      pathname.includes('/login') ||
      pathname.includes('/register') ||
      pathname.includes('/auth')
    ) {
      return
    }

    // 페이지 로드 후 1초 뒤에 표시 (dev.to처럼)
    const timer = setTimeout(() => {
      if (status === 'unauthenticated') {
        setShowPrompt(true)
        setIsVisible(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [status, pathname])

  useEffect(() => {
    if (!showPrompt || !clientId) return

    const loadGoogleScript = () => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.body.appendChild(script)

      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: false,
          })

          // 사이드바 스타일로 표시
          setTimeout(() => {
            window.google?.accounts.id.prompt((notification) => {
              if (notification.getMomentType() === 'skipped') {
                // 사용자가 One Tap을 닫았거나 이미 표시됨
                setIsVisible(false)
              }
            })
          }, 500)
        }
      }
    }

    const handleCredentialResponse = async (response: CredentialResponse) => {
      try {
        // NextAuth Google Provider로 로그인
        const result = await signIn('google', {
          credential: response.credential,
          redirect: false,
        })

        if (result?.ok) {
          // 로그인 성공
          window.location.reload()
        }
      } catch (error) {
        console.error('Google One Tap login error:', error)
      }
    }

    loadGoogleScript()

    return () => {
      // Cleanup
      window.google?.accounts.id.cancel()
    }
  }, [showPrompt, clientId])

  // 사용자가 X 버튼을 눌렀을 때
  const handleClose = () => {
    setIsVisible(false)
    setShowPrompt(false)
    window.google?.accounts.id.cancel()

    // 세션 동안 다시 표시하지 않음
    sessionStorage.setItem('google-one-tap-closed', 'true')
  }

  // 세션 스토리지 체크
  useEffect(() => {
    if (sessionStorage.getItem('google-one-tap-closed') === 'true') {
      setShowPrompt(false)
      setIsVisible(false)
    }
  }, [])

  // dev.to 스타일의 커스텀 사이드바 (One Tap이 표시되지 않을 때 대체)
  if (
    isVisible &&
    status === 'unauthenticated' &&
    !pathname.includes('/login')
  ) {
    return (
      <div className="fixed right-4 top-20 z-50 w-80 animate-slide-in-right">
        <div className="relative rounded-lg border-2 border-gray-200 bg-white p-6 shadow-lg">
          <button
            onClick={handleClose}
            className="absolute right-2 top-2 rounded-full p-1 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>

          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              바이브코딩 커뮤니티 참여하기
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              개발자들과 함께 성장하세요
            </p>
          </div>

          <button
            onClick={() => signIn('google')}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            구글로 계속하기
          </button>

          <div className="mt-4 flex items-center gap-2">
            <span className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-500">또는</span>
            <span className="flex-1 border-t border-gray-200" />
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => signIn('github')}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub으로 계속하기
            </button>

            <button
              onClick={() => signIn('kakao')}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-4 py-3 text-sm font-medium text-[#000000] hover:bg-[#FDD835] transition-colors"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#000000"
                  d="M12 3c-5.514 0-10 3.476-10 7.755 0 2.857 1.997 5.351 4.964 6.69l-.766 2.79a.371.371 0 0 0 .566.421l3.412-2.259c.576.067 1.166.103 1.767.103 5.514 0 10-3.476 10-7.755C22 6.476 17.514 3 12 3z"
                />
              </svg>
              카카오로 계속하기
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            가입하면{' '}
            <a href="/terms" className="underline">
              이용약관
            </a>
            과{' '}
            <a href="/privacy" className="underline">
              개인정보처리방침
            </a>
            에 동의합니다
          </p>
        </div>
      </div>
    )
  }

  return null
}
