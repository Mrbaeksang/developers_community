'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  MessageSquare,
  Heart,
  Eye,
  Clock,
  Tag,
  Cloud,
  Code,
  Database,
  Globe,
  Zap,
  Cpu,
  Server,
  Layers,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Post } from '@/lib/types'

interface PostCardProps {
  post: Post
  className?: string
}

// 카테고리 아이콘 매핑 함수
function getCategoryIcon(
  iconName: string | null | undefined,
  categoryName: string
) {
  // 데이터베이스에 올바른 Lucide 아이콘 이름이 저장된 경우
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    cloud: Cloud,
    code: Code,
    database: Database,
    globe: Globe,
    zap: Zap,
    cpu: Cpu,
    server: Server,
    layers: Layers,
    package: Package,
    tag: Tag,
  }

  // 1. 정확한 아이콘 이름이 있으면 해당 아이콘 반환
  if (iconName && iconMap[iconName.toLowerCase()]) {
    return iconMap[iconName.toLowerCase()]
  }

  // 2. 카테고리 이름 기반 자동 매핑 (fallback)
  const categoryLower = categoryName.toLowerCase()
  if (categoryLower.includes('cloud') || categoryLower.includes('클라우드'))
    return Cloud
  if (
    categoryLower.includes('next') ||
    categoryLower.includes('react') ||
    categoryLower.includes('javascript')
  )
    return Code
  if (
    categoryLower.includes('database') ||
    categoryLower.includes('데이터베이스')
  )
    return Database
  if (categoryLower.includes('web') || categoryLower.includes('웹'))
    return Globe
  if (categoryLower.includes('performance') || categoryLower.includes('성능'))
    return Zap
  if (categoryLower.includes('server') || categoryLower.includes('서버'))
    return Server
  if (
    categoryLower.includes('architecture') ||
    categoryLower.includes('아키텍처')
  )
    return Layers

  // 3. 기본 태그 아이콘 반환
  return Tag
}

export function PostCard({ post, className }: PostCardProps) {
  const publishedDate = post.createdAt
  const formattedDate = formatDistanceToNow(new Date(publishedDate), {
    addSuffix: true,
    locale: ko,
  })

  // 읽는 시간 계산 (한글: 분당 300자, 영문: 분당 250단어)
  const koreanCharCount = (post.content.match(/[가-힣]/g) || []).length
  const englishWordCount = (post.content.match(/[a-zA-Z]+/g) || []).length
  const otherCharCount =
    post.content.length - koreanCharCount - englishWordCount

  const readingTime = Math.max(
    1,
    Math.ceil(
      koreanCharCount / 300 + englishWordCount / 250 + otherCharCount / 800
    )
  )

  return (
    <Card
      className={cn(
        'h-full hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all duration-200',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {post.isPinned && (
              <Badge className="px-2 py-1 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-yellow-500 text-white">
                📌 고정
              </Badge>
            )}
            {post.category && (
              <Link href={`/main/posts?category=${post.category.slug}`}>
                <Badge
                  className="px-3 py-1.5 text-xs font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 hover:scale-105 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: post.category.color,
                    color: (() => {
                      // hex 색상을 RGB로 변환하는 함수
                      const hexToRgb = (hex: string) => {
                        const result =
                          /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                        return result
                          ? {
                              r: parseInt(result[1], 16),
                              g: parseInt(result[2], 16),
                              b: parseInt(result[3], 16),
                            }
                          : { r: 100, g: 100, b: 100 }
                      }

                      // 밝기 계산 (0-255)
                      const getLuminance = (color: string) => {
                        const rgb = hexToRgb(color)
                        return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
                      }

                      // 배경색이 밝으면 검은색, 어두우면 흰색 텍스트
                      return getLuminance(post.category.color) > 128
                        ? '#000000'
                        : '#ffffff'
                    })(),
                    borderColor: post.category.color,
                  }}
                >
                  {(() => {
                    const IconComponent = getCategoryIcon(
                      post.category.icon,
                      post.category.name
                    )
                    return <IconComponent className="w-3 h-3 flex-shrink-0" />
                  })()}
                  {post.category.name}
                </Badge>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 rounded-full border border-blue-200/50">
            <Clock className="size-3 text-blue-500" />
            <span className="text-xs font-medium text-blue-600">
              예상 읽기시간 {readingTime}분
            </span>
          </div>
        </div>

        <Link href={`/main/posts/${post.id}`} className="group">
          <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>
      </CardHeader>

      <CardContent className="pb-3">
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {post.excerpt}
          </p>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag) => {
              // hex 색상을 RGB로 변환하는 함수
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
                  hex
                )
                return result
                  ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16),
                    }
                  : { r: 100, g: 100, b: 100 }
              }

              // 밝기 계산 (0-255)
              const getLuminance = (color: string) => {
                const rgb = hexToRgb(color)
                return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b
              }

              // 배경색이 밝으면 검은색, 어두우면 흰색 텍스트
              const textColor =
                getLuminance(tag.color) > 128 ? '#000000' : '#ffffff'

              return (
                <Link
                  key={tag.id}
                  href={`/main/tags/${encodeURIComponent(tag.name)}`}
                  className="group"
                >
                  <span
                    className="text-xs px-2.5 py-1.5 rounded-full font-semibold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-all duration-200 inline-flex items-center gap-1"
                    style={{
                      backgroundColor: tag.color,
                      color: textColor,
                    }}
                  >
                    <Tag className="w-3 h-3 flex-shrink-0" />
                    <span>{tag.name}</span>
                  </span>
                </Link>
              )
            })}
            {post.tags.length > 3 && (
              <span className="text-xs text-muted-foreground px-2 font-semibold flex items-center">
                +{post.tags.length - 3}개 더
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Avatar className="size-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback className="bg-primary/10 font-bold">
                {post.author.name?.[0] || post.author.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold line-clamp-1">
                {post.author.name || '익명'}
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                {formattedDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
            {/* 조회수 */}
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100/80 rounded-full border border-gray-200 hover:bg-gray-200/80 transition-colors">
              <Eye className="size-3 text-gray-600" />
              <span className="text-gray-700 text-xs">
                {post.viewCount >= 1000
                  ? `${(post.viewCount / 1000).toFixed(1).replace('.0', '')}K`
                  : post.viewCount.toLocaleString()}
              </span>
            </div>

            {/* 좋아요 */}
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50/80 rounded-full border border-red-200 hover:bg-red-100/80 transition-colors">
              <Heart className="size-3 text-red-500" />
              <span className="text-red-600 text-xs">
                {(post._count?.likes || 0) >= 1000
                  ? `${((post._count?.likes || 0) / 1000).toFixed(1).replace('.0', '')}K`
                  : post._count?.likes || 0}
              </span>
            </div>

            {/* 댓글 */}
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50/80 rounded-full border border-blue-200 hover:bg-blue-100/80 transition-colors">
              <MessageSquare className="size-3 text-blue-500" />
              <span className="text-blue-600 text-xs">
                {(post._count?.comments || 0) >= 1000
                  ? `${((post._count?.comments || 0) / 1000).toFixed(1).replace('.0', '')}K`
                  : post._count?.comments || 0}
              </span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
