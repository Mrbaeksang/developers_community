'use client'

import { useState, useEffect } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Users,
  FileText,
  Settings,
  Trash2,
  Search,
  RefreshCw,
  Globe,
  Lock,
  MessageSquare,
  Upload,
  FolderOpen,
  Megaphone,
  UserCog,
} from 'lucide-react'
import { getAvatarUrl } from '@/lib/community-utils'
import { CommunityVisibility } from '@prisma/client'
import { apiClient } from '@/lib/api'

interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  avatar: string | null
  banner: string | null
  visibility: CommunityVisibility
  memberCount: number
  postCount: number
  allowFileUpload: boolean
  allowChat: boolean
  maxFileSize: number
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
    categories: number
    announcements: number
  }
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<
    CommunityVisibility | 'ALL'
  >('ALL')

  // 설정 수정 다이얼로그
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  )
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    visibility: 'PUBLIC' as CommunityVisibility,
    allowFileUpload: true,
    allowChat: true,
    maxFileSize: 10485760,
  })

  // 삭제 확인 다이얼로그
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/communities')
      if (!response.ok) throw new Error('Failed to fetch communities')
      const data = await response.json()

      // 새로운 응답 형식 처리: { success: true, data: communities }
      const communities = data.success && data.data ? data.data : data
      setCommunities(communities)
    } catch (error) {
      toast.error('커뮤니티 목록을 불러오는 중 오류가 발생했습니다.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsOpen = (community: Community) => {
    setSelectedCommunity(community)
    setEditForm({
      name: community.name,
      description: community.description || '',
      visibility: community.visibility,
      allowFileUpload: community.allowFileUpload,
      allowChat: community.allowChat,
      maxFileSize: community.maxFileSize,
    })
    setSettingsDialogOpen(true)
  }

  const handleSettingsUpdate = async () => {
    if (!selectedCommunity) return

    try {
      const response = await apiClient(
        `/api/admin/communities/${selectedCommunity.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm),
        }
      )

      if (!response.success)
        throw new Error(response.error || 'Failed to update community')

      toast.success('커뮤니티 설정이 수정되었습니다.')
      setSettingsDialogOpen(false)
      fetchCommunities()
    } catch (error) {
      toast.error('커뮤니티 수정 중 오류가 발생했습니다.')
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!selectedCommunity) return

    try {
      const response = await apiClient(
        `/api/admin/communities/${selectedCommunity.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.success)
        throw new Error(response.error || 'Failed to delete community')

      toast.success('커뮤니티가 삭제되었습니다.')
      setDeleteDialogOpen(false)
      setSelectedCommunity(null)
      fetchCommunities()
    } catch (error) {
      toast.error('커뮤니티 삭제 중 오류가 발생했습니다.')
      console.error(error)
    }
  }

  const filteredCommunities = communities.filter((community) => {
    const matchesSearch =
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (community.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ??
        false)

    const matchesVisibility =
      visibilityFilter === 'ALL' || community.visibility === visibilityFilter

    return matchesSearch && matchesVisibility
  })

  const getVisibilityBadge = (visibility: CommunityVisibility) => {
    if (visibility === 'PUBLIC') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <Globe className="w-3 h-3 mr-1" />
          공개
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-100 text-amber-800">
        <Lock className="w-3 h-3 mr-1" />
        비공개
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">커뮤니티 관리</h1>
        <p className="text-muted-foreground">
          생성된 모든 커뮤니티를 관리합니다.
        </p>
      </div>

      {/* 필터 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="커뮤니티 이름, 슬러그, 설명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={visibilityFilter}
          onValueChange={(value) =>
            setVisibilityFilter(value as CommunityVisibility | 'ALL')
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="공개 설정 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">모든 커뮤니티</SelectItem>
            <SelectItem value="PUBLIC">공개</SelectItem>
            <SelectItem value="PRIVATE">비공개</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchCommunities}>
          <RefreshCw className="w-4 h-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 테이블 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>커뮤니티</TableHead>
              <TableHead>소유자</TableHead>
              <TableHead>공개 설정</TableHead>
              <TableHead>통계</TableHead>
              <TableHead>기능</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    로딩 중...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCommunities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredCommunities.map((community) => (
                <TableRow key={community.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const avatarUrl = community.avatar
                          ? getAvatarUrl(community.avatar)
                          : ''
                        if (avatarUrl) {
                          return (
                            <div
                              className="w-10 h-10 rounded-full bg-cover bg-center"
                              style={{
                                backgroundImage: `url(${avatarUrl})`,
                              }}
                            />
                          )
                        }
                        return (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-500" />
                          </div>
                        )
                      })()}
                      <div>
                        <div className="font-medium">{community.name}</div>
                        <div className="text-sm text-muted-foreground">
                          /{community.slug}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {community.owner.image ? (
                        <div
                          className="w-6 h-6 rounded-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${community.owner.image})`,
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserCog className="w-3 h-3 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm">
                          {community.owner.name || '이름 없음'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {community.owner.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getVisibilityBadge(community.visibility)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        멤버: {community._count.members}명
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        게시글: {community._count.posts}개
                      </div>
                      <div className="flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" />
                        카테고리: {community._count.categories}개
                      </div>
                      <div className="flex items-center gap-1">
                        <Megaphone className="w-3 h-3" />
                        공지: {community._count.announcements}개
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {community.allowFileUpload && (
                        <Badge variant="outline" className="text-xs">
                          <Upload className="w-3 h-3 mr-1" />
                          파일 {formatFileSize(community.maxFileSize)}
                        </Badge>
                      )}
                      {community.allowChat && (
                        <Badge variant="outline" className="text-xs">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          채팅
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(community.createdAt), 'yyyy-MM-dd', {
                        locale: ko,
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSettingsOpen(community)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        설정
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCommunity(community)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 설정 수정 다이얼로그 */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>커뮤니티 설정</DialogTitle>
            <DialogDescription>
              {selectedCommunity?.name} 커뮤니티의 설정을 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">커뮤니티 이름</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="커뮤니티 설명을 입력하세요..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>공개 설정</Label>
              <Select
                value={editForm.visibility}
                onValueChange={(value) =>
                  setEditForm({
                    ...editForm,
                    visibility: value as CommunityVisibility,
                  })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">공개 (누구나 참여)</SelectItem>
                  <SelectItem value="PRIVATE">비공개 (승인 필요)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowFileUpload">파일 업로드 허용</Label>
                  <p className="text-sm text-muted-foreground">
                    멤버가 파일을 업로드할 수 있습니다.
                  </p>
                </div>
                <Switch
                  id="allowFileUpload"
                  checked={editForm.allowFileUpload}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allowFileUpload: checked })
                  }
                />
              </div>
              {editForm.allowFileUpload && (
                <div>
                  <Label htmlFor="maxFileSize">최대 파일 크기</Label>
                  <Select
                    value={String(editForm.maxFileSize)}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
                        maxFileSize: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5242880">5MB</SelectItem>
                      <SelectItem value="10485760">10MB</SelectItem>
                      <SelectItem value="20971520">20MB</SelectItem>
                      <SelectItem value="52428800">50MB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allowChat">채팅 기능 허용</Label>
                  <p className="text-sm text-muted-foreground">
                    실시간 채팅 기능을 사용할 수 있습니다.
                  </p>
                </div>
                <Switch
                  id="allowChat"
                  checked={editForm.allowChat}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, allowChat: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleSettingsUpdate}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>커뮤니티 삭제</DialogTitle>
            <DialogDescription>
              정말로 {selectedCommunity?.name} 커뮤니티를 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-semibold">
                이 작업은 되돌릴 수 없으며, 모든 게시글, 댓글, 멤버 정보가
                삭제됩니다.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
