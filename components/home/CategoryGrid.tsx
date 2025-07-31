'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, HelpCircle, ArrowRight } from 'lucide-react'

const categories = [
  {
    name: '자유게시판',
    slug: 'free',
    description: '자유롭게 이야기를 나누는 공간',
    icon: MessageSquare,
    color: 'bg-blue-100 hover:bg-blue-200',
    borderColor: 'border-blue-500',
    href: '/main/posts?category=free',
  },
  {
    name: 'Q&A 게시판',
    slug: 'qna',
    description: '궁금한 점을 질문하고 답변받기',
    icon: HelpCircle,
    color: 'bg-amber-100 hover:bg-amber-200',
    borderColor: 'border-amber-500',
    href: '/main/posts?category=qna',
  },
]

export function CategoryGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {categories.map((category) => {
        const Icon = category.icon
        return (
          <Link key={category.slug} href={category.href}>
            <Card
              className={`border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer ${category.color}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-bold text-lg">{category.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                    <div className="flex items-center text-sm font-bold group-hover:gap-3 transition-all">
                      바로가기
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
