import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { KakaoProvider } from '@/components/providers/KakaoProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { Header } from '@/components/layouts/Header'
import { Toaster } from '@/components/ui/sonner'
import { ChatProvider } from '@/components/providers/ChatProvider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const notoSansKr = Noto_Sans_KR({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: 'Dev Community - 개발자 커뮤니티',
  description: '개발자들을 위한 지식 공유 커뮤니티 플랫폼',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <script src="https://developers.kakao.com/sdk/js/kakao.js" async />
      </head>
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        <SessionProvider>
          <NotificationProvider>
            <KakaoProvider>
              <Header />
              <main>{children}</main>
              <Toaster richColors position="bottom-right" />
              <ChatProvider />
            </KakaoProvider>
          </NotificationProvider>
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
