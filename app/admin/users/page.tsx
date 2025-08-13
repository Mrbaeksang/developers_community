'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Shield,
  Ban,
  UserCheck,
  Search,
  CalendarIcon,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { GlobalRole } from '@prisma/client'
import { apiClient } from '@/lib/api/client'
import { getDefaultBlurPlaceholder } from '@/lib/ui/images'

interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  globalRole: GlobalRole
  isActive: boolean
  isBanned: boolean
  banReason: string | null
  banUntil: string | null
  emailVerified: string | null
  createdAt: string
  _count: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    communityComments: number
  }
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<GlobalRole | 'ALL'>('ALL')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'BANNED' | 'INACTIVE'
  >('ALL')

  // 밴 다이얼로그
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState('')
  const [banUntil, setBanUntil] = useState<Date | undefined>()

  // 역할 변경 다이얼로그
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<GlobalRole>('USER')

  // React Query로 사용자 목록 가져오기
  const {
    data: users = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const result = await response.json()

      // 새로운 응답 형식 처리: { success: true, data: users }
      return result.success && result.data ? result.data : result
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  })

  // 사용자 차단 mutation
  const banUserMutation = useMutation({
    mutationFn: async ({
      userId,
      banReason,
      banUntil,
    }: {
      userId: string
      banReason: string
      banUntil?: string
    }) => {
      const response = await apiClient(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banReason,
          banUntil,
        }),
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to ban user')
      }

      return { userId, banReason, banUntil }
    },
    onMutate: async ({ userId, banReason, banUntil }) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })

      const previousUsers = queryClient.getQueryData(['admin-users'])

      // 사용자 목록에서 차단 상태 즉시 반영
      queryClient.setQueryData(['admin-users'], (old: User[] = []) =>
        old.map((user: User) =>
          user.id === userId
            ? {
                ...user,
                isBanned: true,
                banReason,
                banUntil,
                isActive: false,
              }
            : user
        )
      )

      // 즉시 성공 피드백 표시
      toast.success('사용자가 차단되었습니다.')

      return { previousUsers }
    },
    onSuccess: () => {
      setBanDialogOpen(false)
      setBanReason('')
      setBanUntil(undefined)
      setSelectedUser(null)
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousUsers) {
        queryClient.setQueryData(['admin-users'], context.previousUsers)
      }
      toast.error(error.message || '사용자 차단 중 오류가 발생했습니다.')
    },
  })

  const handleBan = () => {
    if (!selectedUser || !banReason) {
      toast.error('밴 사유를 입력해주세요.')
      return
    }

    banUserMutation.mutate({
      userId: selectedUser.id,
      banReason,
      banUntil: banUntil?.toISOString(),
    })
  }

  // 사용자 차단 해제 mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to unban user')
      }

      return userId
    },
    onMutate: async (userId) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })

      const previousUsers = queryClient.getQueryData(['admin-users'])

      // 사용자 목록에서 차단 해제 상태 즉시 반영
      queryClient.setQueryData(['admin-users'], (old: User[] = []) =>
        old.map((user: User) =>
          user.id === userId
            ? {
                ...user,
                isBanned: false,
                banReason: null,
                banUntil: null,
                isActive: true,
              }
            : user
        )
      )

      // 즉시 성공 피드백 표시
      toast.success('사용자 차단이 해제되었습니다.')

      return { previousUsers }
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousUsers) {
        queryClient.setQueryData(['admin-users'], context.previousUsers)
      }
      toast.error(error.message || '차단 해제 중 오류가 발생했습니다.')
    },
  })

  const handleUnban = (userId: string) => {
    unbanUserMutation.mutate(userId)
  }

  // 사용자 역할 변경 mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string
      role: GlobalRole
    }) => {
      const response = await apiClient(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to change role')
      }

      return { userId, role }
    },
    onMutate: async ({ userId, role }) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })

      const previousUsers = queryClient.getQueryData(['admin-users'])

      // 사용자 목록에서 역할 즉시 반영
      queryClient.setQueryData(['admin-users'], (old: User[] = []) =>
        old.map((user: User) =>
          user.id === userId
            ? {
                ...user,
                globalRole: role,
              }
            : user
        )
      )

      // 즉시 성공 피드백 표시
      toast.success('사용자 역할이 변경되었습니다.')

      return { previousUsers }
    },
    onSuccess: () => {
      setRoleDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousUsers) {
        queryClient.setQueryData(['admin-users'], context.previousUsers)
      }
      toast.error(error.message || '역할 변경 중 오류가 발생했습니다.')
    },
  })

  const handleRoleChange = () => {
    if (!selectedUser) return

    changeRoleMutation.mutate({
      userId: selectedUser.id,
      role: newRole,
    })
  }

  // 사용자 활성화 상태 변경 mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string
      isActive: boolean
    }) => {
      const response = await apiClient(`/api/admin/users/${userId}/active`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.success) {
        throw new Error(response.error || 'Failed to toggle active status')
      }

      return { userId, newActiveStatus: !isActive }
    },
    onMutate: async ({ userId, isActive }) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['admin-users'] })

      const previousUsers = queryClient.getQueryData(['admin-users'])
      const newActiveStatus = !isActive

      // 사용자 목록에서 활성화 상태 즉시 반영
      queryClient.setQueryData(['admin-users'], (old: User[] = []) =>
        old.map((user: User) =>
          user.id === userId
            ? {
                ...user,
                isActive: newActiveStatus,
              }
            : user
        )
      )

      // 즉시 성공 피드백 표시
      toast.success(
        `계정이 ${newActiveStatus ? '활성화' : '비활성화'}되었습니다.`
      )

      return { previousUsers }
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousUsers) {
        queryClient.setQueryData(['admin-users'], context.previousUsers)
      }
      toast.error(error.message || '계정 상태 변경 중 오류가 발생했습니다.')
    },
  })

  const handleToggleActive = (userId: string, isActive: boolean) => {
    toggleActiveMutation.mutate({ userId, isActive })
  }

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesRole = roleFilter === 'ALL' || user.globalRole === roleFilter

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'BANNED' && user.isBanned) ||
      (statusFilter === 'ACTIVE' && user.isActive && !user.isBanned) ||
      (statusFilter === 'INACTIVE' && !user.isActive && !user.isBanned)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: GlobalRole) => {
    const variants = {
      ADMIN: { label: '관리자', className: 'bg-red-100 text-red-800' },
      MANAGER: { label: '매니저', className: 'bg-blue-100 text-blue-800' },
      USER: { label: '일반', className: 'bg-gray-100 text-gray-800' },
    }
    const variant = variants[role]
    return (
      <Badge className={cn('font-medium', variant.className)}>
        {variant.label}
      </Badge>
    )
  }

  const getStatusBadge = (user: User) => {
    if (user.isBanned) {
      return <Badge variant="destructive">차단됨</Badge>
    }
    if (!user.isActive) {
      return <Badge variant="secondary">비활성</Badge>
    }
    if (!user.emailVerified) {
      return <Badge variant="outline">미인증</Badge>
    }
    return <Badge variant="default">정상</Badge>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
        <p className="text-muted-foreground">
          시스템에 등록된 모든 사용자를 관리합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="이메일 또는 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value as GlobalRole | 'ALL')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="역할 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">모든 역할</SelectItem>
            <SelectItem value="USER">일반 사용자</SelectItem>
            <SelectItem value="MANAGER">매니저</SelectItem>
            <SelectItem value="ADMIN">관리자</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as 'ALL' | 'ACTIVE' | 'BANNED' | 'INACTIVE')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">모든 상태</SelectItem>
            <SelectItem value="ACTIVE">활성</SelectItem>
            <SelectItem value="BANNED">차단됨</SelectItem>
            <SelectItem value="INACTIVE">비활성</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>사용자</TableHead>
              <TableHead>역할</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>활동</TableHead>
              <TableHead>가입일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    로딩 중...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden">
                          <Image
                            src={user.image}
                            alt={user.name || user.email || 'User avatar'}
                            fill
                            className="object-cover"
                            sizes="40px"
                            placeholder="blur"
                            blurDataURL={getDefaultBlurPlaceholder('profile')}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCog className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {user.name || '이름 없음'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.globalRole)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(user)}
                      {user.isBanned && user.banUntil && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(user.banUntil), 'yyyy-MM-dd')}까지
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        게시글:{' '}
                        {(user._count?.mainPosts || 0) +
                          (user._count?.communityPosts || 0)}
                      </div>
                      <div>
                        댓글:{' '}
                        {(user._count?.mainComments || 0) +
                          (user._count?.communityComments || 0)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'yyyy-MM-dd', {
                        locale: ko,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(user.id)}
                          disabled={unbanUserMutation.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          {unbanUserMutation.isPending
                            ? '해제 중...'
                            : '차단 해제'}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setBanDialogOpen(true)
                          }}
                          disabled={banUserMutation.isPending}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          차단
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setNewRole(user.globalRole)
                          setRoleDialogOpen(true)
                        }}
                        disabled={changeRoleMutation.isPending}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        역할
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleActive(user.id, user.isActive)
                        }
                        disabled={toggleActiveMutation.isPending}
                      >
                        {user.isActive ? (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            {toggleActiveMutation.isPending
                              ? '처리 중...'
                              : '비활성화'}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {toggleActiveMutation.isPending
                              ? '처리 중...'
                              : '활성화'}
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 밴 다이얼로그 */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 차단</DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email}님을 차단하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="banReason">차단 사유</Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="차단 사유를 입력하세요..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>차단 기간</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal mt-2',
                      !banUntil && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {banUntil
                      ? format(banUntil, 'PPP', { locale: ko })
                      : '영구 차단'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={banUntil}
                    onSelect={setBanUntil}
                    initialFocus
                    disabled={(date: Date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={banUserMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={banUserMutation.isPending}
            >
              {banUserMutation.isPending ? '차단 중...' : '차단'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 역할 변경 다이얼로그 */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
            <DialogDescription>
              {selectedUser?.name || selectedUser?.email}님의 역할을 변경합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>새 역할</Label>
              <Select
                value={newRole}
                onValueChange={(value) => setNewRole(value as GlobalRole)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">일반 사용자</SelectItem>
                  <SelectItem value="MANAGER">매니저</SelectItem>
                  <SelectItem value="ADMIN">관리자</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">
                    주의사항
                  </h4>
                  <div className="mt-2 text-sm text-amber-700">
                    <ul className="list-disc space-y-1 pl-5">
                      <li>ADMIN: 모든 권한</li>
                      <li>MANAGER: 콘텐츠 관리 권한</li>
                      <li>USER: 일반 사용자 권한</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={changeRoleMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={changeRoleMutation.isPending}
            >
              {changeRoleMutation.isPending ? '변경 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
