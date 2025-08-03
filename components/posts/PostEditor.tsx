'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { X } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
  count?: number
  color?: string
}

interface PostEditorProps {
  userRole?: string
}

export function PostEditor({ userRole }: PostEditorProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [existingTags, setExistingTags] = useState<Tag[]>([])

  // 폼 상태
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // 카테고리와 태그 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 카테고리 로드
        const categoriesRes = await fetch('/api/main/categories')
        if (categoriesRes.ok) {
          const result = await categoriesRes.json()
          // successResponse 형식으로 오는 경우 data 필드에서 실제 데이터 추출
          setCategories(result.data || result)
        }

        // 태그 로드 (인기 태그 상위 15개)
        const tagsRes = await fetch('/api/main/tags?limit=15')
        if (tagsRes.ok) {
          const result = await tagsRes.json()
          // successResponse 형식으로 오는 경우 data.tags 필드에서 실제 데이터 추출
          setExistingTags(result.data?.tags || [])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }

    loadData()
  }, [])

  // 태그 추가
  const handleAddTag = () => {
    if (!tagInput.trim()) return

    const tagSlug = tagInput.toLowerCase().replace(/\s+/g, '-')
    if (!selectedTags.includes(tagSlug)) {
      setSelectedTags([...selectedTags, tagSlug])
      setTagInput('')
    }
  }

  // 태그 제거
  const handleRemoveTag = (tagSlug: string) => {
    setSelectedTags(selectedTags.filter((slug) => slug !== tagSlug))
  }

  // 게시글 저장
  const handleSubmit = async (submitStatus: 'DRAFT' | 'PENDING') => {
    if (!title.trim()) {
      toast.error('제목을 입력해주세요')
      return
    }
    if (!content.trim()) {
      toast.error('내용을 입력해주세요')
      return
    }
    if (!categoryId) {
      toast.error('카테고리를 선택해주세요')
      return
    }

    setIsSubmitting(true)

    try {
      // slug 생성 (제목 기반)
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100) +
        '-' +
        Date.now()

      const response = await fetch('/api/main/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || content.substring(0, 200),
          slug,
          categoryId,
          status: submitStatus,
          tags: selectedTags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '게시글 작성에 실패했습니다')
      }

      const result = await response.json()

      // API 응답 구조 처리: { success: true, data: post }
      if (!result.success || !result.data) {
        throw new Error(result.error || '게시글 작성에 실패했습니다')
      }

      const post = result.data

      if (submitStatus === 'DRAFT') {
        toast.success('임시저장되었습니다')
      } else if (userRole === 'ADMIN') {
        toast.success('게시글이 작성되었습니다')
      } else {
        toast.success('게시글이 승인 대기중입니다')
      }

      // 게시글 상세 페이지로 이동
      if (post && post.id) {
        setTimeout(() => {
          router.push(`/main/posts/${post.id}`)
        }, 100) // 짧은 지연 후 이동
      } else {
        console.error('Post ID not found in response:', result)
        router.push('/main/posts')
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error(
        error instanceof Error ? error.message : '게시글 작성에 실패했습니다'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>게시글 작성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <label className="text-sm font-medium mb-2 block">카테고리 *</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div>
            <label className="text-sm font-medium mb-2 block">제목 *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력해주세요"
              maxLength={200}
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="text-sm font-medium mb-2 block">내용 *</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력해주세요"
              rows={15}
              className="resize-none"
            />
          </div>

          {/* 요약 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              요약 (선택사항)
            </label>
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="게시글 요약을 입력해주세요 (미입력시 자동 생성)"
              rows={3}
              maxLength={300}
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="text-sm font-medium mb-2 block">태그</label>
            <div className="flex gap-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="태그를 입력하고 Enter"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                추가
              </Button>
            </div>

            {/* 선택된 태그 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tagSlug) => (
                <Badge key={tagSlug} variant="secondary" className="px-3 py-1">
                  {tagSlug}
                  <X
                    className="ml-2 h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tagSlug)}
                  />
                </Badge>
              ))}
            </div>

            {/* 인기 태그 추천 */}
            {existingTags.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">인기 태그:</p>
                <div className="flex flex-wrap gap-2">
                  {existingTags.slice(0, 10).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] transition-all duration-200"
                      style={{
                        borderColor: tag.color || '#6366f1',
                        color: tag.color || '#6366f1',
                      }}
                      onClick={() => {
                        if (!selectedTags.includes(tag.slug)) {
                          setSelectedTags([...selectedTags, tag.slug])
                        }
                      }}
                    >
                      {tag.name}
                      {tag.count !== undefined && tag.count > 0 && (
                        <span className="ml-1 text-xs opacity-70">
                          ({tag.count})
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting}
            >
              임시저장
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit('PENDING')}
              disabled={isSubmitting}
            >
              {isSubmitting ? '저장 중...' : '게시 요청'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
