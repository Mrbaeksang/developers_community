import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { KakaoProvider } from '@/components/providers/KakaoProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { Header } from '@/components/layouts/Header'
import { Footer } from '@/components/layout/Footer'
import { Toaster } from '@/components/ui/sonner'
import { ChatProvider } from '@/components/providers/ChatProvider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { VisitorTracker } from '@/components/shared/VisitorTracker'
import { PageViewTracker } from '@/components/shared/PageViewTracker'
import { AsyncErrorBoundary } from '@/components/error-boundary'
import { SessionExpiryWarning } from '@/components/auth/session-expiry-warning'
import { GoogleOneTapAuth } from '@/components/auth/GoogleOneTapAuth'
import { StructuredData } from '@/components/seo/StructuredData'
import { headers } from 'next/headers'

const notoSansKr = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: '바이브 코딩 | 코딩 공부 어디서 시작? 개발자 되려면? - Dev Community',
  description:
    '코딩 공부 어디서 시작할지 모르겠다면? 프로그래밍 언어 추천부터 신입 개발자 취업까지! ChatGPT 활용법, React 오류 해결, 포트폴리오 만들기까지 함께 배워요.',
  keywords:
    '코딩 공부 어디서 시작, 프로그래밍 언어 추천, 개발자 되려면, 신입 개발자 취업, 코딩 배우기 무료, 자바스크립트 오류, React 오류 해결, 포트폴리오 만들기, ChatGPT 활용법, 개발자 로드맵, 코딩테스트 준비, 부트캠프 후기',
  authors: [{ name: 'Dev Community' }],
  creator: 'Dev Community',
  publisher: 'Dev Community',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr',
    title: '바이브 코딩 | 코딩 공부 어디서 시작? 개발자 되려면?',
    description:
      '코딩 공부 어디서 시작할지 모르겠다면? 프로그래밍 언어 추천부터 신입 개발자 취업까지! ChatGPT 활용법, React 오류 해결까지 함께 배워요.',
    siteName: 'Dev Community',
  },
  twitter: {
    card: 'summary_large_image',
    title: '바이브 코딩 | 코딩 공부 어디서 시작? 개발자 되려면?',
    description:
      '코딩 공부 어디서 시작할지 모르겠다면? 프로그래밍 언어 추천부터 신입 개발자 취업까지! ChatGPT 활용법까지 함께 배워요.',
  },
  verification: {
    google: 'pSiQxASSNku0ts2bPM68Zn7pSH62w-uADUfbhK_0i_g',
    other: {
      'naver-site-verification': 'f7ae20505edbdeafa2f3dc522911e64a660e36fb',
    },
  },
  other: {
    'google-site-verification': 'pSiQxASSNku0ts2bPM68Zn7pSH62w-uADUfbhK_0i_g',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // middleware에서 설정한 nonce 가져오기
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || ''

  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script
          nonce={nonce}
          src="https://developers.kakao.com/sdk/js/kakao.js"
          async
        />
      </head>
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        <StructuredData type="website" />
        <StructuredData type="organization" />
        <AsyncErrorBoundary>
          <QueryProvider>
            <SessionProvider>
              <NotificationProvider>
                <KakaoProvider>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <Toaster richColors position="bottom-right" />
                  <SessionExpiryWarning />
                  <GoogleOneTapAuth />
                  <ChatProvider />
                  <VisitorTracker />
                  <PageViewTracker />
                  <Analytics />
                  <SpeedInsights />
                </KakaoProvider>
              </NotificationProvider>
            </SessionProvider>
          </QueryProvider>
        </AsyncErrorBoundary>
      </body>
    </html>
  )
}
