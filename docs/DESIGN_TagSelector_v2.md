# TagSelector Component Design (실제 구현 기반)

## 🎯 목적
PostEditor의 기존 태그 입력 방식을 개선하여 재사용 가능한 컴포넌트로 분리

## 📌 현재 구현 분석

### 현재 PostEditor 태그 처리
```typescript
// 상태 관리
const [selectedTags, setSelectedTags] = useState<string[]>([])
const [tagInput, setTagInput] = useState('')

// 태그는 slug 형태로 저장 (lowercase, dash 구분)
// 예: "React Native" → "react-native"
```

### 기존 API 활용
- **GET /api/main/tags**: 인기 태그 조회 (postCount 기준 정렬)
- **POST /api/main/tags**: 새 태그 생성 (관리자/매니저만)
- Redis 캐싱 적용 (1시간)

## 🏗️ 컴포넌트 설계

### 1. 기본 인터페이스
```typescript
interface TagSelectorProps {
  value: string[]                    // 선택된 태그 slug 배열
  onChange: (tags: string[]) => void // 태그 변경 콜백
  maxTags?: number                    // 최대 태그 수 (기본: 10)
  placeholder?: string                // 입력 플레이스홀더
  disabled?: boolean                  // 비활성화 상태
  className?: string                  // 추가 스타일
  showPopularTags?: boolean          // 인기 태그 표시 (기본: true)
}

interface PopularTag {
  id: string
  name: string
  slug: string
  count: number
  color?: string
}
```

### 2. 핵심 기능
- ✅ 수동 태그 입력 (현재 방식 유지)
- ✅ Enter 키로 태그 추가
- ✅ 인기 태그 클릭으로 빠른 추가
- ✅ 중복 태그 방지
- ✅ 최대 10개 제한
- ✅ 태그 삭제 (X 버튼)

### 3. 검증 로직 (기존 활용)
```typescript
// 태그 검증 (2-30자, 한글/영문/숫자/공백/하이픈)
const validateTag = (tag: string): string => {
  if (!tag.trim()) return '태그를 입력해주세요'
  if (tag.length < 2) return '태그는 2자 이상이어야 합니다'
  if (tag.length > 30) return '태그는 30자 이하여야 합니다'
  if (!/^[가-힣a-zA-Z0-9\s-]+$/.test(tag)) {
    return '태그는 한글, 영문, 숫자, 공백, 하이픈만 사용 가능합니다'
  }
  return ''
}

// Slug 생성 (기존 방식)
const createSlug = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-')
}
```

## 🎨 UI 구조

### 현재 UI 유지
```
┌─────────────────────────────────────┐
│ 선택된 태그 (노란색 뱃지)            │
│ [React ✕] [Next.js ✕] [TypeScript ✕]│
│                                     │
│ ┌─────────────────────┐ ┌────┐    │
│ │ 태그 입력...        │ │추가│    │
│ └─────────────────────┘ └────┘    │
│                                     │
│ 인기 태그:                          │
│ [JavaScript(523)] [React(421)]      │
└─────────────────────────────────────┘
```

### Neobrutalism 스타일 유지
- 선택된 태그: `border-2 border-black bg-yellow-200`
- 인기 태그: `border-2 border-gray-300 bg-gray-100 hover:border-black`
- 입력 필드: `border-2 border-black focus:ring-4 focus:ring-blue-200`

## 📦 구현 계획

### 1단계: 기본 컴포넌트 생성
```typescript
// components/forms/TagSelector.tsx
'use client'

import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

export function TagSelector({ 
  value, 
  onChange, 
  maxTags = 10,
  showPopularTags = true,
  ...props 
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState('')

  // 인기 태그 조회 (기존 API 활용)
  const { data: popularTags } = useQuery({
    queryKey: ['popular-tags'],
    queryFn: async () => {
      const res = await fetch('/api/main/tags?limit=10')
      const data = await res.json()
      return data.items || []
    },
    enabled: showPopularTags,
    staleTime: 1000 * 60 * 60, // 1시간
  })

  // 태그 추가 로직 (기존 방식)
  const handleAddTag = useCallback(() => {
    // 검증
    const error = validateTag(inputValue)
    if (error) {
      setError(error)
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
  const handleRemoveTag = useCallback((slug: string) => {
    onChange(value.filter(s => s !== slug))
  }, [value, onChange])

  return (
    <div className="space-y-3">
      {/* 선택된 태그 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(slug => (
            <Badge
              key={slug}
              className="border-2 border-black bg-yellow-200 px-3 py-1"
            >
              {slug}
              <button
                onClick={() => handleRemoveTag(slug)}
                className="ml-2 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 입력 필드 */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setError('')
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddTag()
            }
          }}
          placeholder={props.placeholder}
          disabled={props.disabled}
          className={`border-2 border-black ${error ? 'border-red-500' : ''}`}
        />
        <Button 
          onClick={handleAddTag}
          disabled={props.disabled}
          variant="outline"
          className="border-2 border-black"
        >
          추가
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 인기 태그 */}
      {showPopularTags && popularTags?.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">인기 태그:</p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag: PopularTag) => (
              <button
                key={tag.id}
                onClick={() => {
                  if (!value.includes(tag.slug) && value.length < maxTags) {
                    onChange([...value, tag.slug])
                  }
                }}
                disabled={value.includes(tag.slug) || props.disabled}
                className="rounded-full border-2 border-gray-300 bg-gray-100 px-3 py-1 text-sm hover:border-black hover:bg-gray-200 disabled:opacity-50"
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
    </div>
  )
}
```

### 2단계: PostEditor 통합
```typescript
// PostEditor.tsx 수정
import { TagSelector } from '@/components/forms/TagSelector'

// 기존 태그 관련 상태와 로직 제거
// TagSelector 컴포넌트로 대체
<TagSelector
  value={selectedTags}
  onChange={setSelectedTags}
  maxTags={10}
  placeholder="태그를 입력하고 Enter를 누르세요"
  disabled={isSubmitting}
  showPopularTags={true}
/>
```

## ✅ 장점
1. **재사용성**: 다른 에디터에서도 사용 가능
2. **유지보수**: 태그 로직 중앙화
3. **일관성**: 동일한 태그 처리 방식
4. **기존 호환**: 현재 API와 데이터 구조 그대로 활용

## 🚀 향후 개선 (선택사항)
- 태그 자동완성 (타이핑 중 추천)
- 태그 색상 커스터마이징
- 태그 그룹화 (카테고리별)
- 드래그 앤 드롭으로 순서 변경

## 📝 체크리스트
- [ ] TagSelector 컴포넌트 생성
- [ ] 태그 검증 로직 이동
- [ ] 인기 태그 API 연동
- [ ] Neobrutalism 스타일 적용
- [ ] PostEditor 통합
- [ ] 테스트 작성
- [ ] 문서화