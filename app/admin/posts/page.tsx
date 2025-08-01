'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Eye,
  Trash,
  Search,
  Filter,
  MessageSquare,
  Heart,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Archive,
  Pin,
  PinOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface MainPost {
  id: string
  title: string
  content: string
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'PUBLISHED'
    | 'REJECTED'
    | 'ARCHIVED'
    | 'DELETED'
  isPinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
    globalRole: string
  }
  category: {
    id: string
    name: string
    color: string
  }
  _count?: {
    comments: number
    likes: number
    bookmarks: number
  }
}

interface CommunityPost {
  id: string
  title: string
  content: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED'
  isPinned: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
  community: {
    id: string
    name: string
  }
  category?: {
    id: string
    name: string
    color: string
  }
}

export default function PostsPage() {
  const router = useRouter()
  const [mainPosts, setMainPosts] = useState<MainPost[]>([])
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<
    MainPost | CommunityPost | null
  >(null)
  const [selectedPostType, setSelectedPostType] = useState<
    'main' | 'community'
  >('main')

  // 메인 게시글 조회
  const fetchMainPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts/main')
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
        throw new Error('메인 게시글 조회 실패')
      }
      const data = await res.json()
      setMainPosts(data)
    } catch (error) {
      console.error('메인 게시글 조회 실패:', error)
      toast({
        title: '메인 게시글 조회에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 커뮤니티 게시글 조회
  const fetchCommunityPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts/community')
      if (!res.ok) {
        throw new Error('커뮤니티 게시글 조회 실패')
      }
      const data = await res.json()
      setCommunityPosts(data)
    } catch (error) {
      console.error('커뮤니티 게시글 조회 실패:', error)
      toast({
        title: '커뮤니티 게시글 조회에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchMainPosts(), fetchCommunityPosts()])
      setLoading(false)
    }
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 게시글 고정/고정해제
  const handleTogglePin = async (postId: string) => {
    try {
      const res = await fetch(`/api/admin/posts/main/${postId}/pin`, {
        method: 'PATCH',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '고정 상태 변경 실패')
      }

      const data = await res.json()

      toast({
        title: data.message,
      })

      // 데이터 새로고침
      fetchMainPosts()
    } catch (error) {
      toast({
        title: '고정 상태 변경에 실패했습니다.',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 게시글 삭제
  const handleDelete = async () => {
    if (!selectedPost) return

    try {
      const endpoint =
        selectedPostType === 'main'
          ? `/api/admin/posts/main/${selectedPost.id}`
          : `/api/admin/posts/community/${selectedPost.id}`

      const res = await fetch(endpoint, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '삭제 실패')
      }

      toast({
        title: '게시글이 삭제되었습니다.',
      })

      setIsDeleteDialogOpen(false)
      setSelectedPost(null)

      // 데이터 새로고침
      if (selectedPostType === 'main') {
        fetchMainPosts()
      } else {
        fetchCommunityPosts()
      }
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

  // 상태 배지 렌더링
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: {
        label: '임시저장',
        variant: 'secondary' as const,
        icon: Archive,
      },
      PENDING: { label: '승인대기', variant: 'default' as const, icon: Clock },
      PUBLISHED: {
        label: '게시됨',
        variant: 'default' as const,
        icon: CheckCircle,
      },
      REJECTED: {
        label: '거부됨',
        variant: 'destructive' as const,
        icon: XCircle,
      },
      ARCHIVED: {
        label: '보관됨',
        variant: 'secondary' as const,
        icon: Archive,
      },
      DELETED: {
        label: '삭제됨',
        variant: 'destructive' as const,
        icon: Trash,
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null

    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // 필터링된 게시글
  const filteredMainPosts = mainPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredCommunityPosts = communityPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.community.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">게시글 관리</h1>
        <p className="text-muted-foreground">
          메인 사이트와 커뮤니티의 모든 게시글을 관리하세요.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="제목, 작성자로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">상태</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      {statusFilter === 'ALL' ? '전체' : statusFilter}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="DRAFT">임시저장</SelectItem>
                  <SelectItem value="PENDING">승인대기</SelectItem>
                  <SelectItem value="PUBLISHED">게시됨</SelectItem>
                  <SelectItem value="REJECTED">거부됨</SelectItem>
                  <SelectItem value="ARCHIVED">보관됨</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭으로 메인/커뮤니티 구분 */}
      <Tabs defaultValue="main" className="space-y-6">
        <TabsList>
          <TabsTrigger value="main">
            메인 사이트 ({filteredMainPosts.length})
          </TabsTrigger>
          <TabsTrigger value="community">
            커뮤니티 ({filteredCommunityPosts.length})
          </TabsTrigger>
        </TabsList>

        {/* 메인 사이트 게시글 */}
        <TabsContent value="main">
          <Card>
            <CardHeader>
              <CardTitle>메인 사이트 게시글</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>통계</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMainPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <div className="font-medium truncate">
                            {post.title}
                          </div>
                          {post.isPinned && (
                            <Badge variant="secondary" className="mt-1">
                              고정
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {post.author.name || '이름 없음'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {post.author.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: post.category.color }}
                          />
                          {post.category.name}
                        </div>
                      </TableCell>
                      <TableCell>{renderStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.viewCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likeCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.commentCount}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/main/posts/${post.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {post.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePin(post.id)}
                            title={post.isPinned ? '고정 해제' : '게시글 고정'}
                          >
                            {post.isPinned ? (
                              <PinOff className="h-4 w-4" />
                            ) : (
                              <Pin className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post)
                            setSelectedPostType('main')
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 커뮤니티 게시글 */}
        <TabsContent value="community">
          <Card>
            <CardHeader>
              <CardTitle>커뮤니티 게시글</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>작성자</TableHead>
                    <TableHead>커뮤니티</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>통계</TableHead>
                    <TableHead>작성일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommunityPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div className="max-w-[250px]">
                          <div className="font-medium truncate">
                            {post.title}
                          </div>
                          {post.isPinned && (
                            <Badge variant="secondary" className="mt-1">
                              고정
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {post.author.name || '이름 없음'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {post.author.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{post.community.name}</div>
                      </TableCell>
                      <TableCell>
                        {post.category ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: post.category.color }}
                            />
                            {post.category.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{renderStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.viewCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likeCount}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.commentCount}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/communities/${post.community.id}/posts/${post.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPost(post)
                            setSelectedPostType('community')
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedPost?.title}</strong> 게시글을 삭제하시겠습니까?
              <br />
              <span className="text-sm text-muted-foreground">
                ※ 이 작업은 되돌릴 수 없습니다.
                <br />※ 관련된 댓글과 좋아요도 함께 삭제됩니다.
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
