'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, Hash, User, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDebounce } from '@/hooks/use-debounce'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

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
    tag: {
      id: string
      name: string
      slug: string
    }
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
          setResults(data.results || [])
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
  const handleResultClick = (slug: string) => {
    router.push(`/main/posts/${slug}`)
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
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle className="sr-only">검색</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="border-b px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="게시글 검색..."
              className="pl-9 pr-9"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Type Filters */}
          <div className="mt-3 flex gap-2">
            <Badge
              variant={searchType === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSearchType('all')}
            >
              전체
            </Badge>
            <Badge
              variant={searchType === 'title' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSearchType('title')}
            >
              제목
            </Badge>
            <Badge
              variant={searchType === 'content' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSearchType('content')}
            >
              내용
            </Badge>
            <Badge
              variant={searchType === 'tag' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSearchType('tag')}
            >
              태그
            </Badge>
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.slug)}
                  className="w-full rounded-lg p-3 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <h4 className="font-medium">{result.title}</h4>
                      {result.excerpt && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {result.excerpt}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: result.category.color }}
                          className="text-white"
                        >
                          {result.category.name}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {result.author.name ||
                            result.author.username ||
                            'Unknown'}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(result.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                      {result.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {result.tags.map(({ tag }) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs"
                            >
                              <Hash className="mr-0.5 h-2.5 w-2.5" />
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="py-8 text-center text-muted-foreground">
              "{query}"에 대한 검색 결과가 없습니다.
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              검색어를 입력해주세요.
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3 text-xs text-muted-foreground">
          <kbd className="rounded bg-muted px-1">ESC</kbd> 닫기
        </div>
      </DialogContent>
    </Dialog>
  )
}
