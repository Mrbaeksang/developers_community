'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { apiClient } from '@/lib/api/client'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
  order: number
  isActive: boolean
  requiresApproval: boolean
  postCount: number
}

interface CategoryForm {
  name: string
  slug: string
  description: string
  color: string
  icon: string
  order: number
  isActive: boolean
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  )
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
    icon: '',
    order: 0,
    isActive: true,
  })

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/main/categories/admin')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          toast({
            title: '권한이 없습니다.',
            description: '관리자만 접근할 수 있습니다.',
            variant: 'destructive',
          })
          router.push('/')
          return
        }
        throw new Error('카테고리 조회 실패')
      }
      const data = await res.json()
      // Check if data is wrapped in a response object
      if (data.data && Array.isArray(data.data)) {
        setCategories(data.data)
      } else if (Array.isArray(data)) {
        setCategories(data)
      } else {
        console.error('Unexpected response format:', data)
        setCategories([])
      }
    } catch (error) {
      console.error('카테고리 조회 실패:', error)
      toast({
        title: '카테고리 조회에 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
      icon: '',
      order: 0,
      isActive: true,
    })
    setSelectedCategory(null)
  }

  // 수정 모드로 전환
  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'none',
      order: category.order,
      isActive: category.isActive,
    })
    setIsDialogOpen(true)
  }

  // 카테고리 저장 (생성/수정)
  const handleSave = async () => {
    try {
      const url = selectedCategory
        ? `/api/main/categories/${selectedCategory.id}`
        : '/api/main/categories'
      const method = selectedCategory ? 'PUT' : 'POST'

      // 'none' 값을 빈 문자열로 변환
      const dataToSend = {
        ...formData,
        icon: formData.icon === 'none' ? '' : formData.icon,
      }

      const response = await apiClient(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.success) {
        throw new Error(response.error || '저장 실패')
      }

      toast({
        title: selectedCategory
          ? '카테고리가 수정되었습니다.'
          : '카테고리가 생성되었습니다.',
      })

      setIsDialogOpen(false)
      resetForm()
      fetchCategories()
    } catch (error) {
      toast({
        title: '저장에 실패했습니다.',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 카테고리 삭제
  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      const response = await apiClient(
        `/api/main/categories/${selectedCategory.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.success) {
        throw new Error(response.error || '삭제 실패')
      }

      toast({
        title: '카테고리가 삭제되었습니다.',
      })

      setIsDeleteDialogOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error) {
      toast({
        title: '삭제에 실패했습니다.',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 아이콘 렌더링
  const renderIcon = (iconName: string | null, size: number = 20) => {
    if (!iconName || !Icons[iconName as keyof typeof Icons]) {
      return null
    }
    const IconComponent = Icons[
      iconName as keyof typeof Icons
    ] as React.ComponentType<{ size?: number }>
    return <IconComponent size={size} />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold">카테고리 관리</h1>
        <Button
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />새 카테고리
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>카테고리 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">순서</TableHead>
                <TableHead>아이콘</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>슬러그</TableHead>
                <TableHead>설명</TableHead>
                <TableHead>색상</TableHead>
                <TableHead>게시글</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.order}</TableCell>
                    <TableCell>
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {renderIcon(category.icon)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xs">{category.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>{category.postCount}개</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          category.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.isActive ? '활성' : '비활성'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category)
                          setIsDeleteDialogOpen(true)
                        }}
                        disabled={category.postCount > 0}
                        title={
                          category.postCount > 0
                            ? `게시글이 ${category.postCount}개 있어 삭제할 수 없습니다`
                            : '삭제'
                        }
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    카테고리가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 카테고리 생성/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? '카테고리 수정' : '새 카테고리 생성'}
            </DialogTitle>
            <DialogDescription>카테고리 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="React"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">
                  슬러그 * (URL에 사용되는 영문 주소)
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="react"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="카테고리 설명을 입력하세요"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">색상</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#6366f1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">아이콘</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="아이콘을 선택하세요">
                      {formData.icon && formData.icon !== 'none' ? (
                        <div className="flex items-center gap-2">
                          {renderIcon(formData.icon)}
                          <span>{formData.icon}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          아이콘 없음
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          아이콘 없음
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Code2">
                      <div className="flex items-center gap-2">
                        {renderIcon('Code2')}
                        <span>코드 (프로그래밍)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MessageSquare">
                      <div className="flex items-center gap-2">
                        {renderIcon('MessageSquare')}
                        <span>대화 (Q&A, 토론)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="HelpCircle">
                      <div className="flex items-center gap-2">
                        {renderIcon('HelpCircle')}
                        <span>도움말 (질문)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Sparkles">
                      <div className="flex items-center gap-2">
                        {renderIcon('Sparkles')}
                        <span>AI/인공지능</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Blocks">
                      <div className="flex items-center gap-2">
                        {renderIcon('Blocks')}
                        <span>블록체인</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Server">
                      <div className="flex items-center gap-2">
                        {renderIcon('Server')}
                        <span>서버/백엔드</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Layout">
                      <div className="flex items-center gap-2">
                        {renderIcon('Layout')}
                        <span>프론트엔드/UI</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Smartphone">
                      <div className="flex items-center gap-2">
                        {renderIcon('Smartphone')}
                        <span>모바일 개발</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Gamepad2">
                      <div className="flex items-center gap-2">
                        {renderIcon('Gamepad2')}
                        <span>게임 개발</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Cloud">
                      <div className="flex items-center gap-2">
                        {renderIcon('Cloud')}
                        <span>클라우드</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Shield">
                      <div className="flex items-center gap-2">
                        {renderIcon('Shield')}
                        <span>보안</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Database">
                      <div className="flex items-center gap-2">
                        {renderIcon('Database')}
                        <span>데이터베이스</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Cpu">
                      <div className="flex items-center gap-2">
                        {renderIcon('Cpu')}
                        <span>하드웨어/임베디드</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BrainCircuit">
                      <div className="flex items-center gap-2">
                        {renderIcon('BrainCircuit')}
                        <span>머신러닝/딥러닝</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Briefcase">
                      <div className="flex items-center gap-2">
                        {renderIcon('Briefcase')}
                        <span>취업/이직</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Coffee">
                      <div className="flex items-center gap-2">
                        {renderIcon('Coffee')}
                        <span>자유게시판</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="BookOpen">
                      <div className="flex items-center gap-2">
                        {renderIcon('BookOpen')}
                        <span>학습/교육</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Lightbulb">
                      <div className="flex items-center gap-2">
                        {renderIcon('Lightbulb')}
                        <span>아이디어/팁</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Megaphone">
                      <div className="flex items-center gap-2">
                        {renderIcon('Megaphone')}
                        <span>공지사항</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Users">
                      <div className="flex items-center gap-2">
                        {renderIcon('Users')}
                        <span>커뮤니티</span>
                      </div>
                    </SelectItem>
                    {/* 비주류/전문 분야 */}
                    <SelectItem value="Microscope">
                      <div className="flex items-center gap-2">
                        {renderIcon('Microscope')}
                        <span>생명과학/바이오</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Activity">
                      <div className="flex items-center gap-2">
                        {renderIcon('Activity')}
                        <span>데이터 분석</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Zap">
                      <div className="flex items-center gap-2">
                        {renderIcon('Zap')}
                        <span>IoT/전자공학</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Globe">
                      <div className="flex items-center gap-2">
                        {renderIcon('Globe')}
                        <span>네트워크/통신</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Camera">
                      <div className="flex items-center gap-2">
                        {renderIcon('Camera')}
                        <span>컴퓨터 비전</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Rocket">
                      <div className="flex items-center gap-2">
                        {renderIcon('Rocket')}
                        <span>스타트업/창업</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Paintbrush">
                      <div className="flex items-center gap-2">
                        {renderIcon('Paintbrush')}
                        <span>디자인/창작</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Music">
                      <div className="flex items-center gap-2">
                        {renderIcon('Music')}
                        <span>음악/오디오</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Video">
                      <div className="flex items-center gap-2">
                        {renderIcon('Video')}
                        <span>영상/미디어</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Car">
                      <div className="flex items-center gap-2">
                        {renderIcon('Car')}
                        <span>자동차/모빌리티</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Plane">
                      <div className="flex items-center gap-2">
                        {renderIcon('Plane')}
                        <span>항공우주</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Factory">
                      <div className="flex items-center gap-2">
                        {renderIcon('Factory')}
                        <span>제조/산업</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order">순서</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">활성화</Label>
              </div>
            </div>
            {formData.icon &&
              formData.icon !== 'none' &&
              Icons[formData.icon as keyof typeof Icons] && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    아이콘 미리보기:
                  </p>
                  <div
                    className="w-16 h-16 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: formData.color }}
                  >
                    {renderIcon(formData.icon, 32)}
                  </div>
                </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>
              {selectedCategory ? '수정' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedCategory?.name}</strong> 카테고리를
              삭제하시겠습니까?
              <br />
              <span className="text-sm text-muted-foreground">
                ※ 게시글이 있는 카테고리는 삭제할 수 없습니다.
                <br />※ 이 작업은 되돌릴 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
