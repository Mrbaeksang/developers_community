import Link from 'next/link'
import Image from 'next/image'
import {
  Users,
  Plus,
  Lock,
  Globe,
  MessageSquare,
  Trophy,
  Medal,
  Award,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import CommunitySearchForm from '@/components/communities/community-search-form'
import { formatCount } from '@/lib/post-format-utils'
import { getDefaultAvatar } from '@/lib/community-utils'
import {
  getBannerUrl,
  getBannerType,
  getDefaultBannerById,
} from '@/lib/banner-utils'

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
  createdAt: string
  updatedAt: string
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

// 커뮤니티 활동 레벨 계산
function calculateActivityLevel(community: Community) {
  const avgPostsPerMember =
    community.postCount / Math.max(community.memberCount, 1)

  if (avgPostsPerMember > 0.5)
    return { level: '활발함', color: 'bg-green-300 text-green-900' }
  if (avgPostsPerMember > 0.2)
    return { level: '보통', color: 'bg-yellow-300 text-yellow-900' }
  return { level: '조용함', color: 'bg-red-300 text-red-900' }
}

// TOP 랭킹 아이콘과 색상
function getRankingBadge(rank: number) {
  if (rank === 1) return { icon: Trophy, color: 'bg-red-500', text: 'TOP 1' }
  if (rank === 2) return { icon: Medal, color: 'bg-blue-500', text: 'TOP 2' }
  if (rank === 3) return { icon: Award, color: 'bg-yellow-500', text: 'TOP 3' }
  return null
}

// 최근 활동 시간 계산
function getRecentActivityText(updatedAt: string) {
  const updated = new Date(updatedAt)
  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  return `${Math.floor(diffDays / 7)}주 전`
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
                      {communities.length}개 활성
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
                      {communities
                        .reduce(
                          (acc: number, c: Community) => acc + c.memberCount,
                          0
                        )
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      활성 멤버
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-gray-800">
                      {communities
                        .reduce(
                          (acc: number, c: Community) => acc + c.postCount,
                          0
                        )
                        .toLocaleString()}
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
                // 메인 페이지와 동일한 색상 테마 적용
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
                const theme = colorThemes[index % colorThemes.length]

                // TOP 3 랭킹 계산 (memberCount + postCount 기준)
                const sortedCommunities = [...communities].sort(
                  (a, b) =>
                    b.memberCount + b.postCount - (a.memberCount + a.postCount)
                )
                const rankIndex = sortedCommunities.findIndex(
                  (c) => c.id === community.id
                )
                const ranking = getRankingBadge(rankIndex + 1)

                // 활동 레벨 계산
                const activityLevel = calculateActivityLevel(community)

                return (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                  >
                    <Card
                      className={`h-full ${theme.card} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 cursor-pointer group overflow-hidden`}
                    >
                      {/* Banner Preview */}
                      <div className="relative h-20 w-full">
                        {(() => {
                          const bannerType = getBannerType(
                            community.banner || ''
                          )

                          // 배너가 없는 경우 랜덤 기본 배너 적용
                          if (bannerType === 'none') {
                            const randomBanner = getBannerUrl('')
                            return (
                              <Image
                                src={randomBanner}
                                alt={`${community.name} banner preview`}
                                fill
                                className="object-cover"
                              />
                            )
                          }

                          // 기본 배너인 경우 그라데이션 또는 단색 배경 적용
                          if (bannerType === 'default') {
                            const bannerId = community.banner?.replace(
                              'default:',
                              ''
                            )
                            const defaultBanner = getDefaultBannerById(
                              bannerId || ''
                            )

                            if (defaultBanner) {
                              return (
                                <div
                                  className={`absolute inset-0 ${defaultBanner.gradient}`}
                                />
                              )
                            }
                          }

                          // 업로드된 이미지인 경우
                          if (bannerType === 'upload' && community.banner) {
                            return (
                              <Image
                                src={community.banner}
                                alt={`${community.name} banner preview`}
                                fill
                                className="object-cover"
                              />
                            )
                          }

                          // 기본 그라데이션 (fallback)
                          return (
                            <div
                              className={`absolute inset-0 ${theme.bg} opacity-20`}
                            />
                          )
                        })()}
                      </div>

                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* 커뮤니티 아바타 또는 기본 아이콘 */}
                            {(() => {
                              // 기본 아바타 체크
                              if (community.avatar?.startsWith('default:')) {
                                const avatarName = community.avatar.replace(
                                  'default:',
                                  ''
                                )
                                const defaultAvatar =
                                  getDefaultAvatar(avatarName)
                                if (defaultAvatar) {
                                  return (
                                    <div
                                      className="w-10 h-10 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-2xl"
                                      style={{
                                        backgroundColor: defaultAvatar.color,
                                      }}
                                    >
                                      {defaultAvatar.emoji}
                                    </div>
                                  )
                                }
                              }
                              // URL 아바타
                              if (community.avatar) {
                                return (
                                  <Image
                                    src={community.avatar}
                                    alt={community.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
                                  />
                                )
                              }
                              // 아바타 없음
                              return (
                                <div
                                  className={`w-10 h-10 ${theme.bg} border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-white font-bold rounded-lg`}
                                >
                                  <Users className="h-5 w-5" />
                                </div>
                              )
                            })()}
                            <Badge
                              className={`px-3 py-1.5 text-xs font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 ${
                                community.visibility === 'PUBLIC'
                                  ? `bg-white text-black`
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
                          {/* TOP 랭킹 뱃지 */}
                          {ranking && (
                            <div
                              className={`${ranking.color} text-white font-bold py-1 px-3 rounded-full text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1`}
                            >
                              <ranking.icon className="h-3 w-3" />
                              {ranking.text}
                            </div>
                          )}
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

                        {/* 통계 정보 및 활동 레벨 */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100/80 rounded-full border border-gray-200">
                              <Users className="size-3 text-gray-600" />
                              <span className="text-gray-700 text-xs font-medium">
                                {formatCount(community.memberCount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50/80 rounded-full border border-blue-200">
                              <MessageSquare className="size-3 text-blue-500" />
                              <span className="text-blue-600 text-xs font-medium">
                                {formatCount(community.postCount)}
                              </span>
                            </div>
                          </div>
                          {/* 활동 레벨 표시 */}
                          <Badge
                            className={`px-2 py-1 text-xs font-bold border-2 border-black ${activityLevel.color}`}
                          >
                            {activityLevel.level}
                          </Badge>
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

                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">
                              {getRecentActivityText(community.updatedAt)}
                            </p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xl">→</span>
                            </div>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
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
