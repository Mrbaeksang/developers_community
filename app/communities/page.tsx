import Link from 'next/link'
import { Users, Plus, Lock, Globe, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import CommunitySearchForm from '@/components/communities/community-search-form'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  avatar: string | null
  visibility: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  postCount: number
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities?page=${page}&search=${search}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      throw new Error('Failed to fetch communities')
    }

    const data = await res.json()
    return data
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
        {/* Hero Header */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black">커뮤니티</h1>
              <Badge className="px-3 py-1.5 bg-purple-500 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold">
                {communities.length}개 활성
              </Badge>
            </div>
            <p className="text-lg md:text-xl text-gray-700 mb-8 font-medium max-w-2xl mx-auto">
              관심사가 비슷한 개발자들과 함께 지식을 공유하고 성장하세요
            </p>
            <Button
              asChild
              size="lg"
              className="bg-purple-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-purple-600"
            >
              <Link href="/communities/new">
                <Plus className="h-5 w-5 mr-2" />새 커뮤니티 만들기
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                커뮤니티 찾기
              </h2>
              <p className="text-gray-600">
                관심 있는 기술이나 분야로 검색해보세요
              </p>
            </div>
            <CommunitySearchForm initialSearch={resolvedSearchParams.search} />
          </div>
        </div>

        {/* Communities Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-800 mb-2">
              활성 커뮤니티
            </h2>
            <p className="text-gray-600">
              지금 가장 활발한 개발자 커뮤니티들을 만나보세요
            </p>
          </div>
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community: Community, index: number) => {
                // HeroSection.tsx의 색상 테마 패턴 적용
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
                    bg: 'bg-purple-500',
                    card: 'bg-purple-50',
                    text: 'text-purple-600',
                  },
                ]
                const theme = colorThemes[index % colorThemes.length]

                return (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                  >
                    <Card
                      className={`h-full ${theme.card} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer group`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 ${theme.bg} border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold`}
                            >
                              <Users className="h-5 w-5" />
                            </div>
                            <Badge
                              className={`px-3 py-1.5 text-xs font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 ${
                                community.visibility === 'PUBLIC'
                                  ? `${theme.bg} text-white`
                                  : 'bg-gray-300 text-gray-700'
                              }`}
                            >
                              {community.visibility === 'PUBLIC' ? (
                                <Globe className="h-3 w-3" />
                              ) : (
                                <Lock className="h-3 w-3" />
                              )}
                              {community.visibility === 'PUBLIC'
                                ? '공개'
                                : '비공개'}
                            </Badge>
                          </div>
                        </div>

                        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {community.name}
                        </h3>
                        <p className={`text-sm ${theme.text} font-medium`}>
                          @{community.slug}
                        </p>
                      </CardHeader>

                      <CardContent className="pb-3">
                        {community.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {community.description}
                          </p>
                        )}

                        {/* 통계 정보 - PostCard.tsx 스타일 적용 */}
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100/80 rounded-full border border-gray-200">
                            <Users className="size-3 text-gray-600" />
                            <span className="text-gray-700 text-xs font-medium">
                              {community._count.members}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50/80 rounded-full border border-blue-200">
                            <MessageSquare className="size-3 text-blue-500" />
                            <span className="text-blue-600 text-xs font-medium">
                              {community._count.posts}
                            </span>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-3 border-t">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <AvatarImage
                                src={community.owner.image || undefined}
                              />
                              <AvatarFallback className="bg-primary/10 font-bold">
                                {community.owner.name?.[0] ||
                                  community.owner.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold line-clamp-1">
                                {community.owner.name || '익명'}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">
                                운영자
                              </span>
                            </div>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xl">→</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="bg-purple-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="py-20 text-center">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-purple-500 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold mx-auto">
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
                  className="bg-purple-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold text-purple-600"
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
                      ? 'bg-purple-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-purple-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
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
