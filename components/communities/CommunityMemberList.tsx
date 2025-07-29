'use client'

import { useState, useEffect, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Users,
  Shield,
  Crown,
  User,
  Search,
  ChevronDown,
  Loader2,
  MessageSquare,
  FileText,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

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

export default function CommunityMemberList({
  communityId,
}: CommunityMemberListProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
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

  const fetchMembers = useCallback(
    async (pageNum: number, reset = false) => {
      if (isLoading || (!reset && !hasMore)) return

      setIsLoading(true)

      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: '20',
        })

        if (debouncedSearch) {
          params.append('search', debouncedSearch)
        }

        if (roleFilter) {
          params.append('role', roleFilter)
        }

        const res = await fetch(
          `/api/communities/${communityId}/members?${params}`
        )
        if (!res.ok) throw new Error('Failed to fetch members')

        const data = await res.json()

        if (reset) {
          setMembers(data.members)
        } else {
          setMembers((prev) => [...prev, ...data.members])
        }

        setHasMore(data.members.length === 20)
        setPage(pageNum)
      } catch (error) {
        console.error('Failed to fetch members:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [communityId, debouncedSearch, roleFilter, hasMore, isLoading]
  )

  // 초기 로드 및 필터 변경 시
  useEffect(() => {
    setMembers([])
    setPage(1)
    setHasMore(true)
    fetchMembers(1, true)
  }, [debouncedSearch, roleFilter, communityId, fetchMembers])

  // 무한 스크롤
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      fetchMembers(page + 1)
    }
  }, [inView, hasMore, isLoading, page, fetchMembers])

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
        {members.map((member) => (
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
                    className={cn('text-xs', roleColors[member.role])}
                  >
                    <span className="flex items-center gap-1">
                      {roleIcons[member.role]}
                      {roleLabels[member.role]}
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
          <div className="col-span-full flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {/* 무한 스크롤 트리거 */}
        {hasMore && !isLoading && (
          <div ref={ref} className="h-1 col-span-full" />
        )}

        {/* 더 이상 멤버가 없을 때 */}
        {!hasMore && members.length > 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">
            모든 멤버를 불러왔습니다.
          </p>
        )}

        {/* 멤버가 없을 때 */}
        {!isLoading && members.length === 0 && (
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
