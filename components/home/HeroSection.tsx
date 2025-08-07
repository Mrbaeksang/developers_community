'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Activity } from '@/types/activity'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'

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
        const [mainRes, freeRes, qnaRes, communityRes] = await Promise.all([
          fetch('/api/main/posts?limit=1'),
          fetch('/api/main/posts?category=free&limit=1'),
          fetch('/api/main/posts?category=qna&limit=1'),
          fetch('/api/communities?limit=1'),
        ])

        const [mainData, freeData, qnaData, communityData] = await Promise.all([
          mainRes.json(),
          freeRes.json(),
          qnaRes.json(),
          communityRes.json(),
        ])

        const totalMainPosts = mainData.pagination?.total || 0
        const totalFreePosts = freeData.pagination?.total || 0
        const totalQnaPosts = qnaData.pagination?.total || 0

        // 검증된 글 = 전체 메인 게시글 - (자유게시판 + Q&A)
        const verifiedPostsCount =
          totalMainPosts - totalFreePosts - totalQnaPosts

        setStats({
          mainPosts: totalMainPosts,
          freePosts: totalFreePosts,
          qnaPosts: totalQnaPosts,
          communities: communityData.pagination?.total || 0,
          verifiedPosts: verifiedPostsCount > 0 ? verifiedPostsCount : 0,
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
                    {stats.freePosts || '1.2K'}+
                  </span>{' '}
                  활발한 토론
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

          {/* 오른쪽: 실시간 활동 피드 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              실시간 활동
            </h3>
            <RealtimeActivityFeed />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// 실시간 활동 피드 컴포넌트
function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/activities/realtime')
        const data = await res.json()
        setActivities(data.data?.activities || data.activities || [])
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    // 30초마다 갱신
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <SkeletonLoader lines={3} className="space-y-3" />
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">아직 활동이 없습니다</p>
      </div>
    )
  }

  // 활동 타입별 아이콘과 색상
  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'post':
        return { icon: '📝', color: 'text-blue-600' }
      case 'comment':
        return { icon: '💬', color: 'text-green-600' }
      case 'like':
        return { icon: '❤️', color: 'text-red-600' }
      case 'member_join':
        return { icon: '🎉', color: 'text-purple-600' }
      case 'view_milestone':
        return { icon: '🔥', color: 'text-orange-600' }
      default:
        return { icon: '📌', color: 'text-gray-600' }
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return '방금 전'
    if (diffMins < 60) return `${diffMins}분 전`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}시간 전`
    return `${Math.floor(diffHours / 24)}일 전`
  }

  return (
    <div className="space-y-0 max-h-[400px] overflow-y-auto">
      {activities.map((activity, index) => {
        const style = getActivityStyle(activity.type)
        return (
          <div key={activity.id} className="relative">
            <div className="flex items-start gap-2 pb-3">
              <div className="relative">
                <span className="text-lg relative z-10" role="img">
                  {style.icon}
                </span>
                {/* 세로 연결선 */}
                {index < activities.length - 1 && (
                  <div className="absolute left-1/2 top-7 -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-gray-300 to-gray-100" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className={`font-semibold ${style.color}`}>
                    {activity.userName}
                  </span>
                  <span className="text-gray-600">
                    님이 {activity.description}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTime(activity.timestamp)}
                </p>
              </div>
            </div>
            {/* 가로 구분선 */}
            {index < activities.length - 1 && (
              <div className="ml-7 mr-2 h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent mb-3" />
            )}
          </div>
        )
      })}
    </div>
  )
}
