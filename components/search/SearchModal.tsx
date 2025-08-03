'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PostStats } from '@/components/shared/PostStats'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { TagBadge } from '@/components/shared/TagBadge'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'

interface SearchResult {
  id: string
  title: string
  excerpt: string | null
  slug: string
  viewCount: number
  createdAt: string
  category: {
    id: string
    name: string
    slug: string
    color: string
  }
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  _count: {
    comments: number
    likes: number
  }
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchType, setSearchType] = useState<
    'all' | 'title' | 'content' | 'tag'
  >('all')
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()

  // 검색 실행
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type: searchType,
          limit: '10',
        })

        const res = await fetch(`/api/main/posts/search?${params}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.data?.results || data.results || [])
        } else {
          console.error('Search failed')
          setResults([])
        }
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    },
    [searchType]
  )

  // 디바운스된 검색
  useEffect(() => {
    performSearch(debouncedQuery)
  }, [debouncedQuery, performSearch])

  // 검색 결과 클릭 처리
  const handleResultClick = (id: string) => {
    router.push(`/main/posts/${id}`)
    onClose()
    setQuery('')
    setResults([])
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="sr-only">검색</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="border-b-2 border-black px-6 pb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="무엇을 찾고 계신가요?"
              className="pl-12 pr-12 h-14 text-lg font-medium border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search Type Filters */}
          <div className="mt-4 flex gap-3">
            <Badge
              variant={searchType === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-sm font-bold border-2 transition-all ${
                searchType === 'all'
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
              onClick={() => setSearchType('all')}
            >
              🔍 전체
            </Badge>
            <Badge
              variant={searchType === 'title' ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-sm font-bold border-2 transition-all ${
                searchType === 'title'
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
              onClick={() => setSearchType('title')}
            >
              📝 제목
            </Badge>
            <Badge
              variant={searchType === 'content' ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-sm font-bold border-2 transition-all ${
                searchType === 'content'
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
              onClick={() => setSearchType('content')}
            >
              📄 내용
            </Badge>
            <Badge
              variant={searchType === 'tag' ? 'default' : 'outline'}
              className={`cursor-pointer px-4 py-2 text-sm font-bold border-2 transition-all ${
                searchType === 'tag'
                  ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
              onClick={() => setSearchType('tag')}
            >
              #️⃣ 태그
            </Badge>
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="max-h-[500px] bg-gray-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-4 space-y-3">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className="w-full text-left bg-white border-2 border-black rounded-xl p-5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-gray-100 border-2 border-black rounded-lg group-hover:bg-gray-200 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* 카테고리 뱃지 */}
                      <div className="mb-2">
                        <CategoryBadge
                          category={result.category}
                          className="text-xs px-2.5 py-0.5"
                          clickable={false}
                        />
                      </div>

                      {/* 제목 */}
                      <h4 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {result.title}
                      </h4>

                      {/* 요약 */}
                      {result.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {result.excerpt}
                        </p>
                      )}

                      {/* 메타 정보 */}
                      <div className="flex items-center gap-4 text-xs">
                        <AuthorAvatar
                          author={result.author}
                          size="xs"
                          showName
                          avatarClassName="border border-black"
                          textClassName="font-medium"
                        />

                        <span className="text-gray-400">•</span>

                        <span className="text-gray-500">
                          {formatDistanceToNow(new Date(result.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>

                      {/* 통계 정보 */}
                      <PostStats
                        viewCount={result.viewCount}
                        likeCount={result._count.likes}
                        commentCount={result._count.comments}
                        size="sm"
                        variant="minimal"
                        className="mt-3"
                      />

                      {/* 태그 */}
                      {result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {result.tags.map((tag) => (
                            <TagBadge
                              key={tag.id}
                              tag={{ ...tag, color: '#E5E7EB' }}
                              size="sm"
                              clickable={false}
                              className="text-xs px-2 py-0.5 border-gray-300"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 화살표 */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-2xl">→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-16 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-100 border-2 border-black rounded-full">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">
                  &quot;{query}&quot;에 대한 검색 결과가 없습니다.
                </p>
                <p className="text-sm text-gray-500">
                  다른 키워드로 검색해보세요.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="p-4 bg-gray-100 border-2 border-black rounded-full animate-pulse">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-600">
                  검색어를 입력해주세요
                </p>
                <p className="text-sm text-gray-500">
                  제목, 내용, 태그로 검색할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t-2 border-black px-6 py-4 bg-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border-2 border-black rounded-lg font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                ESC
              </kbd>
              <span className="font-medium">닫기</span>
            </span>
            <span className="text-gray-400">|</span>
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-white border-2 border-black rounded-lg font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                Enter
              </kbd>
              <span className="font-medium">선택</span>
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {results.length > 0 && `${results.length}개 결과`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
