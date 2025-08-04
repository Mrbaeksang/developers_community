'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Search,
  Crown,
  Shield,
  ShieldCheck,
  User,
  MoreVertical,
  Loader2,
  UserX,
  Ban,
  Clock,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CommunityRole, MembershipStatus } from '@prisma/client'

interface Member {
  id: string
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  role: CommunityRole
  status: MembershipStatus
  joinedAt: string
}

interface MemberSettingsProps {
  communityId: string
  currentUserId: string
  isOwner: boolean
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MODERATOR: ShieldCheck,
  MEMBER: User,
}

const roleColors = {
  OWNER: 'bg-yellow-500 text-white',
  ADMIN: 'bg-red-500 text-white',
  MODERATOR: 'bg-blue-500 text-white',
  MEMBER: 'bg-gray-500 text-white',
}

const roleLabels = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MODERATOR: '중재자',
  MEMBER: '멤버',
}

// 멤버 목록 가져오기 함수
const fetchMembers = async ({
  communityId,
  page,
  searchQuery,
  roleFilter,
  status,
}: {
  communityId: string
  page: number
  searchQuery?: string
  roleFilter?: CommunityRole | 'ALL'
  status: string
}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20',
    status,
  })

  if (searchQuery) params.append('search', searchQuery)
  if (roleFilter && roleFilter !== 'ALL') params.append('role', roleFilter)

  const res = await fetch(`/api/communities/${communityId}/members?${params}`)
  if (!res.ok) throw new Error('멤버 목록을 불러오는데 실패했습니다.')

  return res.json()
}

export function MemberSettings({
  communityId,
  currentUserId,
  isOwner,
}: MemberSettingsProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<CommunityRole | 'ALL'>('ALL')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [actionType, setActionType] = useState<
    'role' | 'kick' | 'ban' | 'approve' | 'reject' | null
  >(null)
  const [newRole, setNewRole] = useState<CommunityRole | null>(null)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState('members')

  // 활성 멤버 목록 React Query
  const {
    data: membersData,
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: [
      'communityMembers',
      communityId,
      page,
      searchQuery,
      roleFilter,
      'ACTIVE',
    ],
    queryFn: () =>
      fetchMembers({
        communityId,
        page,
        searchQuery,
        roleFilter,
        status: 'ACTIVE',
      }),
    enabled: activeTab === 'members',
    staleTime: 2 * 60 * 1000, // 2분간 fresh
    gcTime: 5 * 60 * 1000, // 5분간 캐시
  })

  // 대기 중인 멤버 목록 React Query
  const {
    data: pendingData,
    isLoading: pendingLoading,
    error: pendingError,
  } = useQuery({
    queryKey: [
      'communityMembers',
      communityId,
      page,
      searchQuery,
      roleFilter,
      'PENDING',
    ],
    queryFn: () =>
      fetchMembers({
        communityId,
        page,
        searchQuery,
        roleFilter,
        status: 'PENDING',
      }),
    enabled: activeTab === 'pending',
    staleTime: 1 * 60 * 1000, // 1분간 fresh (가입 신청은 더 자주 업데이트)
    gcTime: 3 * 60 * 1000, // 3분간 캐시
  })

  const members = membersData?.members || []
  const pendingMembers = pendingData?.members || []
  const totalPages =
    activeTab === 'members'
      ? membersData?.totalPages || 1
      : pendingData?.totalPages || 1
  const isLoading = activeTab === 'members' ? membersLoading : pendingLoading

  const error = activeTab === 'members' ? membersError : pendingError

  if (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : '멤버 목록을 불러오는데 실패했습니다.'
    )
  }

  // 역할 변경 mutation
  const roleChangeMutation = useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string
      role: CommunityRole
    }) => {
      const response = await apiClient(
        `/api/communities/${communityId}/members/${memberId}/role`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '역할 변경에 실패했습니다.')
      }

      return response.data
    },
    onSuccess: () => {
      toast.success('멤버 역할이 변경되었습니다.')
      // 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityMembers', communityId],
      })
      setSelectedMember(null)
      setActionType(null)
      setNewRole(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || '역할 변경에 실패했습니다.')
    },
  })

  const handleRoleChange = () => {
    if (!selectedMember || !newRole) return
    roleChangeMutation.mutate({ memberId: selectedMember.id, role: newRole })
  }

  // 멤버 추방/차단 mutation
  const kickBanMutation = useMutation({
    mutationFn: async ({
      memberId,
      actionType,
    }: {
      memberId: string
      actionType: 'kick' | 'ban'
    }) => {
      const response = await apiClient(
        `/api/communities/${communityId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ban: actionType === 'ban' }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '작업에 실패했습니다.')
      }

      return response.data
    },
    onSuccess: (_, { actionType }) => {
      toast.success(
        actionType === 'kick'
          ? '멤버가 추방되었습니다.'
          : '멤버가 차단되었습니다.'
      )
      // 멤버 목록 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityMembers', communityId],
      })
      setSelectedMember(null)
      setActionType(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || '작업에 실패했습니다.')
    },
  })

  const handleKickOrBan = () => {
    if (!selectedMember || !actionType) return
    kickBanMutation.mutate({
      memberId: selectedMember.id,
      actionType: actionType as 'kick' | 'ban',
    })
  }

  // 가입 신청 승인/거절 mutation
  const joinRequestMutation = useMutation({
    mutationFn: async ({
      memberId,
      action,
    }: {
      memberId: string
      action: 'approve' | 'reject'
    }) => {
      const response = await apiClient(
        `/api/communities/${communityId}/members/${memberId}/request`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '작업에 실패했습니다.')
      }

      return response.data
    },
    onSuccess: (_, { action }) => {
      toast.success(
        action === 'approve'
          ? '가입 신청이 승인되었습니다.'
          : '가입 신청이 거절되었습니다.'
      )
      // 멤버 목록 쿼리 무효화 (pending과 active 모두)
      queryClient.invalidateQueries({
        queryKey: ['communityMembers', communityId],
      })
      setSelectedMember(null)
      setActionType(null)
    },
    onError: (error: Error) => {
      toast.error(error.message || '작업에 실패했습니다.')
    },
  })

  const handleJoinRequest = () => {
    if (!selectedMember || !actionType) return
    joinRequestMutation.mutate({
      memberId: selectedMember.id,
      action: actionType as 'approve' | 'reject',
    })
  }

  const RoleIcon = ({ role }: { role: CommunityRole }) => {
    const Icon = roleIcons[role]
    return <Icon className="h-4 w-4" />
  }

  const MemberCard = ({ member }: { member: Member }) => (
    <Card className="border-2 border-black">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AuthorAvatar
              author={member.user}
              size="lg"
              enableDropdown
              dropdownAlign="start"
            />
            <div>
              <p className="font-bold">{member.user.name || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">
                {member.user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={roleColors[member.role]}>
              <RoleIcon role={member.role} />
              <span className="ml-1">{roleLabels[member.role]}</span>
            </Badge>

            {isOwner &&
              member.userId !== currentUserId &&
              member.role !== 'OWNER' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedMember(member)
                        setActionType('role')
                      }}
                    >
                      역할 변경
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedMember(member)
                        setActionType('kick')
                      }}
                      className="text-destructive"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      추방
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedMember(member)
                        setActionType('ban')
                      }}
                      className="text-destructive"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      차단
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          가입일:{' '}
          {formatDistanceToNow(new Date(member.joinedAt), {
            addSuffix: true,
            locale: ko,
          })}
        </div>

        {member.status === 'PENDING' && isOwner && (
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setSelectedMember(member)
                setActionType('approve')
              }}
              className="flex-1"
            >
              승인
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedMember(member)
                setActionType('reject')
              }}
              className="flex-1"
            >
              거절
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">멤버 관리</TabsTrigger>
          <TabsTrigger value="pending">
            가입 신청
            {pendingMembers.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingMembers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* 검색 및 필터 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="이름 또는 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(value) =>
                setRoleFilter(value as CommunityRole | 'ALL')
              }
            >
              <SelectTrigger className="w-[150px] border-2 border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="ADMIN">관리자</SelectItem>
                <SelectItem value="MODERATOR">중재자</SelectItem>
                <SelectItem value="MEMBER">멤버</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 멤버 목록 */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              멤버가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member: Member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="flex items-center px-3 text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : pendingMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>대기 중인 가입 신청이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingMembers.map((member: Member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 역할 변경 다이얼로그 */}
      <AlertDialog
        open={actionType === 'role' && !!selectedMember}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null)
            setActionType(null)
            setNewRole(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>멤버 역할 변경</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.user.name || selectedMember?.user.email}님의
              역할을 변경합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              value={newRole || selectedMember?.role}
              onValueChange={(value) => setNewRole(value as CommunityRole)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">관리자</SelectItem>
                <SelectItem value="MODERATOR">중재자</SelectItem>
                <SelectItem value="MEMBER">멤버</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              disabled={roleChangeMutation.isPending}
            >
              {roleChangeMutation.isPending ? '변경 중...' : '변경'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 추방/차단 확인 다이얼로그 */}
      <AlertDialog
        open={
          (actionType === 'kick' || actionType === 'ban') && !!selectedMember
        }
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null)
            setActionType(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'kick' ? '멤버 추방' : '멤버 차단'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.user.name || selectedMember?.user.email}님을
              {actionType === 'kick' ? ' 추방' : ' 차단'}하시겠습니까?
              {actionType === 'ban' &&
                ' 차단된 멤버는 다시 가입할 수 없습니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKickOrBan}
              disabled={kickBanMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {kickBanMutation.isPending
                ? '처리 중...'
                : actionType === 'kick'
                  ? '추방'
                  : '차단'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 가입 승인/거절 확인 다이얼로그 */}
      <AlertDialog
        open={
          (actionType === 'approve' || actionType === 'reject') &&
          !!selectedMember
        }
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMember(null)
            setActionType(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              가입 신청 {actionType === 'approve' ? '승인' : '거절'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember?.user.name || selectedMember?.user.email}님의 가입
              신청을
              {actionType === 'approve' ? ' 승인' : ' 거절'}하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleJoinRequest}
              disabled={joinRequestMutation.isPending}
              className={
                actionType === 'reject'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : ''
              }
            >
              {joinRequestMutation.isPending
                ? '처리 중...'
                : actionType === 'approve'
                  ? '승인'
                  : '거절'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
