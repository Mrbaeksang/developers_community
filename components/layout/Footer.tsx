'use client'

import Link from 'next/link'
import { Instagram, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-black bg-yellow-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          {/* 브랜드 & 크레딧 */}
          <div>
            <h3 className="text-lg font-black">Dev Community</h3>
            <p className="mt-1 text-sm text-gray-600">
              © 2025 · Made by Baeksang
            </p>
          </div>

          {/* 링크 */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium">
            <Link href="/privacy" className="hover:underline">
              개인정보처리방침
            </Link>
            <span className="text-gray-400">|</span>
            <Link href="/terms" className="hover:underline">
              이용약관
            </Link>
            <span className="text-gray-400">|</span>
            <a
              href="mailto:qortkdgus95@gmail.com"
              className="flex items-center gap-1 hover:underline"
            >
              <Mail className="h-3 w-3" />
              문의하기
            </a>
          </div>

          {/* 소셜 링크 - 플로팅 채팅 버튼과 겹치지 않게 위치 조정 */}
          <div className="flex items-center gap-4 md:mr-20">
            <a
              href="https://www.instagram.com/baek.__.sang/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border-2 border-black bg-pink-200 p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
