'use client'

import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import {
  Users,
  FileText,
  Lock,
  Globe,
  Crown,
  MessageCircle,
  TrendingUp,
  Trophy,
  Medal,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatCount } from '@/lib/common/types'
import { getDefaultAvatar } from '@/lib/community/utils'
import {
  getBannerUrl,
  getBannerType,
  getDefaultBannerById,
} from '@/lib/ui/banner'
import { getDefaultBlurPlaceholder } from '@/lib/ui/images'

interface CommunityCardProps {
  community: {
    id: string
    name: string
    slug: string
    description: string | null
    avatar: string | null
    banner?: string | null
    memberCount: number
    postCount: number
    visibility: 'PUBLIC' | 'PRIVATE'
    createdAt?: string
    updatedAt?: string
    owner?: {
      id?: string
      name: string | null
      email?: string
      image: string | null
    }
    _count?: {
      members: number
      posts: number
    }
  }
  currentUserRole?: 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER' | null
  showJoinButton?: boolean
  showStats?: boolean
  variant?: 'default' | 'compact' | 'featured' | 'full'
  className?: string
  onJoin?: (communityId: string) => void
  onLeave?: (communityId: string) => void
  index?: number
  ranking?: number
  colorTheme?: {
    bg: string
    card: string
    text: string
  }
}

const visibilityConfig = {
  PUBLIC: {
    icon: Globe,
    label: '공개',
    color: 'text-green-600',
    bgColor: 'bg-green-100 text-green-800',
  },
  PRIVATE: {
    icon: Lock,
    label: '비공개',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 text-orange-800',
  },
}

const roleConfig = {
  OWNER: {
    icon: Crown,
    label: '소유자',
    color: 'bg-yellow-100 text-yellow-800',
  },
  ADMIN: {
    icon: Crown,
    label: '관리자',
    color: 'bg-purple-100 text-purple-800',
  },
  MODERATOR: {
    icon: Users,
    label: '모더레이터',
    color: 'bg-blue-100 text-blue-800',
  },
  MEMBER: {
    icon: Users,
    label: '멤버',
    color: 'bg-gray-100 text-gray-800',
  },
}

// 활동 레벨 계산
function calculateActivityLevel(community: {
  postCount?: number
  memberCount?: number
  _count?: {
    posts: number
    members: number
  }
}) {
  const posts = community.postCount ?? community._count?.posts ?? 0
  const members = community.memberCount ?? community._count?.members ?? 1
  const avgPostsPerMember = posts / Math.max(members, 1)

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
function getRecentActivityText(updatedAt?: string) {
  if (!updatedAt) return ''
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

// 기본 색상 테마
const defaultColorThemes = [
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

export function CommunityCard({
  community,
  currentUserRole,
  showJoinButton = true,
  showStats = true,
  variant = 'default',
  className,
  onJoin,
  onLeave,
  index = 0,
  ranking,
  colorTheme,
}: CommunityCardProps) {
  const visibilityInfo = visibilityConfig[community.visibility]
  const roleInfo = currentUserRole ? roleConfig[currentUserRole] : null
  const VisibilityIcon = visibilityInfo.icon

  // 색상 테마 결정
  const theme =
    colorTheme || defaultColorThemes[index % defaultColorThemes.length]

  // 랭킹 배지
  const rankingBadge = ranking ? getRankingBadge(ranking) : null

  // 활동 레벨
  const activityLevel = calculateActivityLevel(community)

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (currentUserRole) {
      onLeave?.(community.id)
    } else {
      onJoin?.(community.id)
    }
  }

  if (variant === 'compact') {
    return (
      <Link href={`/communities/${community.id}`}>
        <Card
          className={cn(
            'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer',
            'bg-white',
            className
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* 아바타 */}
              {(() => {
                // 기본 아바타 체크
                if (community.avatar?.startsWith('default:')) {
                  const avatarName = community.avatar.replace('default:', '')
                  const defaultAvatar = getDefaultAvatar(avatarName)
                  if (defaultAvatar) {
                    return (
                      <div
                        className="h-10 w-10 border-2 border-black rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: defaultAvatar.color }}
                      >
                        {defaultAvatar.emoji}
                      </div>
                    )
                  }
                }
                // URL 아바타
                return (
                  <Avatar className="h-10 w-10 border-2 border-black">
                    <AvatarImage src={community.avatar || undefined} />
                    <AvatarFallback className="font-bold bg-primary/20">
                      {community.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )
              })()}

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm line-clamp-1">
                  {community.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {(
                      community._count?.members ??
                      community.memberCount ??
                      0
                    ).toLocaleString()}
                  </span>
                  <VisibilityIcon
                    className={cn('h-3 w-3', visibilityInfo.color)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link href={`/communities/${community.id}`}>
        <Card
          className={cn(
            'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-200',
            'bg-gradient-to-br from-white to-primary/5 cursor-pointer',
            className
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  // 기본 아바타 체크
                  if (community.avatar?.startsWith('default:')) {
                    const avatarName = community.avatar.replace('default:', '')
                    const defaultAvatar = getDefaultAvatar(avatarName)
                    if (defaultAvatar) {
                      return (
                        <div
                          className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: defaultAvatar.color }}
                        >
                          {defaultAvatar.emoji}
                        </div>
                      )
                    }
                  }
                  // URL 아바타
                  return (
                    <Avatar className="h-12 w-12 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <AvatarImage src={community.avatar || undefined} />
                      <AvatarFallback className="font-black text-lg bg-primary/20">
                        {community.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  )
                })()}
                <div>
                  <h3 className="font-black text-lg line-clamp-1">
                    {community.name}
                  </h3>
                  <Badge
                    className={cn(
                      'text-xs border-2 border-black font-semibold',
                      visibilityInfo.bgColor
                    )}
                  >
                    <VisibilityIcon className="h-3 w-3 mr-1" />
                    {visibilityInfo.label}
                  </Badge>
                </div>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 설명 */}
            {community.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {community.description}
              </p>
            )}

            {/* 통계 */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-blue-600">
                <Users className="h-4 w-4" />
                <span className="font-semibold">
                  {(
                    community._count?.members ??
                    community.memberCount ??
                    0
                  ).toLocaleString()}
                </span>
                <span className="text-muted-foreground">멤버</span>
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">
                  {(
                    community._count?.posts ??
                    community.postCount ??
                    0
                  ).toLocaleString()}
                </span>
                <span className="text-muted-foreground">게시글</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  // Full variant (for communities page)
  if (variant === 'full') {
    return (
      <Link href={`/communities/${community.id}`}>
        <Card
          className={cn(
            'h-full',
            theme.card,
            'border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
            'hover:translate-x-[-2px] hover:translate-y-[-2px]',
            'transition-all duration-200 cursor-pointer group overflow-hidden',
            className
          )}
        >
          {/* Banner Preview */}
          <div className="relative h-20 w-full">
            {(() => {
              const bannerType = getBannerType(community.banner || '')

              // 배너가 없는 경우 커뮤니티 ID 기반 기본 배너 적용
              if (bannerType === 'none') {
                // Use community ID to generate a deterministic banner
                const bannerIndex = community.id.charCodeAt(0) % 8
                const bannerColors = [
                  'ocean',
                  'sunset',
                  'forest',
                  'mountain',
                  'desert',
                  'city',
                  'night',
                  'meadow',
                ]
                const determinedBanner = `https://picsum.photos/1200/300?random=${bannerColors[bannerIndex]}`
                return (
                  <Image
                    src={determinedBanner}
                    alt={`${community.name} banner preview`}
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={getDefaultBlurPlaceholder('post')}
                  />
                )
              }

              // 기본 배너인 경우 그라데이션 또는 단색 배경 적용
              if (bannerType === 'default') {
                const bannerId = community.banner?.replace('default:', '')
                const defaultBanner = getDefaultBannerById(bannerId || '')

                if (defaultBanner) {
                  return (
                    <div
                      className={`absolute inset-0 ${defaultBanner.gradient}`}
                    />
                  )
                }
              }

              // Unsplash 이미지인 경우
              if (bannerType === 'unsplash' && community.banner) {
                const unsplashUrl = getBannerUrl(community.banner)
                return (
                  <Image
                    src={unsplashUrl}
                    alt={`${community.name} banner preview`}
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={getDefaultBlurPlaceholder('post')}
                  />
                )
              }

              // 업로드된 이미지인 경우
              if (bannerType === 'upload' && community.banner) {
                return (
                  <Image
                    src={community.banner}
                    alt={`${community.name} banner preview`}
                    fill
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL={getDefaultBlurPlaceholder('post')}
                  />
                )
              }

              // 기본 그라데이션 (fallback)
              return (
                <div className={`absolute inset-0 ${theme.bg} opacity-20`} />
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
                    const avatarName = community.avatar.replace('default:', '')
                    const defaultAvatar = getDefaultAvatar(avatarName)
                    if (defaultAvatar) {
                      return (
                        <div
                          className="w-10 h-10 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-2xl"
                          style={{ backgroundColor: defaultAvatar.color }}
                        >
                          {defaultAvatar.emoji}
                        </div>
                      )
                    }
                  }
                  // URL 아바타
                  if (
                    community.avatar &&
                    !community.avatar.startsWith('default:')
                  ) {
                    return (
                      <Image
                        src={community.avatar}
                        alt={community.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] object-cover"
                        placeholder="blur"
                        blurDataURL={getDefaultBlurPlaceholder('community')}
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
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5',
                    community.visibility === 'PUBLIC'
                      ? 'bg-white text-black'
                      : 'bg-gray-300 text-gray-700'
                  )}
                >
                  {community.visibility === 'PUBLIC' ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {community.visibility === 'PUBLIC' ? '공개' : '비공개'}
                </Badge>
              </div>
              {/* TOP 랭킹 뱃지 */}
              {rankingBadge && (
                <div
                  className={`${rankingBadge.color} text-white font-bold py-1 px-3 rounded-full text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1`}
                >
                  <rankingBadge.icon className="h-3 w-3" />
                  {rankingBadge.text}
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {community.name}
            </h3>
            <p className={`text-sm ${theme.text} font-medium`}>
              @{community.id}
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
                    {formatCount(
                      community._count?.members ?? community.memberCount ?? 0
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50/80 rounded-full border border-blue-200">
                  <MessageCircle className="size-3 text-blue-500" />
                  <span className="text-blue-600 text-xs font-medium">
                    {formatCount(
                      community._count?.posts ?? community.postCount ?? 0
                    )}
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
                {community.owner && (
                  <>
                    <Avatar className="size-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <AvatarImage src={community.owner.image || undefined} />
                      <AvatarFallback className="bg-primary/10 font-bold">
                        {community.owner.name?.[0] ||
                          community.owner.email?.[0]?.toUpperCase() ||
                          'U'}
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
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {community.updatedAt && (
                  <p className="text-xs text-gray-500">
                    {getRecentActivityText(community.updatedAt)}
                  </p>
                )}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xl">→</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    )
  }

  // Default variant
  return (
    <Link href={`/communities/${community.id}`}>
      <Card
        className={cn(
          'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
          'hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-shadow cursor-pointer',
          'bg-white',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* 아바타 */}
              {(() => {
                // 기본 아바타 체크
                if (community.avatar?.startsWith('default:')) {
                  const avatarName = community.avatar.replace('default:', '')
                  const defaultAvatar = getDefaultAvatar(avatarName)
                  if (defaultAvatar) {
                    return (
                      <div
                        className="h-12 w-12 border-2 border-black rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: defaultAvatar.color }}
                      >
                        {defaultAvatar.emoji}
                      </div>
                    )
                  }
                }
                // URL 아바타
                return (
                  <Avatar className="h-12 w-12 border-2 border-black">
                    <AvatarImage src={community.avatar || undefined} />
                    <AvatarFallback className="font-bold bg-primary/20">
                      {community.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )
              })()}

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg line-clamp-1">
                  {community.name}
                </h3>

                <div className="flex items-center gap-2">
                  {/* 공개 설정 배지 */}
                  <Badge
                    className={cn(
                      'text-xs border-2 border-black font-semibold',
                      visibilityInfo.bgColor
                    )}
                  >
                    <VisibilityIcon className="h-3 w-3 mr-1" />
                    {visibilityInfo.label}
                  </Badge>

                  {/* 사용자 역할 배지 */}
                  {roleInfo && (
                    <Badge
                      className={cn(
                        'text-xs border-2 border-black font-semibold',
                        roleInfo.color
                      )}
                    >
                      {roleInfo.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 가입 버튼 */}
            {showJoinButton && (
              <Button
                onClick={handleJoinClick}
                variant={currentUserRole ? 'outline' : 'default'}
                size="sm"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-semibold"
              >
                {currentUserRole ? '탈퇴' : '가입'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 설명 */}
          {community.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {community.description}
            </p>
          )}

          {/* 통계 */}
          {showStats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">
                  {(
                    community._count?.members ??
                    community.memberCount ??
                    0
                  ).toLocaleString()}
                </span>
                <span className="text-muted-foreground">멤버</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="font-semibold">
                  {(
                    community._count?.posts ??
                    community.postCount ??
                    0
                  ).toLocaleString()}
                </span>
                <span className="text-muted-foreground">게시글</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-purple-600" />
                <span className="text-muted-foreground">채팅</span>
              </div>
            </div>
          )}

          {/* 소유자 정보 */}
          {community.owner && (
            <div className="flex items-center gap-2 pt-2 border-t-2 border-gray-100">
              <Avatar className="h-6 w-6 border border-black">
                <AvatarImage src={community.owner.image || undefined} />
                <AvatarFallback className="text-xs">
                  {community.owner.name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {community.owner.name || '익명'} 님이 개설
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
