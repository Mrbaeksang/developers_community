'use client'

import { useState, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { useInfiniteQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Users,
  Shield,
  Crown,
  User,
  Search,
  ChevronDown,
  MessageSquare,
  FileText,
} from 'lucide-react'
import { PageLoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/core/utils'

interface Member {
  id: string
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    name?: string
    username?: string
    image?: string
    bio?: string
    postCount: number
    commentCount: number
  }
}

interface MemberPage {
  members: Member[]
  nextPage: number | null
}

interface CommunityMemberListProps {
  communityId: string
}

const roleIcons = {
  OWNER: <Crown className="h-4 w-4" />,
  ADMIN: <Shield className="h-4 w-4" />,
  MODERATOR: <User className="h-4 w-4" />,
  MEMBER: null,
}

const roleColors = {
  OWNER: 'bg-yellow-500 text-white',
  ADMIN: 'bg-red-500 text-white',
  MODERATOR: 'bg-blue-500 text-white',
  MEMBER: 'bg-gray-200 text-gray-700',
}

const roleLabels = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MODERATOR: '모더레이터',
  MEMBER: '멤버',
}

// 멤버 가져오기 함수
const fetchMembers = async ({
  pageParam = 1,
  search,
  roleFilter,
  communityId,
}: {
  pageParam?: number
  search: string
  roleFilter: string | null
  communityId: string
}) => {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: '20',
  })

  if (search) {
    params.append('search', search)
  }

  if (roleFilter) {
    params.append('role', roleFilter)
  }

  const res = await fetch(`/api/communities/${communityId}/members?${params}`)
  if (!res.ok) throw new Error('Failed to fetch members')

  const data = await res.json()

  // 새로운 응답 형식 처리: { success: true, data: { members } }
  const membersData =
    data.success && data.data ? data.data.members : data.members || []
  const membersList = Array.isArray(membersData) ? membersData : []

  return {
    members: membersList,
    nextPage: membersList.length === 20 ? pageParam + 1 : null,
  }
}

export default function CommunityMemberList({
  communityId,
}: CommunityMemberListProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // React Query 무한 스크롤
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<MemberPage>({
    queryKey: ['communityMembers', communityId, debouncedSearch, roleFilter],
    queryFn: ({ pageParam }) =>
      fetchMembers({
        pageParam: pageParam as number,
        search: debouncedSearch,
        roleFilter,
        communityId,
      }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시
  })

  const members = data?.pages.flatMap((page) => page.members) || []

  // 무한 스크롤
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const roleOptions = [
    { value: null, label: '전체 역할' },
    { value: 'OWNER', label: '소유자' },
    { value: 'ADMIN', label: '관리자' },
    { value: 'MODERATOR', label: '모더레이터' },
    { value: 'MEMBER', label: '일반 멤버' },
  ]

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 바 */}
      <div className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 사용자명으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-2 border-black"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                <Users className="h-4 w-4 mr-2" />
                {roleOptions.find((opt) => opt.value === roleFilter)?.label}
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-2 border-black">
              {roleOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value || 'all'}
                  onClick={() => setRoleFilter(option.value)}
                  className={cn(
                    'cursor-pointer',
                    roleFilter === option.value && 'bg-gray-100'
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 멤버 목록 */}
      <div className="grid gap-4 md:grid-cols-2">
        {members &&
          members.length > 0 &&
          members.map((member) => (
            <div
              key={member.id}
              className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 border-2 border-black">
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback className="font-bold text-lg">
                    {member.user.name?.[0] || member.user.username?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">
                      {member.user.name || member.user.username || 'Unknown'}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        roleColors[member.role as keyof typeof roleColors]
                      )}
                    >
                      <span className="flex items-center gap-1">
                        {roleIcons[member.role as keyof typeof roleIcons]}
                        {roleLabels[member.role as keyof typeof roleLabels]}
                      </span>
                    </Badge>
                  </div>

                  {member.user.username && member.user.name && (
                    <p className="text-sm text-muted-foreground mb-1">
                      @{member.user.username}
                    </p>
                  )}

                  {member.user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {member.user.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {member.user.postCount} 게시글
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {member.user.commentCount} 댓글
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(member.joinedAt), {
                      addSuffix: true,
                      locale: ko,
                    })}{' '}
                    가입
                  </p>
                </div>
              </div>
            </div>
          ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="col-span-full">
            <PageLoadingSpinner />
          </div>
        )}

        {/* 무한 스크롤 로딩 */}
        {isFetchingNextPage && (
          <div className="col-span-full">
            <PageLoadingSpinner />
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        {hasNextPage && !isFetchingNextPage && (
          <div ref={ref} className="h-1 col-span-full" />
        )}

        {/* 더 이상 멤버가 없을 때 */}
        {!hasNextPage && members.length > 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">
            모든 멤버를 불러왔습니다.
          </p>
        )}

        {/* 에러 상태 */}
        {isError && (
          <div className="col-span-full text-center py-12">
            <p className="text-destructive">
              멤버 목록을 불러오는데 실패했습니다.
            </p>
          </div>
        )}

        {/* 멤버가 없을 때 */}
        {!isLoading && !isError && members.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {debouncedSearch
                ? '검색 결과가 없습니다.'
                : '아직 멤버가 없습니다.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
// test
