'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  description: string
  postCount: number
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/main/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('카테고리 조회 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="border-2 border-gray-200 rounded-lg p-4">
              <div className="w-full h-24 bg-gray-200 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 카테고리별 색상 매핑
  const getColorClass = (slug: string) => {
    const colorMap: Record<string, string> = {
      web: 'bg-orange-400',
      mobile: 'bg-green-400',
      ai: 'bg-purple-400',
      cloud: 'bg-blue-400',
      data: 'bg-pink-400',
      security: 'bg-red-400',
      free: 'bg-yellow-400',
      qna: 'bg-indigo-400',
    }
    return colorMap[slug] || 'bg-gray-400'
  }

  // 카테고리 약어 생성
  const getAbbreviation = (slug: string) => {
    if (slug === 'ai') return 'AI'
    if (slug === 'security') return 'SEC'
    if (slug === 'data') return 'DATA'
    if (slug === 'qna') return 'Q&A'
    if (slug === 'free') return '자유'
    return slug.toUpperCase().slice(0, 4)
  }

  return (
    <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => {
        return (
          <Link
            key={category.slug}
            href={`/main/posts?category=${category.slug}`}
          >
            <Card
              className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer bg-white`}
            >
              <CardContent className="p-4 text-center">
                <div
                  className={`w-full h-24 ${getColorClass(category.slug)} mb-4 flex items-center justify-center font-bold text-2xl text-white`}
                >
                  {getAbbreviation(category.slug)}
                </div>
                <h4 className="font-bold">{category.name}</h4>
                <p className="text-sm text-gray-500">
                  {category.postCount}개 게시글
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
