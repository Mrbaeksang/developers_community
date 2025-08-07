'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl?: string
  className?: string
  onPageChange?: (page: number) => void // 클라이언트 사이드 페이지네이션용
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl = '',
  className = '',
  onPageChange,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const createPageUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', page.toString())
      return `${baseUrl}?${params.toString()}`
    },
    [baseUrl, searchParams]
  )

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return

    // 클라이언트 사이드 페이지네이션
    if (onPageChange) {
      onPageChange(page)
    } else {
      // URL 기반 페이지네이션
      router.push(createPageUrl(page))
    }
  }

  // 페이지 번호 생성 (최대 5개 표시)
  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* 이전 버튼 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* 페이지 번호들 */}
      <div className="flex gap-2">
        {currentPage > 3 && (
          <>
            <Button
              variant="outline"
              onClick={() => handlePageChange(1)}
              className="min-w-[40px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] font-bold"
            >
              1
            </Button>
            {currentPage > 4 && (
              <span className="flex items-center px-2 font-bold">...</span>
            )}
          </>
        )}

        {getPageNumbers().map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            onClick={() => handlePageChange(page)}
            className={`min-w-[40px] border-2 border-black font-bold transition-all ${
              page === currentPage
                ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
            }`}
          >
            {page}
          </Button>
        ))}

        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && (
              <span className="flex items-center px-2 font-bold">...</span>
            )}
            <Button
              variant="outline"
              onClick={() => handlePageChange(totalPages)}
              className="min-w-[40px] border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] font-bold"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* 다음 버튼 */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
