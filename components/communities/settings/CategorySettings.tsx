'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Plus, Edit2, Trash2, GripVertical, FolderPlus } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ButtonSpinner } from '@/components/shared/LoadingSpinner'
import { useToast } from '@/hooks/use-toast'
import { Reorder } from 'framer-motion'
import { apiClient } from '@/lib/api/client'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  order: number
  isActive: boolean
}

interface CategorySettingsProps {
  communityId: string
  categories: Category[]
}

// 미리 정의된 색상 팔레트
const COLOR_PALETTE = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
]

export function CategorySettings({
  communityId,
  categories: initialCategories,
}: CategorySettingsProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [categories, setCategories] = useState(initialCategories)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )

  // 새 카테고리 폼 상태
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
  })

  // 카테고리 생성 mutation
  const createMutation = useMutation({
    mutationFn: async (categoryData: typeof newCategory) => {
      const response = await apiClient<Category>(
        `/api/communities/${communityId}/categories`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...categoryData,
            order: categories.length,
          }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '카테고리 생성에 실패했습니다.')
      }

      return response.data as Category
    },
    onMutate: async (categoryData) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      const tempCategory: Category = {
        id: `temp-${Date.now()}`,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        color: categoryData.color,
        order: categories.length,
        isActive: true,
      }

      setCategories([...categories, tempCategory])
      setIsCreateOpen(false)
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        color: '#6366f1',
      })

      // 즉시 성공 피드백 표시
      toast({
        title: '성공',
        description: '카테고리가 생성되었습니다.',
      })

      return { previousCategories: categories, tempCategory }
    },
    onSuccess: (category, variables, context) => {
      // 임시 카테고리를 실제 카테고리로 교체
      if (context?.tempCategory) {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === context.tempCategory.id ? category : cat
          )
        )
      }

      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityCategories', communityId],
      })
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousCategories) {
        setCategories(context.previousCategories)
      }
      setIsCreateOpen(true) // 다이얼로그 다시 열기
      toast({
        title: '오류',
        description: error.message || '카테고리 생성에 실패했습니다.',
        variant: 'destructive',
      })
    },
  })

  const handleCreate = () => {
    if (!newCategory.name || !newCategory.slug) {
      toast({
        title: '오류',
        description: '카테고리 이름과 슬러그를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }
    createMutation.mutate(newCategory)
  }

  // 카테고리 수정 mutation
  const updateMutation = useMutation({
    mutationFn: async (category: Category) => {
      const response = await apiClient<Category>(
        `/api/communities/${communityId}/categories/${category.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: category.name,
            slug: category.slug,
            description: category.description,
            color: category.color,
          }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '카테고리 수정에 실패했습니다.')
      }

      return response.data as Category
    },
    onMutate: async (updatedCategory) => {
      // 🚀 즉시 UI 업데이트 (Optimistic Update)
      const previousCategories = categories

      setCategories(
        categories.map((cat) =>
          cat.id === updatedCategory.id ? updatedCategory : cat
        )
      )
      setEditingCategory(null)

      // 즉시 성공 피드백 표시
      toast({
        title: '성공',
        description: '카테고리가 수정되었습니다.',
      })

      return {
        previousCategories,
        originalCategory: categories.find(
          (cat) => cat.id === updatedCategory.id
        ),
      }
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityCategories', communityId],
      })
    },
    onError: (error: Error, variables, context) => {
      // ❌ 실패 시 상태 되돌리기 (Rollback)
      if (context?.previousCategories) {
        setCategories(context.previousCategories)
      }
      if (context?.originalCategory) {
        setEditingCategory(context.originalCategory) // 편집 다이얼로그 다시 열기
      }
      toast({
        title: '오류',
        description: error.message || '카테고리 수정에 실패했습니다.',
        variant: 'destructive',
      })
    },
  })

  const handleEdit = () => {
    if (!editingCategory) return
    updateMutation.mutate(editingCategory)
  }

  // 카테고리 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiClient(
        `/api/communities/${communityId}/categories/${categoryId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.success) {
        throw new Error(response.error || '카테고리 삭제에 실패했습니다.')
      }

      return response.data
    },
    onMutate: async (categoryId) => {
      // 🚀 즉시 UI에서 제거 (Optimistic Update)
      const previousCategories = categories
      const deletedCategory = categories.find((cat) => cat.id === categoryId)

      setCategories(categories.filter((cat) => cat.id !== categoryId))
      setDeletingCategory(null)

      // 즉시 성공 피드백 표시
      toast({
        title: '성공',
        description: '카테고리가 삭제되었습니다.',
      })

      return { previousCategories, deletedCategory }
    },
    onSuccess: () => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityCategories', communityId],
      })
    },
    onError: (error: Error, variables, context) => {
      // ❌ 삭제 실패 시 되돌리기 (Rollback)
      if (context?.previousCategories) {
        setCategories(context.previousCategories)
      }
      if (context?.deletedCategory) {
        setDeletingCategory(context.deletedCategory) // 삭제 다이얼로그 다시 열기
      }
      toast({
        title: '오류',
        description: error.message || '카테고리 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    },
  })

  const handleDelete = () => {
    if (!deletingCategory) return
    deleteMutation.mutate(deletingCategory.id)
  }

  // 카테고리 순서 변경 mutation
  const reorderMutation = useMutation({
    mutationFn: async (newOrder: Category[]) => {
      const response = await apiClient(
        `/api/communities/${communityId}/categories/reorder`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryIds: newOrder.map((cat) => cat.id),
          }),
        }
      )

      if (!response.success) {
        throw new Error(response.error || '순서 변경에 실패했습니다.')
      }

      return response.data
    },
    onMutate: async (newOrder) => {
      // 낙관적 업데이트: 각 카테고리의 order 값을 새로운 인덱스로 업데이트
      const updatedCategories = newOrder.map((cat, index) => ({
        ...cat,
        order: index,
      }))
      setCategories(updatedCategories)

      // 이전 상태 반환 (실패시 복구용)
      return { previousCategories: categories }
    },
    onError: (error: Error, _, context) => {
      // 실패 시 이전 상태로 복구
      if (context?.previousCategories) {
        setCategories(context.previousCategories)
      }
      toast({
        title: '오류',
        description: error.message || '카테고리 순서 변경에 실패했습니다.',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      toast({
        title: '성공',
        description: '카테고리 순서가 변경되었습니다.',
      })
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ['communityCategories', communityId],
      })
    },
  })

  const handleReorder = (newOrder: Category[]) => {
    reorderMutation.mutate(newOrder)
  }

  // 슬러그 자동 생성
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  return (
    <div className="space-y-6">
      {/* 카테고리 목록 */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="아직 카테고리가 없습니다"
            description="첫 카테고리를 만들어보세요!"
            action={{
              label: '카테고리 추가',
              onClick: () => setIsCreateOpen(true),
            }}
            size="lg"
          />
        ) : (
          <Reorder.Group
            axis="y"
            values={categories}
            onReorder={handleReorder}
            className="space-y-2"
          >
            {categories.map((category) => (
              <Reorder.Item
                key={category.id}
                value={category}
                className="flex items-center gap-3 p-4 border-2 border-black rounded-lg bg-white hover:bg-gray-50"
              >
                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
                <div
                  className="w-6 h-6 rounded border-2 border-gray-300"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1">
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-muted-foreground">
                      {category.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    슬러그: {category.slug} | 순서: {category.order}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* 카테고리 추가 버튼 */}
      <Button
        onClick={() => setIsCreateOpen(true)}
        className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
      >
        <Plus className="mr-2 h-4 w-4" />
        카테고리 추가
      </Button>

      {/* 카테고리 생성 다이얼로그 */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>새 카테고리 만들기</DialogTitle>
            <DialogDescription>
              커뮤니티에서 사용할 카테고리를 만들어보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">카테고리 이름</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => {
                  setNewCategory({
                    ...newCategory,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  })
                }}
                placeholder="예: 일반"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">슬러그</Label>
              <Input
                id="slug"
                value={newCategory.slug}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, slug: e.target.value })
                }
                placeholder="general"
                pattern="[a-z0-9\-]*"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택사항)</Label>
              <Input
                id="description"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
                placeholder="일반적인 주제를 다룹니다"
              />
            </div>
            <div className="space-y-2">
              <Label>색상</Label>
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded border-2 border-gray-300"
                  style={{ backgroundColor: newCategory.color }}
                />
                <Input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, color: e.target.value })
                  }
                  className="w-20"
                />
              </div>
              <div className="grid grid-cols-9 gap-2 mt-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategory({ ...newCategory, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              취소
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <ButtonSpinner className="mr-2" />}
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 수정 다이얼로그 */}
      <Dialog
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>카테고리 수정</DialogTitle>
            <DialogDescription>카테고리 정보를 수정합니다.</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">카테고리 이름</Label>
                <Input
                  id="edit-name"
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-slug">슬러그</Label>
                <Input
                  id="edit-slug"
                  value={editingCategory.slug}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      slug: e.target.value,
                    })
                  }
                  pattern="[a-z0-9\-]*"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">설명 (선택사항)</Label>
                <Input
                  id="edit-description"
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>색상</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded border-2 border-gray-300"
                    style={{ backgroundColor: editingCategory.color }}
                  />
                  <Input
                    type="color"
                    value={editingCategory.color}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        color: e.target.value,
                      })
                    }
                    className="w-20"
                  />
                </div>
                <div className="grid grid-cols-9 gap-2 mt-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() =>
                        setEditingCategory({
                          ...editingCategory,
                          color,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingCategory(null)}
              disabled={updateMutation.isPending}
            >
              취소
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <ButtonSpinner className="mr-2" />}
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 카테고리 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open: boolean) => !open && setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 카테고리를 삭제하면 복구할 수 없습니다. 이 카테고리에 속한
              게시글들은 카테고리가 없는 상태가 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <ButtonSpinner className="mr-2" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
