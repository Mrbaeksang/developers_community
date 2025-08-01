'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
    <form onSubmit={handleSearch} className="flex gap-4 max-w-4xl mx-auto">
      <div className="relative flex-1">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Search className="h-5 w-5 text-white" />
        </div>
        <Input
          type="text"
          placeholder="🔍 React, Vue, Next.js... 관심 있는 기술로 검색해보세요!"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-20 pr-14 h-16 text-lg font-medium border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all duration-200 rounded-2xl bg-gradient-to-r from-white to-purple-50"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-red-100 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all bg-white"
          >
            <X className="h-5 w-5 text-red-500" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        size="lg"
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-200 rounded-2xl"
      >
        <Search className="h-5 w-5 mr-2" />
        검색하기
      </Button>
    </form>
  )
}
