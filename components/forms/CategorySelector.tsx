'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  color: string
  icon?: string | null
  isActive?: boolean
  requiresApproval?: boolean // MainCategory only
  communityId?: string // CommunityCategory only
}

interface CategorySelectorProps {
  value?: string | null
  onChange: (categoryId: string | null) => void
  categories: Category[]
  placeholder?: string
  disabled?: boolean
  allowNone?: boolean
  className?: string
  showDescription?: boolean
  groupByApproval?: boolean // Group MainCategories by requiresApproval
}

export function CategorySelector({
  value,
  onChange,
  categories,
  placeholder = '카테고리를 선택하세요',
  disabled = false,
  allowNone = true,
  className,
  showDescription = true,
  groupByApproval = false,
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter active categories
  const activeCategories = useMemo(
    () => categories.filter((cat) => cat.isActive !== false),
    [categories]
  )

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return activeCategories

    const query = searchQuery.toLowerCase()
    return activeCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        cat.slug.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query))
    )
  }, [activeCategories, searchQuery])

  // Group categories if needed (for MainCategory)
  const groupedCategories = useMemo(() => {
    if (!groupByApproval) return { all: filteredCategories }

    const groups: Record<string, Category[]> = {
      instant: [],
      approval: [],
    }

    filteredCategories.forEach((cat) => {
      if (cat.requiresApproval) {
        groups.approval.push(cat)
      } else {
        groups.instant.push(cat)
      }
    })

    return groups
  }, [filteredCategories, groupByApproval])

  // Get selected category
  const selectedCategory = activeCategories.find((cat) => cat.id === value)

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  const handleSelect = (categoryId: string | null) => {
    onChange(categoryId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="카테고리 선택"
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            'border-2 border-black',
            'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            'hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
            'transition-all duration-200',
            'bg-white hover:bg-gray-50',
            'font-medium',
            className
          )}
        >
          <div className="flex items-center gap-2">
            {selectedCategory ? (
              <>
                <div
                  className="h-3 w-3 rounded-full border border-black"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span>{selectedCategory.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[320px] p-0',
          'border-2 border-black',
          'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'bg-white'
        )}
        align="start"
      >
        <div className="border-b-2 border-black p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="카테고리 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'pl-9 pr-3',
                'border-2 border-black',
                'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                'focus:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {allowNone && (
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left',
                  'hover:bg-gray-100 transition-colors',
                  'flex items-center justify-between',
                  'mb-2',
                  !value && 'bg-gray-50'
                )}
              >
                <span className="text-gray-600">카테고리 없음</span>
                {!value && <Check className="h-4 w-4" />}
              </button>
            )}

            {groupByApproval ? (
              <>
                {groupedCategories.instant?.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 px-3 text-xs font-semibold text-gray-500">
                      즉시 게시
                    </div>
                    {groupedCategories.instant.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        isSelected={value === category.id}
                        onSelect={() => handleSelect(category.id)}
                        showDescription={showDescription}
                      />
                    ))}
                  </div>
                )}
                {groupedCategories.approval?.length > 0 && (
                  <div>
                    <div className="mb-2 px-3 text-xs font-semibold text-gray-500">
                      승인 필요
                    </div>
                    {groupedCategories.approval.map((category) => (
                      <CategoryItem
                        key={category.id}
                        category={category}
                        isSelected={value === category.id}
                        onSelect={() => handleSelect(category.id)}
                        showDescription={showDescription}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              groupedCategories.all?.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isSelected={value === category.id}
                  onSelect={() => handleSelect(category.id)}
                  showDescription={showDescription}
                />
              ))
            )}

            {filteredCategories.length === 0 && (
              <div className="py-6 text-center text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

interface CategoryItemProps {
  category: Category
  isSelected: boolean
  onSelect: () => void
  showDescription: boolean
}

function CategoryItem({
  category,
  isSelected,
  onSelect,
  showDescription,
}: CategoryItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-md px-3 py-2 text-left',
        'hover:bg-gray-100 transition-colors',
        'flex items-center justify-between',
        'mb-1',
        isSelected && 'bg-gray-50'
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        <div
          className="h-3 w-3 rounded-full border border-black flex-shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
            {category.requiresApproval && (
              <Badge
                variant="outline"
                className="text-xs border-gray-300 bg-gray-50"
              >
                승인
              </Badge>
            )}
          </div>
          {showDescription && category.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {category.description}
            </p>
          )}
        </div>
      </div>
      {isSelected && <Check className="h-4 w-4 flex-shrink-0 ml-2" />}
    </button>
  )
}
