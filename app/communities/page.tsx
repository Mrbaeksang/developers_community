import Link from 'next/link'
import {
  Users,
  Plus,
  Sparkles,
  Trophy,
  Activity,
  TrendingUp,
} from 'lucide-react'
import { formatCount } from '@/lib/common/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import CommunitySearchForm from '@/components/communities/community-search-form'
import { CommunityCard } from '@/components/communities/CommunityCard'

// ISR (Incremental Static Regeneration) 설정
// 120초(2분)마다 페이지를 재생성하여 Active CPU 사용량 감소
export const revalidate = 120

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  avatar: string | null
  banner: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  postCount: number
  createdAt?: string // optional이고 string만
  updatedAt?: string // optional이고 string만
  owner: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  _count: {
    members: number
    posts: number
  }
}

async function getCommunities(searchParams: {
  page?: string
  search?: string
}) {
  const page = searchParams.page || '1'
  const search = searchParams.search || ''

  try {
    // 프로덕션 환경에서는 직접 DB 조회
    const { prisma } = await import('@/lib/core/prisma')

    // 검색 조건 설정
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // 페이지네이션 설정
    const limit = 12
    const skip = (parseInt(page) - 1) * limit

    // 커뮤니티 조회
    const [rawCommunities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { memberCount: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: {
                where: {
                  status: 'ACTIVE',
                },
              },
              posts: true,
            },
          },
        },
      }),
      prisma.community.count({ where }),
    ])

    // Date를 string으로 변환
    const communities = rawCommunities.map((community) => ({
      ...community,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    }))

    return {
      communities,
      pagination: {
        total,
        page: parseInt(page),
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('Failed to fetch communities:', error)
    return {
      communities: [],
      pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
    }
  }
}

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const { communities, pagination } = await getCommunities(resolvedSearchParams)

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Modern Hero Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* 왼쪽: 제목 및 설명 */}
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-600 hidden sm:block" />
                <div>
                  <h1 className="text-2xl font-black flex items-center gap-2">
                    커뮤니티
                    <Badge className="px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-sm flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {(communities || []).length}개 활성
                    </Badge>
                  </h1>
                  <p className="text-sm text-gray-600 hidden sm:block">
                    개발자들의 지식 공유 공간
                  </p>
                </div>
              </div>

              {/* 오른쪽: 통계 및 버튼 */}
              <div className="flex items-center gap-6">
                {/* 통계 정보 */}
                <div className="hidden md:flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-800">
                      {formatCount(
                        (communities || []).reduce<number>(
                          (acc, c) => acc + c._count.members,
                          0
                        )
                      )}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      활성 멤버
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-800">
                      {formatCount(
                        (communities || []).reduce<number>(
                          (acc, c) => acc + c._count.posts,
                          0
                        )
                      )}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />총 게시글
                    </p>
                  </div>
                </div>

                {/* 새 커뮤니티 버튼 */}
                <Button
                  asChild
                  size="default"
                  className="group bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold"
                >
                  <Link href="/communities/new">
                    <Plus className="h-4 w-4 mr-1.5 group-hover:rotate-90 transition-transform" />
                    새 커뮤니티
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Improved Search Bar */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] p-1">
              <CommunitySearchForm
                initialSearch={resolvedSearchParams.search}
              />
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              인기 커뮤니티
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>실시간 업데이트</span>
            </div>
          </div>
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community: Community, index: number) => {
                // 색상 테마
                const colorThemes = [
                  {
                    bg: 'bg-blue-500',
                    card: 'bg-blue-50',
                    text: 'text-blue-600',
                  },
                  {
                    bg: 'bg-yellow-500',
                    card: 'bg-yellow-50',
                    text: 'text-yellow-600',
                  },
                  {
                    bg: 'bg-green-500',
                    card: 'bg-green-50',
                    text: 'text-green-600',
                  },
                  {
                    bg: 'bg-orange-500',
                    card: 'bg-orange-50',
                    text: 'text-orange-600',
                  },
                ]

                // TOP 3 랭킹 계산
                const sortedCommunities = [...communities].sort(
                  (a, b) =>
                    b._count.members +
                    b._count.posts -
                    (a._count.members + a._count.posts)
                )
                const rankIndex = sortedCommunities.findIndex(
                  (c) => c.id === community.id
                )

                return (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    variant="full"
                    index={index}
                    ranking={rankIndex + 1}
                    colorTheme={colorThemes[index % colorThemes.length]}
                  />
                )
              })}
            </div>
          ) : (
            <Card className="bg-yellow-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="py-20 text-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-blue-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold mx-auto">
                    <Users className="h-8 w-8" />
                  </div>
                </div>

                <h3 className="font-black text-2xl mb-4 text-gray-800">
                  첫 번째 커뮤니티를 만들어보세요
                </h3>
                <p className="text-gray-700 mb-8 text-lg font-medium max-w-md mx-auto">
                  당신의 아이디어로 개발자들이 모이는 특별한 공간을 만들어보세요
                </p>

                <Button
                  asChild
                  size="lg"
                  className="bg-yellow-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-yellow-600"
                >
                  <Link href="/communities/new">
                    <Plus className="h-5 w-5 mr-2" />
                    지금 시작하기
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-12">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <Link
                  key={pageNum}
                  href={`/communities?page=${pageNum}`}
                  className={`px-6 py-3 font-bold border-2 border-black transition-all duration-200 ${
                    pagination.page === pageNum
                      ? 'bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-blue-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
