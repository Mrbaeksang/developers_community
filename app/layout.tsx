import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { KakaoProvider } from '@/components/providers/KakaoProvider'
import { NotificationProvider } from '@/components/providers/NotificationProvider'
import { Header } from '@/components/layouts/Header'
import { Toaster } from '@/components/ui/sonner'
import { ChatProvider } from '@/components/providers/ChatProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
      </body>
    </html>
  )
}
