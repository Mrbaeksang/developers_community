'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TestActionCard } from '@/components/admin/TestActionCard'
import { TestResultsPanel } from '@/components/admin/TestResultsPanel'
import { DataTableViewer } from '@/components/admin/DataTableViewer'
import {
  ChevronLeft,
  Database,
  FileText,
  Heart,
  Users,
  Building2,
  TestTube2,
  Loader2,
  Table,
} from 'lucide-react'

interface TestCenterContentProps {
  initialStats: {
    userCount: number
    mainPostCount: number
    mainCommentCount: number
    communityCount: number
    communityPostCount: number
    tagCount: number
  }
}

interface TestResult {
  id: string
  type: 'user' | 'post' | 'community' | 'comment' | 'like' | 'bookmark' | 'tag'
  title: string
  subtitle?: string
  createdAt: Date
  data: {
    message?: string
    created?: unknown
    [key: string]: unknown
  }
}

export function TestCenterContent({ initialStats }: TestCenterContentProps) {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  const refreshStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats({
          userCount: data.users,
          mainPostCount: data.mainPosts,
          mainCommentCount: data.mainComments,
          communityCount: data.communities,
          communityPostCount: data.communityPosts,
          tagCount: data.tags,
        })
      }
    } catch (error) {
      console.error('Failed to refresh stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActionResult = (result: {
    action: string
    endpoint: string
    params: Record<string, unknown>
    response: {
      message?: string
      created?: unknown
      [key: string]: unknown
    }
  }) => {
    // API 응답을 결과 패널용 형식으로 변환
    const { action, response } = result

    // 생성된 데이터 타입 판별
    let type: TestResult['type'] = 'user'
    const title = action
    let subtitle = response.message || '작업 완료'

    if (action.includes('사용자')) type = 'user'
    else if (action.includes('게시글')) type = 'post'
    else if (action.includes('커뮤니티')) type = 'community'
    else if (action.includes('댓글')) type = 'comment'
    else if (action.includes('좋아요')) type = 'like'
    else if (action.includes('북마크')) type = 'bookmark'
    else if (action.includes('태그')) type = 'tag'

    // 생성된 데이터 정보 추출
    if (response.created) {
      const count = Array.isArray(response.created)
        ? response.created.length
        : 1
      subtitle = `${count}개 항목 생성됨`
    }

    const newResult: TestResult = {
      id: Date.now().toString(),
      type,
      title,
      subtitle,
      createdAt: new Date(),
      data: response,
    }

    setTestResults((prev) => [newResult, ...prev])
  }

  const testActions = [
    {
      category: '사용자 데이터',
      icon: Users,
      actions: [
        {
          title: '테스트 사용자 생성',
          description: '상세 정보를 입력하여 사용자를 생성합니다',
          endpoint: '/api/admin/test-data/users',
          method: 'POST',
          params: {
            count: 1,
            name: '테스트사용자',
            email: 'test@example.com',
            globalRole: 'USER',
            image: '',
          },
          badge: `현재 ${stats.userCount}명`,
        },
        {
          title: '관리자 계정 생성',
          description: '상세 정보를 입력하여 관리자를 생성합니다',
          endpoint: '/api/admin/test-data/admin-user',
          method: 'POST',
          params: {
            role: 'ADMIN',
            name: '관리자',
            email: 'admin@example.com',
          },
        },
      ],
    },
    {
      category: '메인 사이트 데이터',
      icon: FileText,
      actions: [
        {
          title: '메인 게시글 생성',
          description: '상태를 선택하여 게시글을 생성합니다',
          endpoint: '/api/admin/test-data/main-posts',
          method: 'POST',
          params: {
            count: 1,
            status: 'PUBLISHED',
            title: '테스트 게시글',
            content: '테스트 내용입니다',
            categoryId: '',
          },
          badge: `현재 ${stats.mainPostCount}개`,
        },
        {
          title: '메인 댓글 생성',
          description: '특정 게시글에 댓글을 생성합니다',
          endpoint: '/api/admin/test-data/main-comments',
          method: 'POST',
          params: {
            postId: '',
            content: '테스트 댓글입니다',
          },
          badge: `현재 ${stats.mainCommentCount}개`,
        },
      ],
    },
    {
      category: '커뮤니티 데이터',
      icon: Building2,
      actions: [
        {
          title: '테스트 커뮤니티 생성',
          description: '멤버가 있는 활성 커뮤니티를 생성합니다',
          endpoint: '/api/admin/test-data/communities',
          method: 'POST',
          params: { count: 5 },
          badge: `현재 ${stats.communityCount}개`,
        },
        {
          title: '커뮤니티 게시글 생성',
          description: '랜덤 커뮤니티에 게시글을 생성합니다',
          endpoint: '/api/admin/test-data/community-posts',
          method: 'POST',
          params: { count: 30 },
          badge: `현재 ${stats.communityPostCount}개`,
        },
        {
          title: '커뮤니티 멤버 추가',
          description: '랜덤 커뮤니티에 멤버를 추가합니다',
          endpoint: '/api/admin/test-data/community-members',
          method: 'POST',
          params: { count: 20 },
        },
      ],
    },
    {
      category: '상호작용 데이터',
      icon: Heart,
      actions: [
        {
          title: '좋아요 생성',
          description: '특정 게시글에 좋아요를 추가합니다',
          endpoint: '/api/admin/test-data/likes',
          method: 'POST',
          params: {
            postId: '',
          },
        },
        {
          title: '북마크 생성',
          description: '특정 게시글에 북마크를 추가합니다',
          endpoint: '/api/admin/test-data/bookmarks',
          method: 'POST',
          params: {
            postId: '',
          },
        },
        {
          title: '태그 생성',
          description: '인기 태그들을 생성합니다',
          endpoint: '/api/admin/test-data/tags',
          method: 'POST',
          params: { count: 20 },
          badge: `현재 ${stats.tagCount}개`,
        },
      ],
    },
    {
      category: '데이터 관리',
      icon: Database,
      actions: [
        {
          title: '모든 테스트 데이터 삭제',
          description: '생성된 모든 테스트 데이터를 삭제합니다',
          endpoint: '/api/admin/test-data/reset',
          method: 'DELETE',
          params: {},
          danger: true,
        },
        {
          title: '기본 시드 데이터 재생성',
          description: '초기 시드 데이터를 다시 생성합니다',
          endpoint: '/api/admin/test-data/seed',
          method: 'POST',
          params: {},
        },
      ],
    },
  ]

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ChevronLeft className="h-4 w-4 mr-2" />
            관리자 대시보드로 돌아가기
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">테스트 센터</h1>
            <p className="text-muted-foreground">
              개발 및 테스트를 위한 데이터를 생성하고 관리합니다.
            </p>
          </div>
          <Button onClick={refreshStats} variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube2 className="h-4 w-4" />
            )}
            <span className="ml-2">통계 새로고침</span>
          </Button>
        </div>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          {testActions.map((section) => (
            <TabsTrigger
              key={section.category}
              value={section.category.replace(/\s+/g, '-').toLowerCase()}
            >
              <section.icon className="h-4 w-4 mr-2" />
              {section.category}
            </TabsTrigger>
          ))}
          <TabsTrigger value="data-viewer">
            <Table className="h-4 w-4 mr-2" />
            데이터 뷰어
          </TabsTrigger>
        </TabsList>

        {testActions.map((section) => (
          <TabsContent
            key={section.category}
            value={section.category.replace(/\s+/g, '-').toLowerCase()}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {section.actions.map((action, index) => (
                <TestActionCard
                  key={index}
                  {...action}
                  onSuccess={refreshStats}
                  onResult={handleActionResult}
                />
              ))}
            </div>
          </TabsContent>
        ))}

        {/* 데이터 테이블 뷰어 */}
        <TabsContent value="data-viewer" className="space-y-4">
          <DataTableViewer />
        </TabsContent>
      </Tabs>

      {/* 결과 패널 */}
      <TestResultsPanel
        results={testResults}
        onClear={() => setTestResults([])}
      />
    </div>
  )
}
