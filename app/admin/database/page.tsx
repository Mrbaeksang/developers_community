'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Database } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Prisma 모델 목록
const TABLES = [
  'User',
  'Account',
  'Session',
  'MainCategory',
  'MainPost',
  'MainComment',
  'MainTag',
  'MainPostTag',
  'MainLike',
  'MainBookmark',
  'Community',
  'CommunityCategory',
  'CommunityMember',
  'CommunityPost',
  'CommunityComment',
  'CommunityLike',
  'CommunityBookmark',
  'CommunityAnnouncement',
  'Notification',
  'File',
]

export default function DatabaseViewerPage() {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()
  const router = useRouter()

  const fetchTableData = async (table: string, searchTerm = '', pageNum = 1) => {
    if (!table) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        search: searchTerm,
      })
      
      const response = await fetch(`/api/admin/data-viewer/${table}?${params}`)
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.')
      }

      const result = await response.json()
      setData(result.data)
      setColumns(result.columns)
      setTotalPages(result.totalPages)
      setPage(pageNum)
    } catch (error) {
      toast({
        title: '오류',
        description: '데이터를 불러오는데 실패했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, search, page)
    }
  }, [selectedTable, page])

  const handleSearch = () => {
    if (selectedTable) {
      fetchTableData(selectedTable, search, 1)
    }
  }

  const formatCellValue = (value: any, column: string) => {
    if (value === null) return <span className="text-muted-foreground">null</span>
    if (value === undefined) return <span className="text-muted-foreground">-</span>
    
    // Boolean 값
    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant="default">true</Badge>
      ) : (
        <Badge variant="secondary">false</Badge>
      )
    }
    
    // Date 값
    if (column.toLowerCase().includes('at') && value) {
      return new Date(value).toLocaleString('ko-KR')
    }
    
    // 긴 텍스트는 줄임
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...'
    }
    
    // Enum 값들은 Badge로 표시
    if (column === 'status' || column === 'role' || column === 'globalRole') {
      return <Badge variant="outline">{value}</Badge>
    }
    
    return String(value)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            데이터베이스 뷰어
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="테이블 선택" />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!selectedTable}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : data.length > 0 ? (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="font-semibold">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column} className="max-w-xs">
                            {formatCellValue(row[column], column)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  페이지 {page} / {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            </>
          ) : selectedTable ? (
            <div className="text-center py-8 text-muted-foreground">
              데이터가 없습니다.
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              테이블을 선택해주세요.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}