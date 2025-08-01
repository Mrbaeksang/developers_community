'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import * as Icons from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  icon: string | null
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

  // 카테고리 이름에서 약어 생성 (아이콘이 없을 때 대체)
  const getAbbreviation = (name: string) => {
    // 영어인 경우 대문자만 추출
    const englishMatch = name.match(/[A-Z]/g)
    if (englishMatch && englishMatch.length >= 2) {
      return englishMatch.slice(0, 2).join('')
    }

    // 한글인 경우 첫 2글자
    if (/[가-힣]/.test(name)) {
      return name.slice(0, 2)
    }

    // 그 외의 경우 첫 3글자 대문자로
    return name.toUpperCase().slice(0, 3)
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
                  className="w-full h-24 mb-4 flex items-center justify-center font-bold text-2xl text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {(() => {
                    if (
                      category.icon &&
                      Icons[category.icon as keyof typeof Icons]
                    ) {
                      const IconComponent = Icons[
                        category.icon as keyof typeof Icons
                      ] as React.ComponentType<{ size?: number }>
                      return <IconComponent size={48} />
                    }
                    return getAbbreviation(category.name)
                  })()}
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
