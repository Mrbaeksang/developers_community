'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast as sonnerToast } from 'sonner'
import {
  Hash,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { formatCount } from '@/lib/common/types'
import {
  LoadingSpinner,
  ButtonSpinner,
} from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'

interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  postCount: number
}

interface TagStats {
  totalTags: number
  activeTags: number
  totalPosts: number
}

// API 함수들
const fetchTags = async (): Promise<Tag[]> => {
  const res = await fetch('/api/admin/tags')
  if (!res.ok) throw new Error('Failed to fetch tags')
  const result = await res.json()
  return result.data?.tags || []
}

const fetchTagStats = async (): Promise<TagStats> => {
  const res = await fetch('/api/admin/tags/stats')
  if (!res.ok) throw new Error('Failed to fetch tag stats')
  const result = await res.json()
  return result.data || { totalTags: 0, activeTags: 0, totalPosts: 0 }
}

export default function AdminTagsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    color: '#64748b',
  })

  // 태그 목록 조회
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 태그 통계 조회
  const { data: stats } = useQuery({
    queryKey: ['admin-tag-stats'],
    queryFn: fetchTagStats,
    staleTime: 10 * 60 * 1000, // 10분
  })

  // 태그 삭제 mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '태그 삭제에 실패했습니다')
      }
      return res.json()
    },
    onMutate: async (tagId) => {
      // 🚀 즉시 UI에서 제거 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['admin-tags'] })
      const previousTags = queryClient.getQueryData<Tag[]>(['admin-tags'])

      queryClient.setQueryData<Tag[]>(['admin-tags'], (old) =>
        old ? old.filter((tag) => tag.id !== tagId) : []
      )

      sonnerToast.success('태그가 삭제되었습니다')
      return { previousTags }
    },
    onError: (error, tagId, context) => {
      // 실패시 롤백
      if (context?.previousTags) {
        queryClient.setQueryData(['admin-tags'], context.previousTags)
      }
      sonnerToast.error(
        error instanceof Error ? error.message : '태그 삭제에 실패했습니다'
      )
    },
    onSettled: () => {
      setIsDeleteDialogOpen(false)
      setSelectedTag(null)
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['admin-tag-stats'] })
    },
  })

  // 태그 수정 mutation
  const editTagMutation = useMutation({
    mutationFn: async ({
      tagId,
      data,
    }: {
      tagId: string
      data: typeof editForm
    }) => {
      const res = await fetch(`/api/admin/tags/${tagId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '태그 수정에 실패했습니다')
      }
      return res.json()
    },
    onMutate: async ({ tagId, data }) => {
      // 🚀 즉시 UI에서 업데이트 (Optimistic Update)
      await queryClient.cancelQueries({ queryKey: ['admin-tags'] })
      const previousTags = queryClient.getQueryData<Tag[]>(['admin-tags'])

      queryClient.setQueryData<Tag[]>(['admin-tags'], (old) =>
        old
          ? old.map((tag) =>
              tag.id === tagId
                ? {
                    ...tag,
                    name: data.name,
                    description: data.description,
                    color: data.color,
                  }
                : tag
            )
          : []
      )

      sonnerToast.success('태그가 수정되었습니다')
      return { previousTags }
    },
    onError: (error, variables, context) => {
      // 실패시 롤백
      if (context?.previousTags) {
        queryClient.setQueryData(['admin-tags'], context.previousTags)
      }
      sonnerToast.error(
        error instanceof Error ? error.message : '태그 수정에 실패했습니다'
      )
    },
    onSettled: () => {
      setIsEditDialogOpen(false)
      setSelectedTag(null)
      setEditForm({ name: '', description: '', color: '#64748b' })
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
    },
  })

  // 검색 필터링
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tags, searchQuery])

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag)
    setEditForm({
      name: tag.name,
      description: tag.description || '',
      color: tag.color,
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag)
    setIsDeleteDialogOpen(true)
  }

  const handleEditSubmit = () => {
    if (!selectedTag || !editForm.name.trim()) return

    editTagMutation.mutate({
      tagId: selectedTag.id,
      data: editForm,
    })
  }

  const handleDeleteConfirm = () => {
    if (!selectedTag) return
    deleteTagMutation.mutate(selectedTag.id)
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Hash className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">태그 관리</h1>
            </div>
            <p className="text-muted-foreground">
              메인 사이트의 모든 태그를 관리하고 통계를 확인하세요.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin">← 관리자 대시보드</Link>
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600" disabled>
              <Plus className="h-4 w-4 mr-2" />새 태그 생성
            </Button>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Hash className="h-5 w-5 text-blue-600" />
              <span className="text-3xl font-bold text-blue-600">
                {formatCount(stats?.totalTags || 0)}
              </span>
            </div>
            <h3 className="font-medium text-sm">전체 태그</h3>
            <p className="text-xs text-muted-foreground mt-1">
              등록된 모든 태그
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {formatCount(stats?.activeTags || 0)}
              </span>
            </div>
            <h3 className="font-medium text-sm">활성 태그</h3>
            <p className="text-xs text-muted-foreground mt-1">
              게시글이 있는 태그
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span className="text-3xl font-bold text-purple-600">
                {formatCount(stats?.totalPosts || 0)}
              </span>
            </div>
            <h3 className="font-medium text-sm">태그된 게시글</h3>
            <p className="text-xs text-muted-foreground mt-1">
              태그가 적용된 게시글 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Hash className="h-5 w-5 text-orange-600" />
              <span className="text-3xl font-bold text-orange-600">
                {stats?.totalTags && stats.totalTags > 0
                  ? Math.round((stats.activeTags / stats.totalTags) * 100)
                  : 0}
                %
              </span>
            </div>
            <h3 className="font-medium text-sm">활성 비율</h3>
            <p className="text-xs text-muted-foreground mt-1">
              전체 태그 중 활성 태그 비율
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="태그명이나 설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="flex items-center">
              {filteredTags.length}개
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 태그 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>태그 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {tagsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredTags.length === 0 ? (
            <EmptyState
              icon={Hash}
              title={searchQuery ? '검색 결과가 없습니다' : '태그가 없습니다'}
              description={
                searchQuery
                  ? '다른 검색어를 시도해보세요'
                  : '첫 번째 태그를 생성해보세요'
              }
              size="sm"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>태그명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>색상</TableHead>
                  <TableHead className="text-center">게시글 수</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">#{tag.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={tag.description || ''}>
                        {tag.description || '설명 없음'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: tag.color }}
                        />
                        <code className="text-xs">{tag.color}</code>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={tag.postCount > 0 ? 'default' : 'secondary'}
                      >
                        {formatCount(tag.postCount)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(tag)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tag)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>태그 수정</DialogTitle>
            <DialogDescription>태그 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">태그명 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="태그명 입력"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="태그 설명 (선택사항)"
              />
            </div>
            <div>
              <Label htmlFor="edit-color">색상</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={editForm.color}
                  onChange={(e) =>
                    setEditForm({ ...editForm, color: e.target.value })
                  }
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={editForm.color}
                  onChange={(e) =>
                    setEditForm({ ...editForm, color: e.target.value })
                  }
                  placeholder="#64748b"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={editTagMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editTagMutation.isPending || !editForm.name.trim()}
            >
              {editTagMutation.isPending ? (
                <>
                  <ButtonSpinner />
                  수정 중...
                </>
              ) : (
                '수정'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              태그 삭제 확인
            </DialogTitle>
            <DialogDescription>
              이 작업은 되돌릴 수 없습니다. 태그를 삭제하면 연결된 모든
              게시글에서도 제거됩니다.
            </DialogDescription>
          </DialogHeader>
          {selectedTag && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: selectedTag.color }}
                />
                <span className="font-medium">#{selectedTag.name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedTag.description || '설명 없음'}
              </p>
              <div className="mt-2">
                <Badge
                  variant={
                    selectedTag.postCount > 0 ? 'destructive' : 'secondary'
                  }
                >
                  {selectedTag.postCount}개 게시글에서 사용 중
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTagMutation.isPending}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteTagMutation.isPending}
            >
              {deleteTagMutation.isPending ? (
                <>
                  <ButtonSpinner />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
