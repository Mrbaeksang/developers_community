'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
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

// Prisma 모델 목록 (한글 설명 포함)
const TABLES = [
  {
    value: 'User',
    label: '사용자',
    description: '회원가입한 모든 사용자의 정보 (이메일, 이름, 프로필 등)',
  },
  {
    value: 'Account',
    label: '계정',
    description: '소셜 로그인 연동 정보 (구글, 카카오 등 OAuth 계정 연결)',
  },
  {
    value: 'Session',
    label: '세션',
    description: '현재 로그인된 사용자들의 세션 정보 (로그인 상태 관리)',
  },
  {
    value: 'MainCategory',
    label: '메인 카테고리',
    description: '메인 게시판의 카테고리 목록 (개발, 디자인 등)',
  },
  {
    value: 'MainPost',
    label: '메인 게시글',
    description: '메인 게시판에 작성된 모든 게시글',
  },
  {
    value: 'MainComment',
    label: '메인 댓글',
    description: '메인 게시글에 달린 댓글들',
  },
  {
    value: 'MainTag',
    label: '메인 태그',
    description: '메인 게시글에 사용 가능한 태그 목록 (#React, #Node.js 등)',
  },
  {
    value: 'MainPostTag',
    label: '메인 게시글-태그',
    description: '어떤 게시글에 어떤 태그가 달려있는지 연결 정보',
  },
  {
    value: 'MainLike',
    label: '메인 좋아요',
    description: '누가 어떤 메인 게시글에 좋아요를 눌렀는지 기록',
  },
  {
    value: 'MainBookmark',
    label: '메인 북마크',
    description: '사용자가 저장한 메인 게시글 목록',
  },
  {
    value: 'Community',
    label: '커뮤니티',
    description: '생성된 모든 커뮤니티 정보',
  },
  {
    value: 'CommunityCategory',
    label: '커뮤니티 카테고리',
    description: '각 커뮤니티 내부의 카테고리 (공지, 자유게시판 등)',
  },
  {
    value: 'CommunityMember',
    label: '커뮤니티 멤버',
    description: '각 커뮤니티에 가입한 멤버와 권한 정보',
  },
  {
    value: 'CommunityPost',
    label: '커뮤니티 게시글',
    description: '커뮤니티에 작성된 게시글들',
  },
  {
    value: 'CommunityComment',
    label: '커뮤니티 댓글',
    description: '커뮤니티 게시글의 댓글들',
  },
  {
    value: 'CommunityLike',
    label: '커뮤니티 좋아요',
    description: '커뮤니티 게시글 좋아요 기록',
  },
  {
    value: 'CommunityBookmark',
    label: '커뮤니티 북마크',
    description: '사용자가 저장한 커뮤니티 게시글',
  },
  {
    value: 'CommunityAnnouncement',
    label: '커뮤니티 공지',
    description: '커뮤니티별 공지사항',
  },
  {
    value: 'Notification',
    label: '알림',
    description: '사용자에게 전송된 알림 (댓글, 좋아요 등)',
  },
  {
    value: 'File',
    label: '파일',
    description: '업로드된 이미지, 문서 등 파일 정보',
  },
]

// 컬럼 한글 번역
const COLUMN_TRANSLATIONS: Record<string, string> = {
  // 공통 필드
  id: '고유번호',
  createdAt: '생성일시',
  updatedAt: '수정일시',

  // User 관련
  email: '이메일',
  username: '사용자명',
  name: '이름',
  image: '프로필 이미지',
  bio: '자기소개',
  globalRole: '전역 권한',
  isBanned: '차단 여부',
  bannedAt: '차단 일시',
  bannedBy: '차단한 관리자',
  bannedReason: '차단 사유',
  emailVerified: '이메일 인증일',

  // Post 관련
  title: '제목',
  content: '내용',
  contentHtml: 'HTML 내용',
  excerpt: '요약',
  slug: 'URL 경로',
  status: '상태',
  viewCount: '조회수',
  authorId: '작성자',
  authorRole: '작성자 권한',
  categoryId: '카테고리',
  category: '카테고리',
  author: '작성자',
  community: '커뮤니티',

  // Community 관련
  description: '설명',
  rules: '규칙',
  avatar: '아바타 이미지',
  banner: '배너 이미지',
  visibility: '공개 설정',
  memberCount: '멤버 수',
  postCount: '게시글 수',
  allowFileUpload: '파일 업로드 허용',
  allowChat: '채팅 허용',
  isActive: '활성화 여부',
  ownerId: '소유자',
  role: '역할',

  // CommunityMember 관련
  joinedAt: '가입일',
  leftAt: '탈퇴일',
  bannedUntil: '차단 종료일',

  // Comment 관련
  postId: '게시글',
  post: '게시글',
  parentId: '부모 댓글',
  parent: '부모 댓글',
  isEdited: '수정됨',

  // Notification 관련
  type: '알림 유형',
  isRead: '읽음 여부',
  message: '메시지',
  relatedId: '관련 항목',

  // File 관련
  filename: '파일명',
  mimeType: '파일 형식',
  size: '파일 크기',
  url: '다운로드 주소',
  uploadedBy: '업로드한 사용자',

  // 관계 필드
  userId: '사용자',
  communityId: '커뮤니티',
  tagId: '태그',
  commentId: '댓글',
  color: '색상',
  icon: '아이콘',
  order: '표시 순서',

  // Session 관련
  sessionToken: '세션 토큰',
  expires: '만료일시',

  // Account 관련
  provider: '로그인 제공자',
  providerAccountId: '제공자 계정 ID',
  refresh_token: '리프레시 토큰',
  access_token: '액세스 토큰',
  expires_at: '토큰 만료 시간',
  token_type: '토큰 유형',
  scope: '권한 범위',
  id_token: 'ID 토큰',

  // Like/Bookmark
  likedAt: '좋아요 일시',
  bookmarkedAt: '북마크 일시',

  // Tag
  count: '사용 횟수',

  // Announcement
  isPinned: '고정 여부',
}

export default function DatabaseViewerPage() {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // 선택된 테이블의 한글 이름 가져오기
  const getTableLabel = (value: string) => {
    return TABLES.find((t) => t.value === value)?.label || value
  }

  const fetchTableData = useCallback(
    async (table: string, searchTerm = '', pageNum = 1) => {
      if (!table) return

      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          search: searchTerm,
        })

        const response = await fetch(
          `/api/admin/data-viewer/${table}?${params}`
        )
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.')
        }

        const result = await response.json()

        // API 응답 구조 처리
        if (result.success && result.data) {
          setData(result.data.data || [])
          setColumns(result.data.columns || [])
          setTotalPages(result.data.totalPages || 1)
          setPage(pageNum)
        } else {
          // 이전 형식 호환성
          setData(result.data || [])
          setColumns(result.columns || [])
          setTotalPages(result.totalPages || 1)
          setPage(pageNum)
        }
      } catch {
        toast({
          title: '오류',
          description: '데이터를 불러오는데 실패했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, search, page)
    }
  }, [selectedTable, page, search, fetchTableData])

  const handleSearch = () => {
    if (selectedTable) {
      fetchTableData(selectedTable, search, 1)
    }
  }

  const formatCellValue = (
    value: unknown,
    column: string,
    row?: Record<string, unknown>
  ) => {
    if (value === null)
      return (
        <span className="text-gray-400 italic text-xs font-light">
          비어있음
        </span>
      )
    if (value === undefined)
      return <span className="text-gray-400 text-xs">-</span>

    // 관계 객체 처리 (category, author, community 등)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>

      // 카테고리 객체인 경우
      if (column === 'category' && 'name' in obj) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{String(obj.name)}</span>
            <code className="text-xs text-gray-500">{String(obj.id)}</code>
          </div>
        )
      }

      // 작성자 객체인 경우
      if (column === 'author' && 'name' in obj) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {String(obj.name || obj.email)}
            </span>
            <span className="text-xs text-gray-500">{String(obj.email)}</span>
          </div>
        )
      }

      // 커뮤니티 객체인 경우
      if (column === 'community' && 'name' in obj) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{String(obj.name)}</span>
            <span className="text-xs text-gray-500">/{String(obj.slug)}</span>
          </div>
        )
      }

      // 게시글 객체인 경우 (댓글의 post, 좋아요/북마크의 post)
      if (column === 'post' && 'title' in obj) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{String(obj.title)}</span>
            <code className="text-xs text-gray-500">
              {String(obj.id).substring(0, 8)}...
            </code>
          </div>
        )
      }

      // 태그 객체인 경우 (MainPostTag의 tag)
      if (column === 'tag' && 'name' in obj && 'color' in obj) {
        return (
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: String(obj.color) }}
            />
            <span className="text-sm font-medium">{String(obj.name)}</span>
          </div>
        )
      }

      // 사용자 객체인 경우 (좋아요/북마크의 user)
      if (column === 'user' && 'email' in obj) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {(obj as { name?: string | null }).name || 'Unknown'}
            </span>
            <span className="text-xs text-gray-500">{String(obj.email)}</span>
          </div>
        )
      }

      // 부모 댓글 객체인 경우
      if (column === 'parent' && 'content' in obj) {
        const content = String(obj.content)
        const truncated =
          content.length > 30 ? content.substring(0, 30) + '...' : content
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-gray-600">{truncated}</span>
            <code className="text-xs text-gray-500">
              {String(obj.id).substring(0, 8)}...
            </code>
          </div>
        )
      }

      // 기타 객체는 JSON으로 표시
      return (
        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
          {JSON.stringify(obj)}
        </code>
      )
    }

    // communityId 컬럼 특별 처리 (CommunityCategory 테이블에서)
    if (
      column === 'communityId' &&
      row &&
      'community' in row &&
      row.community
    ) {
      const community = row.community as Record<string, unknown>
      if ('name' in community && 'slug' in community) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {String(community.name)}
            </span>
            <span className="text-xs text-gray-500">
              /{String(community.slug)}
            </span>
          </div>
        )
      }
    }

    // 색상 필드 처리
    if (
      column === 'color' &&
      typeof value === 'string' &&
      value.startsWith('#')
    ) {
      return (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border-2 border-gray-300"
            style={{ backgroundColor: value }}
          />
          <code className="text-xs font-mono">{value}</code>
        </div>
      )
    }

    // Boolean 값
    if (typeof value === 'boolean') {
      return value ? (
        <Badge
          variant="default"
          className="font-normal bg-green-100 text-green-800 border-green-300 text-xs whitespace-nowrap"
        >
          ✓ 예
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="font-normal bg-gray-100 text-gray-600 border-gray-300 text-xs whitespace-nowrap"
        >
          ✗ 아니오
        </Badge>
      )
    }

    // Date 값
    if (
      (column.toLowerCase().endsWith('at') ||
        column === 'expires' ||
        column === 'emailVerified') &&
      value &&
      column !== 'status'
    ) {
      // Date로 변환 가능한 값인지 확인
      if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value)
        // const now = new Date()
        // const diffTime = Math.abs(now.getTime() - date.getTime())
        // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        // 상대 시간 계산 (현재는 사용하지 않음)
        // let relativeTime = ''
        // if (diffDays === 0) {
        //   relativeTime = '오늘'
        // } else if (diffDays === 1) {
        //   relativeTime = date > now ? '내일' : '어제'
        // } else if (diffDays < 7) {
        //   relativeTime = date > now ? `${diffDays}일 후` : `${diffDays}일 전`
        // } else if (diffDays < 30) {
        //   const weeks = Math.floor(diffDays / 7)
        //   relativeTime = date > now ? `${weeks}주 후` : `${weeks}주 전`
        // } else if (diffDays < 365) {
        //   const months = Math.floor(diffDays / 30)
        //   relativeTime = date > now ? `${months}개월 후` : `${months}개월 전`
        // } else {
        //   const years = Math.floor(diffDays / 365)
        //   relativeTime = date > now ? `${years}년 후` : `${years}년 전`
        // }

        return (
          <div className="text-xs whitespace-nowrap">
            <div className="font-medium">
              {date.toLocaleDateString('ko-KR', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
              })}
            </div>
            <div className="text-gray-500">
              {date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        )
      }
      return String(value)
    }

    // 이메일
    if (column === 'email' && typeof value === 'string') {
      return (
        <span className="text-xs font-medium whitespace-nowrap" title={value}>
          {value}
        </span>
      )
    }

    // 이미지 URL
    if (
      (column === 'image' || column === 'avatar' || column === 'banner') &&
      value &&
      typeof value === 'string' &&
      !value.startsWith('default:') // Filter out default: prefixed values
    ) {
      return (
        <div className="flex items-center gap-2">
          <Image
            src={value}
            alt=""
            width={32}
            height={32}
            className="rounded-full object-cover border"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <span
            className="text-xs text-gray-500 truncate max-w-[100px]"
            title={value}
          >
            {value}
          </span>
        </div>
      )
    }

    // 파일 크기
    if (column === 'size' && typeof value === 'number') {
      const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }
      return (
        <span className="text-sm font-medium">{formatFileSize(value)}</span>
      )
    }

    // 이름, 사용자명 필드는 한 줄로 표시
    if (
      (column === 'name' || column === 'username') &&
      typeof value === 'string'
    ) {
      return (
        <span className="text-xs font-medium whitespace-nowrap" title={value}>
          {value}
        </span>
      )
    }

    // 자기소개(bio) 필드는 한 줄로 표시
    if (column === 'bio' && typeof value === 'string') {
      const truncated =
        value.length > 30 ? value.substring(0, 30) + '...' : value
      return (
        <div className="group relative">
          <span className="text-xs cursor-help whitespace-nowrap block max-w-[200px] overflow-hidden text-ellipsis">
            {truncated}
          </span>
          {value.length > 30 && (
            <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg max-w-xs break-words -top-2 left-0 transform -translate-y-full">
              {value}
            </div>
          )}
        </div>
      )
    }

    // 긴 텍스트는 줄임
    if (typeof value === 'string' && value.length > 50) {
      return (
        <div className="group relative">
          <span className="text-xs cursor-help whitespace-nowrap block max-w-[150px] overflow-hidden text-ellipsis">
            {value.substring(0, 30)}...
          </span>
          <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg max-w-xs break-words -top-2 left-0 transform -translate-y-full">
            {value}
          </div>
        </div>
      )
    }

    // Enum 값들은 Badge로 표시 (한글 변환)
    if (column === 'status') {
      const statusMap: Record<string, { label: string; color: string }> = {
        DRAFT: {
          label: '📝 초안',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
        },
        PENDING: {
          label: '⏳ 검토중',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        },
        PUBLISHED: {
          label: '✅ 게시됨',
          color: 'bg-green-100 text-green-800 border-green-300',
        },
      }
      const status = statusMap[String(value)] || {
        label: String(value),
        color: 'bg-gray-100 text-gray-600',
      }
      return (
        <Badge
          className={`font-normal text-xs whitespace-nowrap ${status.color}`}
        >
          {status.label}
        </Badge>
      )
    }

    if (column === 'globalRole' || column === 'role') {
      const roleMap: Record<
        string,
        { label: string; icon: string; color: string }
      > = {
        USER: {
          label: '일반 사용자',
          icon: '👤',
          color: 'bg-gray-100 text-gray-700',
        },
        MANAGER: {
          label: '매니저',
          icon: '💼',
          color: 'bg-blue-100 text-blue-800',
        },
        ADMIN: {
          label: '관리자',
          icon: '👨‍💼',
          color: 'bg-purple-100 text-purple-800',
        },
        OWNER: {
          label: '소유자',
          icon: '👑',
          color: 'bg-yellow-100 text-yellow-800',
        },
        MODERATOR: {
          label: '모더레이터',
          icon: '🛡️',
          color: 'bg-indigo-100 text-indigo-800',
        },
        MEMBER: {
          label: '멤버',
          icon: '👥',
          color: 'bg-green-100 text-green-800',
        },
      }
      const role = roleMap[String(value)] || {
        label: String(value),
        icon: '❓',
        color: 'bg-gray-100 text-gray-600',
      }
      return (
        <Badge
          className={`font-normal text-xs whitespace-nowrap ${role.color} border`}
        >
          <span className="mr-1">{role.icon}</span>
          {role.label}
        </Badge>
      )
    }

    // Visibility
    if (column === 'visibility') {
      const visMap: Record<
        string,
        { label: string; icon: string; color: string }
      > = {
        PUBLIC: {
          label: '공개',
          icon: '🌐',
          color: 'bg-green-100 text-green-800',
        },
        PRIVATE: {
          label: '비공개',
          icon: '🔒',
          color: 'bg-red-100 text-red-800',
        },
      }
      const vis = visMap[String(value)] || {
        label: String(value),
        icon: '❓',
        color: 'bg-gray-100',
      }
      return (
        <Badge
          className={`font-normal text-xs whitespace-nowrap ${vis.color} border`}
        >
          <span className="mr-1">{vis.icon}</span>
          {vis.label}
        </Badge>
      )
    }

    // 알림 타입
    if (column === 'type' && selectedTable === 'Notification') {
      const typeMap: Record<string, string> = {
        COMMENT: '💬 댓글',
        LIKE: '❤️ 좋아요',
        FOLLOW: '👥 팔로우',
        MENTION: '📢 멘션',
        ANNOUNCEMENT: '📣 공지사항',
      }
      return (
        <span className="text-sm font-medium">
          {typeMap[String(value)] || String(value)}
        </span>
      )
    }

    // Provider (로그인 제공자)
    if (column === 'provider') {
      const providerMap: Record<string, { label: string; icon: string }> = {
        google: { label: 'Google', icon: '🔵' },
        github: { label: 'GitHub', icon: '⚫' },
        kakao: { label: '카카오', icon: '🟡' },
        naver: { label: '네이버', icon: '🟢' },
      }
      const provider = providerMap[String(value)] || {
        label: String(value),
        icon: '🔗',
      }
      return (
        <span className="text-sm font-medium">
          <span className="mr-1">{provider.icon}</span>
          {provider.label}
        </span>
      )
    }

    // ID 값들은 모노스페이스 폰트로 (단축 표시)
    if (
      column.toLowerCase().includes('id') ||
      column === 'sessionToken' ||
      column.includes('token')
    ) {
      const idStr = String(value)
      if (idStr.length > 12) {
        return (
          <div className="group relative">
            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono cursor-help">
              {idStr.substring(0, 8)}...
            </code>
            <div className="hidden group-hover:block absolute z-10 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg -top-2 left-0 transform -translate-y-full font-mono">
              {idStr}
            </div>
          </div>
        )
      }
      return (
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
          {idStr}
        </code>
      )
    }

    // 숫자 값은 우측 정렬
    if (typeof value === 'number') {
      // 큰 숫자는 단위로 표시
      if (value >= 1000000) {
        return (
          <span className="text-sm font-semibold text-blue-600">
            {(value / 1000000).toFixed(1)}M
          </span>
        )
      } else if (value >= 1000) {
        return (
          <span className="text-sm font-semibold text-blue-600">
            {(value / 1000).toFixed(1)}K
          </span>
        )
      }
      return (
        <span className="text-sm font-semibold tabular-nums">
          {value.toLocaleString('ko-KR')}
        </span>
      )
    }

    // URL
    if (
      column === 'url' &&
      typeof value === 'string' &&
      (value.startsWith('http') || value.startsWith('/'))
    ) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline truncate block max-w-[200px]"
          title={value}
        >
          🔗 링크 보기
        </a>
      )
    }

    return <span className="text-sm">{String(value)}</span>
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Database className="h-6 w-6 text-blue-600" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-bold">
                데이터베이스 관리
              </span>
            </CardTitle>
            {selectedTable && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-gray-500">현재 보고 있는 테이블:</span>
                <Badge variant="secondary" className="text-sm font-semibold">
                  {getTableLabel(selectedTable)}
                </Badge>
                <span className="text-xs text-gray-400">({selectedTable})</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-full md:w-[350px] h-12 text-base border-2 hover:border-blue-400 transition-colors">
                <SelectValue placeholder="📋 테이블을 선택하세요">
                  {selectedTable && (
                    <span className="font-semibold text-gray-700">
                      📊 {getTableLabel(selectedTable)}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {TABLES.map((table) => (
                  <SelectItem
                    key={table.value}
                    value={table.value}
                    className="py-3"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-gray-700">
                        {table.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {table.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="검색어를 입력하세요..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 text-base border-2 hover:border-blue-400 transition-colors"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={!selectedTable}
                className="h-12 px-6 text-base font-semibold"
              >
                검색
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-gray-500 font-medium">
                데이터를 불러오는 중...
              </p>
            </div>
          ) : data.length > 0 ? (
            <>
              <div className="relative">
                {/* 가로 스크롤 인디케이터 */}
                <div className="absolute -top-8 right-0 text-xs text-gray-500 flex items-center gap-2">
                  {columns.length > 5 && (
                    <>
                      <span>
                        ← 좌우로 스크롤하여 더 많은 정보를 확인하세요 →
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        총 {columns.length}개 열
                      </Badge>
                    </>
                  )}
                </div>

                <div className="rounded-lg border-2 overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                      <TableHeader className="sticky top-0 z-10">
                        <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
                          {columns.map((column) => (
                            <TableHead
                              key={column}
                              className="font-bold text-gray-700 py-3 px-3 whitespace-nowrap min-w-[120px]"
                              style={{
                                minWidth:
                                  column === 'id'
                                    ? '180px'
                                    : column === 'bio'
                                      ? '200px'
                                      : column === 'content' ||
                                          column === 'contentHtml'
                                        ? '250px'
                                        : column === 'email'
                                          ? '180px'
                                          : column === 'createdAt' ||
                                              column === 'updatedAt' ||
                                              column === 'emailVerified'
                                            ? '140px'
                                            : column === 'isBanned' ||
                                                column === 'isActive' ||
                                                column === 'isPinned'
                                              ? '100px'
                                              : '120px',
                              }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm">
                                  {COLUMN_TRANSLATIONS[column] || column}
                                </span>
                                <span className="text-xs font-normal text-gray-500">
                                  {column}
                                </span>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row, index) => (
                          <TableRow
                            key={index}
                            className={`${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                            } hover:bg-blue-50/50 transition-colors border-b`}
                          >
                            {columns.map((column) => (
                              <TableCell
                                key={column}
                                className="py-3 px-3 align-middle"
                              >
                                {formatCellValue(row[column], column, row)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <style jsx global>{`
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #cbd5e1 #f1f5f9;
                }

                .custom-scrollbar::-webkit-scrollbar {
                  height: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 5px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 5px;
                  border: 2px solid #f1f5f9;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}</style>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium">
                  <span className="text-gray-800 font-bold">{data.length}</span>
                  개 항목 중{' '}
                  <span className="text-gray-800 font-bold">
                    페이지 {page} / {totalPages}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="font-medium"
                  >
                    ← 이전 페이지
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="font-medium"
                  >
                    다음 페이지 →
                  </Button>
                </div>
              </div>
            </>
          ) : selectedTable ? (
            <div className="text-center py-20">
              <div className="inline-flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <Database className="h-10 w-10 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 font-medium">데이터가 없습니다</p>
                  <p className="text-sm text-gray-400">
                    {search && '다른 검색어를 시도해보세요'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <Database className="h-10 w-10 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600 font-semibold text-lg">
                    테이블을 선택해주세요
                  </p>
                  <p className="text-sm text-gray-500">
                    위의 드롭다운에서 보고 싶은 데이터를 선택하세요
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
