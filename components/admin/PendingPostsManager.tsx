'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Eye,
  MessageSquare,
  Heart,
  Tag,
} from 'lucide-react'

interface PostAuthor {
  id: string
  name: string
  email: string
  image?: string
}

interface PostCategory {
  id: string
  name: string
  slug: string
}

interface PostTag {
  id: string
  name: string
  slug: string
}

interface PendingPost {
  id: string
  title: string
  content: string
  excerpt?: string
  createdAt: string
  viewCount: number
  author: PostAuthor
  category: PostCategory
  tags: PostTag[]
  commentCount: number
  likeCount: number
}

interface PendingPostsManagerProps {
  initialPosts: PendingPost[]
}

export function PendingPostsManager({
  initialPosts,
}: PendingPostsManagerProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [selectedPost, setSelectedPost] = useState<PendingPost | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async (postId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/main/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '승인 처리에 실패했습니다.')
      }

      // 목록에서 제거
      setPosts(posts.filter((post) => post.id !== postId))
      toast.success('게시글이 승인되었습니다.')
    } catch (error) {
      console.error('승인 실패:', error)
      toast.error(
        error instanceof Error ? error.message : '승인 처리에 실패했습니다.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (postId: string) => {
    if (!rejectReason.trim()) {
      toast.error('거부 사유를 입력해주세요.')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/main/posts/${postId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          reason: rejectReason,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '거부 처리에 실패했습니다.')
      }

      // 목록에서 제거
      setPosts(posts.filter((post) => post.id !== postId))
      setRejectReason('')
      setSelectedPost(null)
      toast.success('게시글이 거부되었습니다.')
    } catch (error) {
      console.error('거부 실패:', error)
      toast.error(
        error instanceof Error ? error.message : '거부 처리에 실패했습니다.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          승인 대기 게시글이 없습니다
        </h2>
        <p className="text-muted-foreground">모든 게시글이 처리되었습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          총 {posts.length}개의 게시글이 승인 대기 중입니다.
        </p>
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{post.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author.name} ({post.author.email})
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">{post.category.name}</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 게시글 내용 미리보기 */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt || post.content.substring(0, 200) + '...'}
                </p>
              </div>

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 통계 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  조회 {post.viewCount}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  좋아요 {post.likeCount}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  댓글 {post.commentCount}
                </div>
              </div>

              {/* 거부 사유 입력 (선택된 게시글만) */}
              {selectedPost?.id === post.id && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <label className="text-sm font-medium">거부 사유</label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="거부 사유를 입력해주세요..."
                    rows={3}
                  />
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (selectedPost?.id === post.id) {
                      handleReject(post.id)
                    } else {
                      setSelectedPost(post)
                      setRejectReason('')
                    }
                  }}
                  disabled={isProcessing}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {selectedPost?.id === post.id ? '거부 확정' : '거부'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(post.id)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  승인
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
