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

const notoSansKr = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: '바이브 코딩 | 코딩 초보부터 AI 개발까지 - Dev Community',
  description:
    '바이브 코딩, 웹개발, AI 개발을 함께 배우는 초보자 친화적 개발자 커뮤니티. 코딩 입문부터 전문가까지 모든 레벨의 개발자가 함께 성장합니다.',
  keywords:
    '바이브 코딩, 코딩 초보, 웹개발, AI 개발, 프로그래밍 입문, 개발자 커뮤니티, 코딩 독학, Next.js, React, 개발 질문답변',
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
    url: 'https://developers-community-two.vercel.app',
    title: '바이브 코딩 | 코딩 초보부터 AI 개발까지',
    description:
      '바이브 코딩, 웹개발, AI 개발을 함께 배우는 초보자 친화적 개발자 커뮤니티',
    siteName: 'Dev Community',
  },
  twitter: {
    card: 'summary_large_image',
    title: '바이브 코딩 | 코딩 초보부터 AI 개발까지',
    description:
      '바이브 코딩, 웹개발, AI 개발을 함께 배우는 초보자 친화적 개발자 커뮤니티',
  },
  verification: {
    google: 'google-site-verification-code-here',
    other: {
      'naver-site-verification': 'naver-site-verification-code-here',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script src="https://developers.kakao.com/sdk/js/kakao.js" async />
      </head>
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
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
