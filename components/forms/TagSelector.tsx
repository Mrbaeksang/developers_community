'use client'

import { useState, useCallback } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

interface TagSelectorProps {
  value: string[] // 선택된 태그 slug 배열
  onChange: (tags: string[]) => void // 태그 변경 콜백
  maxTags?: number // 최대 태그 수 (기본: 10)
  placeholder?: string // 입력 플레이스홀더
  disabled?: boolean // 비활성화 상태
  className?: string // 추가 스타일
  showPopularTags?: boolean // 인기 태그 표시 (기본: true)
}

interface PopularTag {
  id: string
  name: string
  slug: string
  count: number
  color?: string
}

// 태그 검증 (PostEditor에서 가져온 로직)
const validateTag = (tag: string): string => {
  if (!tag.trim()) return ''
  if (tag.length < 2) return '태그는 2자 이상이어야 합니다'
  if (tag.length > 30) return '태그는 30자 이하여야 합니다'

  // 태그 패턴: 한글, 영문, 숫자, 공백, 하이픈만 허용
  if (!/^[가-힣a-zA-Z0-9\s-]+$/.test(tag)) {
    return '태그는 한글, 영문, 숫자, 공백, 하이픈만 사용 가능합니다'
  }

  return ''
}

// Slug 생성 (기존 PostEditor 방식)
const createSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-')
}

export function TagSelector({
  value = [],
  onChange,
  maxTags = 10,
  placeholder = '태그를 입력하고 Enter를 누르세요',
  disabled = false,
  className = '',
  showPopularTags = true,
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  // 인기 태그 조회 (기존 API 활용)
  const { data: popularTags, isLoading } = useQuery<PopularTag[]>({
    queryKey: ['popular-tags'],
    queryFn: async () => {
      const response = await fetch('/api/main/tags?limit=10')
      if (!response.ok) {
        throw new Error('Failed to fetch popular tags')
      }
      const data = await response.json()
      return data.items || []
    },
    enabled: showPopularTags,
    staleTime: 1000 * 60 * 60, // 1시간 캐싱
  })

  // 태그 추가 로직 (기존 PostEditor 방식)
  const handleAddTag = useCallback(() => {
    if (!inputValue.trim()) return

    // 검증
    const validationError = validateTag(inputValue)
    if (validationError) {
      setError(validationError)
      return
    }

    const slug = createSlug(inputValue)

    // 중복 체크
    if (value.includes(slug)) {
      toast.error('이미 추가된 태그입니다')
      return
    }

    // 최대 개수 체크
    if (value.length >= maxTags) {
      toast.error(`태그는 최대 ${maxTags}개까지 추가할 수 있습니다`)
      return
    }

    // 태그 추가
    onChange([...value, slug])
    setInputValue('')
    setError('')
  }, [inputValue, value, onChange, maxTags])

  // 태그 제거
  const handleRemoveTag = useCallback(
    (slug: string) => {
      onChange(value.filter((s) => s !== slug))
    },
    [value, onChange]
  )

  // 인기 태그 선택
  const handlePopularTagClick = useCallback(
    (tag: PopularTag) => {
      if (value.includes(tag.slug)) {
        toast.info('이미 선택된 태그입니다')
        return
      }

      if (value.length >= maxTags) {
        toast.error(`태그는 최대 ${maxTags}개까지 추가할 수 있습니다`)
        return
      }

      onChange([...value, tag.slug])
    },
    [value, onChange, maxTags]
  )

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 입력 필드 */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            const validationError = validateTag(e.target.value)
            setError(validationError)
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddTag()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 border-2 border-black focus:ring-4 focus:ring-blue-200 ${
            error ? 'border-red-500 focus:ring-red-200' : ''
          }`}
        />
        <Button
          type="button"
          onClick={handleAddTag}
          disabled={disabled || !inputValue.trim()}
          variant="outline"
          className="border-2 border-black hover:bg-gray-100"
        >
          추가
        </Button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}

      {/* 선택된 태그 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((slug) => (
            <Badge
              key={slug}
              variant="secondary"
              className="border-2 border-black bg-yellow-200 px-3 py-1 text-black hover:bg-yellow-300"
            >
              {slug}
              <button
                type="button"
                onClick={() => handleRemoveTag(slug)}
                className="ml-2 hover:text-red-600"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 인기 태그 */}
      {showPopularTags && popularTags && popularTags.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">인기 태그:</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handlePopularTagClick(tag)}
                disabled={value.includes(tag.slug) || disabled}
                className="rounded-full border-2 border-gray-300 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:border-black hover:bg-gray-200 disabled:opacity-50"
              >
                {tag.name}
                {tag.count > 0 && (
                  <span className="ml-1 text-xs text-gray-500">
                    ({tag.count})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {showPopularTags && isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          인기 태그 불러오는 중...
        </div>
      )}
    </div>
  )
}
