'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface CommunitySearchFormProps {
  initialSearch?: string
}

export default function CommunitySearchForm({
  initialSearch = '',
}: CommunitySearchFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())

    if (search.trim()) {
      params.set('search', search.trim())
      params.delete('page') // 검색 시 페이지를 1로 리셋
    } else {
      params.delete('search')
    }

    router.push(`/communities?${params.toString()}`)
  }

  const clearSearch = () => {
    setSearch('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('search')
    params.delete('page')
    router.push(`/communities?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <Input
          type="text"
          placeholder="React, Node.js, Python... 기술 스택으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 pr-10 h-11 text-sm font-medium border-0 focus:outline-none focus:ring-0 bg-transparent w-full placeholder:text-gray-500"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>
    </form>
  )
}
