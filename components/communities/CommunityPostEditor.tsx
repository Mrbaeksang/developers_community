'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Upload, X, FileText, Image as ImageIcon, Archive, Film, Music } from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface CommunityPostEditorProps {
  communityId: string
  categories: Category[]
  allowFileUpload: boolean
  maxFileSize: number
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export function CommunityPostEditor({
  communityId,
  categories,
  allowFileUpload,
  maxFileSize,
}: CommunityPostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    // 파일 크기 확인
    const file = selectedFiles[0]
    if (file.size > maxFileSize) {
      toast.error(
        `파일 크기는 ${Math.round(maxFileSize / 1024 / 1024)}MB를 초과할 수 없습니다.`
      )
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Failed to upload file')

      const data = await res.json()
      setFiles([...files, data])
      toast.success('파일이 업로드되었습니다.')
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('파일 업로드에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(files.filter((f) => f.id !== fileId))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith('video/')) return <Film className="h-4 w-4" />
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (type.includes('zip') || type.includes('rar'))
      return <Archive className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('제목을 입력해주세요.')
      return
    }

    if (!content.trim()) {
      toast.error('내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          categoryId: categoryId || undefined,
          fileIds: files.map((f) => f.id),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create post')
      }

      const data = await res.json()
      toast.success('게시글이 작성되었습니다.')
      router.push(`/communities/${communityId}/posts/${data.id}`)
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error(
        error instanceof Error ? error.message : '게시글 작성에 실패했습니다.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 카테고리 */}
          {categories.length > 0 && (
            <div>
              <Label htmlFor="category">카테고리</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black">
                  <SelectItem value="" className="cursor-pointer">
                    카테고리 없음
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 제목 */}
          <div>
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* 내용 */}
          <div>
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              rows={10}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* 파일 업로드 */}
          {allowFileUpload && (
            <div>
              <Label>파일 첨부</Label>
              <div className="mt-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-black p-8 text-center hover:bg-gray-50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      클릭하거나 파일을 드래그하세요
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      최대 {Math.round(maxFileSize / 1024 / 1024)}MB
                    </p>
                  </div>
                </label>
              </div>

              {/* 업로드된 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border-2 border-black rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(file.size / 1024)}KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {isSubmitting ? '게시 중...' : '게시하기'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
