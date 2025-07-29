'use client'

import { useState, useEffect } from 'react'
import { X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TestResult {
  id: string
  type: 'user' | 'post' | 'community' | 'comment' | 'like' | 'bookmark' | 'tag'
  title: string
  subtitle?: string
  createdAt: Date
  data: {
    message?: string
    created?: unknown
    [key: string]: unknown
  }
}

interface TestResultsPanelProps {
  results: TestResult[]
  onClear: () => void
  onDelete?: (id: string) => void
}

export function TestResultsPanel({ results, onClear, onDelete }: TestResultsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (results.length > 0) {
      setIsVisible(true)
      setIsExpanded(true)
    }
  }, [results.length])

  if (!isVisible || results.length === 0) return null

  const getTypeColor = (type: TestResult['type']) => {
    const colors = {
      user: 'bg-blue-500',
      post: 'bg-green-500',
      community: 'bg-purple-500',
      comment: 'bg-yellow-500',
      like: 'bg-red-500',
      bookmark: 'bg-indigo-500',
      tag: 'bg-pink-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  const getTypeLabel = (type: TestResult['type']) => {
    const labels = {
      user: '사용자',
      post: '게시글',
      community: '커뮤니티',
      comment: '댓글',
      like: '좋아요',
      bookmark: '북마크',
      tag: '태그',
    }
    return labels[type] || type
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 z-50 px-4 pb-4">
      <Card className="mx-auto max-w-4xl shadow-lg">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">테스트 결과</h3>
            <Badge variant="secondary">{results.length}개 항목</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClear}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-96' : 'max-h-0'
          )}
        >
          <ScrollArea className="h-96 p-4">
            <div className="space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        getTypeColor(result.type)
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{result.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(result.type)}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.createdAt).toLocaleTimeString()}
                    </span>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(result.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  )
}