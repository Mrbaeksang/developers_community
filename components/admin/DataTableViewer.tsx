'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ButtonSpinner,
  LoadingSpinner,
} from '@/components/shared/LoadingSpinner'

interface DataTableViewerProps {
  className?: string
}

const TABLES = [
  { value: 'users', label: '사용자', key: 'id' },
  { value: 'mainPosts', label: '메인 게시글', key: 'id' },
  { value: 'mainComments', label: '메인 댓글', key: 'id' },
  { value: 'communities', label: '커뮤니티', key: 'id' },
  { value: 'communityPosts', label: '커뮤니티 게시글', key: 'id' },
  { value: 'mainLikes', label: '좋아요', key: 'userId_postId' },
  { value: 'mainBookmarks', label: '북마크', key: 'userId_postId' },
  { value: 'mainTags', label: '태그', key: 'id' },
]

export function DataTableViewer({ className }: DataTableViewerProps) {
  const [selectedTable, setSelectedTable] = useState('users')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [columns, setColumns] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/data-viewer/${selectedTable}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data || [])
        if (result.data && result.data.length > 0) {
          setColumns(Object.keys(result.data[0]))
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedTable])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const formatCellValue = (value: unknown): string => {
    if (value === null) return 'NULL'
    if (value === undefined) return ''
    if (value instanceof Date) return new Date(value).toLocaleString('ko-KR')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const getColumnType = (value: unknown) => {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (
      value instanceof Date ||
      (typeof value === 'string' && !isNaN(Date.parse(value)))
    )
      return 'date'
    return 'string'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터 테이블 뷰어
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map((table) => (
                  <SelectItem key={table.value} value={table.value}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? <ButtonSpinner /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary">총 {data.length}개 레코드</Badge>
          </div>
          <ScrollArea className="h-[500px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="font-medium">
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center">
                      <LoadingSpinner size="lg" className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center text-muted-foreground"
                    >
                      데이터가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => {
                        const value = row[column]
                        const type = getColumnType(value)
                        return (
                          <TableCell key={column} className="font-mono text-sm">
                            <span
                              className={
                                type === 'null'
                                  ? 'text-muted-foreground italic'
                                  : type === 'boolean'
                                    ? 'text-blue-600'
                                    : type === 'number'
                                      ? 'text-green-600'
                                      : type === 'date'
                                        ? 'text-purple-600'
                                        : ''
                              }
                            >
                              {formatCellValue(value)}
                            </span>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
