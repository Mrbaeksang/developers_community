/**
 * Post Display Utilities
 * 게시글 표시 관련 유틸리티 함수들
 */

import {
  FolderOpen,
  Layout,
  Calendar,
  Users,
  TrendingUp,
  Code,
  FileText,
  Tag,
  MessageSquare,
  BookOpen,
  Cpu,
  Database,
  Globe,
  Package,
  Settings,
  Terminal,
  Layers,
  Code2,
  HelpCircle,
  Sparkles,
  Blocks,
  Server,
  Smartphone,
  Gamepad2,
  Cloud,
  Shield,
  BrainCircuit,
  Briefcase,
  Coffee,
  Lightbulb,
  Megaphone,
  Microscope,
  Activity,
  Zap,
  Camera,
  Rocket,
  Paintbrush,
  Music,
  Video,
  Car,
  Plane,
  Factory,
  LucideIcon,
} from 'lucide-react'

/**
 * 카테고리 아이콘 매핑
 * DB에 저장된 아이콘 이름을 Lucide 컴포넌트로 변환
 * PostCard.tsx와 동일한 방식으로 명시적 매핑 사용
 */
export function getCategoryIcon(iconName?: string | null): LucideIcon {
  if (!iconName) return FolderOpen

  // 아이콘 이름으로 직접 매핑 (관리자 페이지와 동일한 방식)
  const iconMap: Record<string, LucideIcon> = {
    Layout: Layout,
    Calendar: Calendar,
    Users: Users,
    TrendingUp: TrendingUp,
    Code: Code,
    Code2: Code2,
    FileText: FileText,
    FolderOpen: FolderOpen,
    Tag: Tag,
    MessageSquare: MessageSquare,
    HelpCircle: HelpCircle,
    BookOpen: BookOpen,
    Cpu: Cpu,
    Database: Database,
    Globe: Globe,
    Package: Package,
    Settings: Settings,
    Terminal: Terminal,
    Layers: Layers,
    Sparkles: Sparkles,
    Blocks: Blocks,
    Server: Server,
    Smartphone: Smartphone,
    Gamepad2: Gamepad2,
    Cloud: Cloud,
    Shield: Shield,
    BrainCircuit: BrainCircuit,
    Briefcase: Briefcase,
    Coffee: Coffee,
    Lightbulb: Lightbulb,
    Megaphone: Megaphone,
    Microscope: Microscope,
    Activity: Activity,
    Zap: Zap,
    Camera: Camera,
    Rocket: Rocket,
    Paintbrush: Paintbrush,
    Music: Music,
    Video: Video,
    Car: Car,
    Plane: Plane,
    Factory: Factory,
  }

  return iconMap[iconName] || FolderOpen
}

/**
 * 카테고리별 색상 클래스
 */
export function getCategoryColorClass(
  categorySlug?: string | null,
  variant: 'bg' | 'text' | 'border' = 'bg'
): string {
  if (!categorySlug) {
    return variant === 'bg'
      ? 'bg-gray-100'
      : variant === 'text'
        ? 'text-gray-600'
        : 'border-gray-200'
  }

  // 카테고리별 색상 매핑
  const colorMap: Record<string, { bg: string; text: string; border: string }> =
    {
      react: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
      },
      nextjs: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-300',
      },
      typescript: {
        bg: 'bg-indigo-50',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
      },
      javascript: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      },
      nodejs: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
      },
      css: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
      },
      default: {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
      },
    }

  const colors = colorMap[categorySlug] || colorMap.default
  return colors[variant]
}

/**
 * 태그 색상 클래스
 */
export function getTagColorClass(tagName: string): string {
  // 태그 이름의 해시값으로 색상 결정
  const colors = [
    'bg-red-100 text-red-700',
    'bg-yellow-100 text-yellow-700',
    'bg-green-100 text-green-700',
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
  ]

  let hash = 0
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

/**
 * 게시글 상태 배지 스타일
 */
export function getPostStatusStyle(status: string): {
  className: string
  label: string
} {
  const statusMap: Record<string, { className: string; label: string }> = {
    DRAFT: {
      className: 'bg-gray-100 text-gray-600',
      label: '임시저장',
    },
    PENDING: {
      className: 'bg-yellow-100 text-yellow-700',
      label: '검토 중',
    },
    PUBLISHED: {
      className: 'bg-green-100 text-green-700',
      label: '게시됨',
    },
    REJECTED: {
      className: 'bg-red-100 text-red-700',
      label: '거절됨',
    },
    ARCHIVED: {
      className: 'bg-gray-100 text-gray-500',
      label: '보관됨',
    },
    DELETED: {
      className: 'bg-red-50 text-red-500',
      label: '삭제됨',
    },
  }

  return (
    statusMap[status] || {
      className: 'bg-gray-100 text-gray-600',
      label: status,
    }
  )
}

/**
 * 게시글 고정 스타일
 */
export function getPinnedStyle(isPinned: boolean): string {
  if (!isPinned) return ''
  return 'border-l-4 border-yellow-400 bg-yellow-50/50'
}

/**
 * 조회수 포맷팅
 */
export function formatViewCount(count: number): string {
  if (count < 1000) return count.toString()
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`
  if (count < 1000000) return `${Math.floor(count / 1000)}K`
  return `${(count / 1000000).toFixed(1)}M`
}

/**
 * 게시글 통계 포맷팅
 */
export function formatPostStats(stats: {
  viewCount?: number
  likeCount?: number
  commentCount?: number
  bookmarkCount?: number
}): string[] {
  const formatted: string[] = []

  if (stats.viewCount !== undefined) {
    formatted.push(`조회 ${formatViewCount(stats.viewCount)}`)
  }
  if (stats.likeCount !== undefined && stats.likeCount > 0) {
    formatted.push(`좋아요 ${stats.likeCount}`)
  }
  if (stats.commentCount !== undefined && stats.commentCount > 0) {
    formatted.push(`댓글 ${stats.commentCount}`)
  }
  if (stats.bookmarkCount !== undefined && stats.bookmarkCount > 0) {
    formatted.push(`북마크 ${stats.bookmarkCount}`)
  }

  return formatted
}

/**
 * 커뮤니티 게시글 배지 색상
 */
export function getCommunityBadgeColor(communitySlug: string): string {
  const colorMap: Record<string, string> = {
    'tech-talk': 'bg-blue-100 text-blue-700',
    career: 'bg-green-100 text-green-700',
    qna: 'bg-purple-100 text-purple-700',
    showcase: 'bg-pink-100 text-pink-700',
    study: 'bg-indigo-100 text-indigo-700',
  }

  return colorMap[communitySlug] || 'bg-gray-100 text-gray-700'
}

/**
 * 작성자 역할 배지
 */
export function getAuthorRoleBadge(role?: string): {
  show: boolean
  className: string
  label: string
} | null {
  if (!role) return null

  const roleMap: Record<string, { className: string; label: string }> = {
    ADMIN: {
      className: 'bg-red-100 text-red-700',
      label: '관리자',
    },
    MANAGER: {
      className: 'bg-blue-100 text-blue-700',
      label: '매니저',
    },
    MODERATOR: {
      className: 'bg-purple-100 text-purple-700',
      label: '모더레이터',
    },
  }

  const roleStyle = roleMap[role]
  if (!roleStyle) return null

  return {
    show: true,
    ...roleStyle,
  }
}
