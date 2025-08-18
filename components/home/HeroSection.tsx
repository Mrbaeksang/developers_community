'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function HeroSection() {
  const [stats, setStats] = useState({
    mainPosts: 0,
    freePosts: 0,
    qnaPosts: 0,
    communities: 0,
    verifiedPosts: 0,
  })

  useEffect(() => {
    // 통계 데이터 가져오기
    const fetchStats = async () => {
      try {
        const [mainRes, freeRes, qnaRes, communityRes, verifiedRes] =
          await Promise.all([
            fetch('/api/main/posts?limit=1'),
            fetch('/api/main/posts?category=free&limit=1'),
            fetch('/api/main/posts?category=qna&limit=1'),
            fetch('/api/communities?limit=1'),
            // 검증된 글: free와 qna를 제외한 모든 카테고리
            fetch('/api/main/posts?limit=1&excludeCategories=free,qna'),
          ])

        const [mainData, freeData, qnaData, communityData, verifiedData] =
          await Promise.all([
            mainRes.json(),
            freeRes.json(),
            qnaRes.json(),
            communityRes.json(),
            verifiedRes.json(),
          ])

        const totalMainPosts = mainData?.pagination?.total || 0
        const totalFreePosts = freeData?.pagination?.total || 0
        const totalQnaPosts = qnaData?.pagination?.total || 0
        const totalCommunities = communityData?.pagination?.total || 0
        const totalVerifiedPosts = verifiedData?.pagination?.total || 0

        setStats({
          mainPosts: totalMainPosts,
          freePosts: totalFreePosts,
          qnaPosts: totalQnaPosts,
          communities: totalCommunities,
          verifiedPosts: totalVerifiedPosts > 0 ? totalVerifiedPosts : 0,
        })
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* 왼쪽: 사이트 소개 & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2"
          >
            <h1 className="text-4xl md:text-5xl font-black mb-6">
              Code. Connect. Create.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 font-medium">
              검증된 기술 콘텐츠와 활발한 커뮤니티가 함께하는
              <br />
              개발자 성장 플랫폼
            </p>

            {/* 4가지 핵심 기능 그리드 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link
                href="/main/posts"
                className="bg-blue-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all p-6 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <h3 className="font-bold text-lg">메인 게시글</h3>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  관리자가 검증한 양질의 기술 콘텐츠
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-bold text-blue-600">
                    {stats.verifiedPosts}개
                  </span>{' '}
                  검증된 글
                </div>
              </Link>

              <Link
                href="/main/posts?category=free"
                className="bg-yellow-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all p-6 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                    💬
                  </div>
                  <h3 className="font-bold text-lg">자유게시판</h3>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  자유로운 개발 이야기와 경험 공유
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-bold text-yellow-600">
                    {stats.freePosts}개
                  </span>{' '}
                  게시글
                </div>
              </Link>

              <Link
                href="/main/posts?category=qna"
                className="bg-green-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all p-6 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                    ?
                  </div>
                  <h3 className="font-bold text-lg">Q&A</h3>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  빠른 답변을 받는 기술 질문 공간
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-bold text-green-600">
                    {stats.qnaPosts}개
                  </span>{' '}
                  질문
                </div>
              </Link>

              <Link
                href="/communities"
                className="bg-purple-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all p-6 cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                    👥
                  </div>
                  <h3 className="font-bold text-lg">커뮤니티</h3>
                </div>
                <p className="text-sm text-gray-700 font-medium">
                  관심사별 그룹과 실시간 채팅
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="font-bold text-purple-600">
                    {stats.communities}개
                  </span>{' '}
                  활성 커뮤니티
                </div>
              </Link>
            </div>
          </motion.div>

          {/* 오른쪽: 사이트 소개 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {/* 사이트 소개 카드 */}
            <div className="bg-blue-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                  🏠
                </div>
                <h3 className="font-bold text-xl">개발자 커뮤니티</h3>
              </div>
              <p className="text-base text-gray-700 font-medium leading-relaxed flex-1">
                검증된 기술 정보와 자유 토론이 가능한 개발자 플랫폼입니다.
                <br />
                개인 커뮤니티 생성, 실시간 채팅, 파일 공유 등 다양한 기능을
                제공하며 개발자들의 네트워킹과 지식 공유를 위한 완벽한
                공간입니다.
              </p>
            </div>

            {/* GPT-5 Q&A 카드 */}
            <div className="bg-red-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                  🤖
                </div>
                <h3 className="font-bold text-xl">GPT-5 실시간 답변</h3>
              </div>
              <p className="text-base text-gray-700 font-medium leading-relaxed flex-1">
                Q&A 게시글을 작성하면{' '}
                <strong className="text-red-600">GPT-5</strong>가 자동으로
                전문적인 답변을 실시간 생성해드립니다.
                <br />
                복잡한 기술 문제부터 간단한 코딩 질문까지, 언제든지 즉시
                고품질의 해답을 받아보세요.
              </p>
              <div className="mt-4">
                <Link
                  href="/main/posts?category=qna"
                  className="inline-flex items-center text-base font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  질문하러 가기 →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
