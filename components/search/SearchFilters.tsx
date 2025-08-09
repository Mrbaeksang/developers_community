'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/core/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface SearchFilter {
  type: 'category' | 'tag' | 'author' | 'community' | 'date' | 'sort'
  key: string
  value: string | string[]
  label: string
}

interface SearchFiltersProps {
  filters: SearchFilter[]
  onFiltersChange: (filters: SearchFilter[]) => void
  availableOptions?: {
    categories?: { id: string; name: string; color?: string }[]
    tags?: { id: string; name: string; slug: string; color?: string }[]
    communities?: { id: string; name: string; slug: string }[]
    authors?: { id: string; name: string; username?: string }[]
  }
  showCompact?: boolean
  className?: string
}

const sortOptions = [
  { value: 'newest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'mostViewed', label: '조회수 순' },
  { value: 'mostLiked', label: '좋아요 순' },
  { value: 'mostCommented', label: '댓글 순' },
  { value: 'relevance', label: '관련도 순' },
]

const dateRangeOptions = [
  { value: 'all', label: '전체 기간' },
  { value: '1day', label: '1일 이내' },
  { value: '1week', label: '1주일 이내' },
  { value: '1month', label: '1개월 이내' },
  { value: '3months', label: '3개월 이내' },
  { value: '6months', label: '6개월 이내' },
  { value: '1year', label: '1년 이내' },
]

export function SearchFilters({
  filters,
  onFiltersChange,
  availableOptions = {},
  showCompact = false,
  className,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(!showCompact)
  const [searchTerm, setSearchTerm] = useState('')

  const hasActiveFilters = filters.length > 0

  const addFilter = (filter: SearchFilter) => {
    const existingIndex = filters.findIndex(
      (f) => f.type === filter.type && f.key === filter.key
    )

    if (existingIndex >= 0) {
      const newFilters = [...filters]
      newFilters[existingIndex] = filter
      onFiltersChange(newFilters)
    } else {
      onFiltersChange([...filters, filter])
    }
  }

  const removeFilter = (type: string, key: string) => {
    onFiltersChange(filters.filter((f) => !(f.type === type && f.key === key)))
  }

  const clearAllFilters = () => {
    onFiltersChange([])
    setSearchTerm('')
  }

  const getFilterValue = (type: string, key: string) => {
    return filters.find((f) => f.type === type && f.key === key)?.value
  }

  return (
    <div
      className={cn(
        'border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white',
        className
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-bold text-lg">검색 필터</h3>
          {hasActiveFilters && (
            <Badge
              variant="secondary"
              className="border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {filters.length}개 적용중
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-red-600"
            >
              전체 해제
            </Button>
          )}
          {showCompact && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
      </div>

      <CollapsibleContent>
        <div className="p-4 space-y-6">
          {/* 활성 필터 표시 */}
          {hasActiveFilters && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                적용된 필터
              </Label>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Badge
                    key={`${filter.type}-${filter.key}`}
                    variant="default"
                    className="border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-primary text-primary-foreground"
                  >
                    {filter.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => removeFilter(filter.type, filter.key)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          )}

          {/* 검색어 필터 */}
          <div>
            <Label
              htmlFor="search"
              className="text-sm font-semibold mb-2 block"
            >
              키워드 검색
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요..."
                className="border-2 border-black pl-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    addFilter({
                      type: 'tag',
                      key: 'search',
                      value: searchTerm.trim(),
                      label: `검색: ${searchTerm.trim()}`,
                    })
                    setSearchTerm('')
                  }
                }}
              />
            </div>
          </div>

          {/* 정렬 필터 */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">정렬</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {sortOptions.find(
                    (opt) => opt.value === getFilterValue('sort', 'order')
                  )?.label || '정렬 선택'}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {sortOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            addFilter({
                              type: 'sort',
                              key: 'order',
                              value: option.value,
                              label: `정렬: ${option.label}`,
                            })
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              getFilterValue('sort', 'order') === option.value
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 기간 필터 */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">작성일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  {dateRangeOptions.find(
                    (opt) => opt.value === getFilterValue('date', 'range')
                  )?.label || '기간 선택'}
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {dateRangeOptions.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.value}
                          onSelect={() => {
                            if (option.value === 'all') {
                              removeFilter('date', 'range')
                            } else {
                              addFilter({
                                type: 'date',
                                key: 'range',
                                value: option.value,
                                label: `기간: ${option.label}`,
                              })
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              getFilterValue('date', 'range') === option.value
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* 카테고리 필터 */}
          {availableOptions.categories &&
            availableOptions.categories.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  카테고리
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      카테고리 선택
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Command>
                      <CommandInput placeholder="카테고리 검색..." />
                      <CommandList>
                        <CommandEmpty>
                          카테고리를 찾을 수 없습니다.
                        </CommandEmpty>
                        <CommandGroup>
                          {availableOptions.categories.map((category) => (
                            <CommandItem
                              key={category.id}
                              value={category.name}
                              onSelect={() => {
                                addFilter({
                                  type: 'category',
                                  key: category.id,
                                  value: category.id,
                                  label: `카테고리: ${category.name}`,
                                })
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded border border-black"
                                  style={{
                                    backgroundColor:
                                      category.color || '#6366f1',
                                  }}
                                />
                                {category.name}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

          {/* 커뮤니티 필터 */}
          {availableOptions.communities &&
            availableOptions.communities.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  커뮤니티
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      커뮤니티 선택
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Command>
                      <CommandInput placeholder="커뮤니티 검색..." />
                      <CommandList>
                        <CommandEmpty>
                          커뮤니티를 찾을 수 없습니다.
                        </CommandEmpty>
                        <CommandGroup>
                          {availableOptions.communities.map((community) => (
                            <CommandItem
                              key={community.id}
                              value={community.name}
                              onSelect={() => {
                                addFilter({
                                  type: 'community',
                                  key: community.id,
                                  value: community.id,
                                  label: `커뮤니티: ${community.name}`,
                                })
                              }}
                            >
                              {community.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

          {/* 태그 필터 */}
          {availableOptions.tags && availableOptions.tags.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">태그</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    태그 선택
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Command>
                    <CommandInput placeholder="태그 검색..." />
                    <CommandList>
                      <CommandEmpty>태그를 찾을 수 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {availableOptions.tags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            value={tag.name}
                            onSelect={() => {
                              addFilter({
                                type: 'tag',
                                key: tag.id,
                                value: tag.slug,
                                label: `태그: ${tag.name}`,
                              })
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full border border-black"
                                style={{
                                  backgroundColor: tag.color || '#64748b',
                                }}
                              />
                              {tag.name}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* 작성자 필터 */}
          {availableOptions.authors && availableOptions.authors.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">작성자</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    작성자 선택
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Command>
                    <CommandInput placeholder="작성자 검색..." />
                    <CommandList>
                      <CommandEmpty>작성자를 찾을 수 없습니다.</CommandEmpty>
                      <CommandGroup>
                        {availableOptions.authors.map((author) => (
                          <CommandItem
                            key={author.id}
                            value={author.name}
                            onSelect={() => {
                              addFilter({
                                type: 'author',
                                key: author.id,
                                value: author.id,
                                label: `작성자: ${author.name}`,
                              })
                            }}
                          >
                            <div className="flex flex-col">
                              <span>{author.name}</span>
                              {author.username && (
                                <span className="text-xs text-muted-foreground">
                                  @{author.username}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </div>
  )
}
