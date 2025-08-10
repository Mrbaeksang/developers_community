'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, UserCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'

interface AdminMember {
  id: string
  userId: string
  role: string
  status: string
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    username?: string | null
  }
}

interface AdvancedSettingsProps {
  community: {
    id: string
    name: string
    slug: string
  }
}

export function AdvancedSettings({ community }: AdvancedSettingsProps) {
  const router = useRouter()
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // 관리자 목록 불러오기
  const fetchAdminMembers = async () => {
    setIsLoadingAdmins(true)
    try {
      const res = await fetch(
        `/api/communities/${community.id}/members?role=ADMIN&status=ACTIVE`
      )
      if (res.ok) {
        const data = await res.json()
        // API 응답 구조에 맞게 데이터 추출
        const members = data.data?.items || data.items || []
        setAdminMembers(members)
      }
    } catch (error) {
      console.error('Failed to fetch admin members:', error)
    } finally {
      setIsLoadingAdmins(false)
    }
  }

  useEffect(() => {
    if (isTransferDialogOpen) {
      fetchAdminMembers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTransferDialogOpen, community.id])

  // 커뮤니티 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/communities/${community.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '삭제 실패')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success('커뮤니티가 삭제되었습니다')
      router.push('/communities')
    },
    onError: (error: Error) => {
      toast.error(error.message || '커뮤니티 삭제에 실패했습니다')
    },
  })

  // 소유권 이전 mutation
  const transferMutation = useMutation({
    mutationFn: async () => {
      const selectedAdmin = adminMembers.find(
        (m) => m.userId === selectedAdminId
      )
      if (!selectedAdmin) {
        throw new Error('관리자를 선택해주세요')
      }

      const res = await fetch(
        `/api/communities/${community.id}/transfer-ownership`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newOwnerEmail: selectedAdmin.user.email }),
        }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '소유권 이전 실패')
      }

      return res.json()
    },
    onSuccess: () => {
      toast.success('소유권이 성공적으로 이전되었습니다')
      setIsTransferDialogOpen(false)
      router.push(`/communities/${community.slug}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || '소유권 이전에 실패했습니다')
    },
  })

  const handleDelete = () => {
    if (deleteConfirmation !== community.name) {
      toast.error('커뮤니티 이름을 정확히 입력해주세요')
      return
    }
    deleteMutation.mutate()
  }

  const handleTransfer = () => {
    if (!selectedAdminId) {
      toast.error('새 소유자를 선택해주세요')
      return
    }
    transferMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {/* 소유권 이전 */}
      <Card className="border-yellow-500 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            소유권 이전
          </CardTitle>
          <CardDescription>
            커뮤니티 소유권을 다른 멤버에게 이전할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isTransferDialogOpen}
            onOpenChange={setIsTransferDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="border-2 border-black">
                <UserCheck className="h-4 w-4 mr-2" />
                소유권 이전
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>소유권 이전</DialogTitle>
                <DialogDescription>
                  커뮤니티 관리자(ADMIN) 중에서 새로운 소유자를 선택하세요.
                  선택된 관리자가 새로운 소유자가 되며, 현재 소유자는 관리자로
                  변경됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {isLoadingAdmins ? (
                  <div className="text-center py-8 text-muted-foreground">
                    관리자 목록을 불러오는 중...
                  </div>
                ) : adminMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      현재 관리자가 없습니다.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      먼저 멤버를 관리자로 승격시킨 후 소유권을 이전할 수
                      있습니다.
                    </p>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedAdminId}
                    onValueChange={setSelectedAdminId}
                  >
                    <div className="space-y-3">
                      {adminMembers.map((member) => (
                        <label
                          key={member.userId}
                          htmlFor={member.userId}
                          className="flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                        >
                          <RadioGroupItem
                            value={member.userId}
                            id={member.userId}
                          />
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.user.image || undefined} />
                            <AvatarFallback>
                              {member.user.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.user.name || '이름 없음'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.user.email}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            가입일:{' '}
                            {new Date(member.joinedAt).toLocaleDateString(
                              'ko-KR'
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                )}
                <div className="rounded-lg bg-yellow-100 p-3 text-sm">
                  <p className="font-semibold">⚠️ 주의사항</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• 소유권 이전 후에는 되돌릴 수 없습니다</li>
                    <li>• 새 소유자만 커뮤니티를 관리할 수 있습니다</li>
                    <li>• 현재 멤버 중에서만 선택 가능합니다</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsTransferDialogOpen(false)}
                >
                  취소
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={
                    transferMutation.isPending ||
                    !selectedAdminId ||
                    adminMembers.length === 0
                  }
                >
                  {transferMutation.isPending && <ButtonSpinner />}
                  소유권 이전
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* 커뮤니티 삭제 */}
      <Card className="border-red-500 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            위험 구역
          </CardTitle>
          <CardDescription>
            이 작업들은 되돌릴 수 없습니다. 신중하게 진행하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" className="border-2 border-black">
                <Trash2 className="h-4 w-4 mr-2" />
                커뮤니티 삭제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>정말로 커뮤니티를 삭제하시겠습니까?</DialogTitle>
                <DialogDescription>
                  이 작업은 되돌릴 수 없습니다. 모든 게시글, 댓글, 멤버 정보가
                  영구적으로 삭제됩니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="confirm">
                    삭제하려면 커뮤니티 이름을 입력하세요:{' '}
                    <span className="font-bold">{community.name}</span>
                  </Label>
                  <Input
                    id="confirm"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={community.name}
                  />
                </div>
                <div className="rounded-lg bg-red-100 p-3 text-sm">
                  <p className="font-semibold text-red-700">⚠️ 경고</p>
                  <ul className="mt-2 space-y-1 text-red-600">
                    <li>• 모든 게시글과 댓글이 삭제됩니다</li>
                    <li>• 모든 멤버 정보가 삭제됩니다</li>
                    <li>• 모든 파일과 이미지가 삭제됩니다</li>
                    <li>• 이 작업은 되돌릴 수 없습니다</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false)
                    setDeleteConfirmation('')
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={
                    deleteMutation.isPending ||
                    deleteConfirmation !== community.name
                  }
                >
                  {deleteMutation.isPending && <ButtonSpinner />}
                  영구 삭제
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
