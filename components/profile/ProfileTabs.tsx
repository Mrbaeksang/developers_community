'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Bookmark,
  MessageSquare,
  Users,
  Grid3X3,
  Grid2X2,
  Square,
} from 'lucide-react'
import { PostCard } from '@/components/posts/PostCard'
import { CommentCard } from '@/components/shared/CommentCard'
import { CommunityCard } from '@/components/communities/CommunityCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MainPostFormatted } from '@/lib/post/types'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  summary?: string | null
  content?: string
  createdAt: Date | string
  viewCount: number
  type: 'MAIN' | 'COMMUNITY'
  thumbnail?: string | null
  communityId?: string
  communityName?: string
  categoryId?: string
  categoryName?: string
  categorySlug?: string
  categoryColor?: string | null
  categoryIcon?: string | null
  author?: {
    id: string
    name: string | null
    email?: string | null
    image: string | null
  }
  tags?: Array<{
    id: string
    name: string
    slug: string
    color?: string | null
  }>
  _count: {
    mainComments?: number
    mainLikes?: number
    communityComments?: number
    communityLikes?: number
  }
}

interface Comment {
  id: string
  content: string
  createdAt: Date | string
  isEdited: boolean
  author: {
    id: string
    name: string | null
    image: string | null
    badge?: string
  }
  post: {
    id: string
    title: string
    slug: string
    type: 'MAIN' | 'COMMUNITY'
    communityId?: string
    communityName?: string
    categoryId?: string
    categoryName?: string
    categorySlug?: string
    categoryColor?: string
    categoryIcon?: string | null
  }
  stats: {
    likeCount: number
    replyCount: number
    isLiked: boolean
  }
}

interface Community {
  id: string
  role: string
  joinedAt: string
  community: {
    id: string
    name: string
    slug: string
    description: string | null
    avatar: string | null
    banner?: string | null
    visibility: 'PUBLIC' | 'PRIVATE'
    createdAt?: string
    updatedAt?: string
    _count: {
      members: number
      posts: number
    }
    owner: {
      name: string | null
      image: string | null
    }
  }
}

interface ProfileTabsProps {
  userId: string
  defaultTab?: string
  stats: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    mainBookmarks: number
    communities: number
  }
  posts?: Post[]
  comments?: Comment[]
  bookmarks?: Post[]
  communities?: Community[]
  currentUserId?: string
}

type GridLayout = '1x1' | '2x2' | '3x3'

export function ProfileTabs({
  defaultTab = 'posts',
  stats,
  posts = [],
  comments = [],
  bookmarks = [],
  communities = [],
  currentUserId,
}: ProfileTabsProps) {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || defaultTab

  // 각 탭별 그리드 레이아웃 상태
  const [gridLayouts, setGridLayouts] = useState<Record<string, GridLayout>>({
    posts: '2x2',
    comments: '2x2',
    bookmarks: '2x2',
    communities: '3x3',
  })

  const setGridLayout = (tabName: string, layout: GridLayout) => {
    setGridLayouts((prev) => ({ ...prev, [tabName]: layout }))
  }

  const getGridClassName = (layout: GridLayout) => {
    switch (layout) {
      case '1x1':
        return 'grid grid-cols-1 gap-6'
      case '2x2':
        return 'grid grid-cols-1 md:grid-cols-2 gap-5'
      case '3x3':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      default:
        return 'grid grid-cols-1 md:grid-cols-2 gap-5'
    }
  }

  // 그리드 레이아웃에 따른 카드 스타일 결정
  const getCardVariant = (tabName: string): string => {
    const layout = gridLayouts[tabName]
    if (tabName === 'comments') {
      // 댓글은 1x1일 때만 full, 나머지는 compact
      return layout === '1x1' ? 'default' : 'compact'
    }
    // 다른 카드들은 그리드에 맞춰 조정
    return layout === '1x1' ? 'large' : 'default'
  }

  // 그리드 레이아웃에 따른 카드 클래스
  const getCardClass = (layout: GridLayout): string => {
    switch (layout) {
      case '1x1':
        return 'w-full'
      case '2x2':
        return 'w-full'
      case '3x3':
        return 'w-full'
      default:
        return 'w-full'
    }
  }

  const tabs = [
    {
      value: 'posts',
      label: '게시글',
      icon: FileText,
      count: stats.mainPosts + stats.communityPosts,
    },
    {
      value: 'comments',
      label: '댓글',
      icon: MessageSquare,
      count: stats.mainComments,
    },
    {
      value: 'bookmarks',
      label: '북마크',
      icon: Bookmark,
      count: stats.mainBookmarks,
    },
    {
      value: 'communities',
      label: '커뮤니티',
      icon: Users,
      count: stats.communities,
    },
  ]

  const tabListClasses =
    'w-full justify-start border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gray-100 p-1 h-auto flex-wrap gap-1'
  const tabTriggerClasses =
    'data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-transparent data-[state=active]:border-black transition-all gap-2 font-bold'
  const countBadgeClasses =
    'ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-secondary/50 border border-black'

  // 그리드 선택 버튼 컴포넌트
  const GridSelector = ({ tabName }: { tabName: string }) => (
    <div className="flex items-center gap-1 mb-4">
      <span className="text-sm font-medium mr-2">보기:</span>
      <Button
        size="sm"
        variant={gridLayouts[tabName] === '1x1' ? 'default' : 'outline'}
        className={cn(
          'h-8 w-8 p-0',
          gridLayouts[tabName] === '1x1' &&
            'bg-black text-white hover:bg-gray-800'
        )}
        onClick={() => setGridLayout(tabName, '1x1')}
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={gridLayouts[tabName] === '2x2' ? 'default' : 'outline'}
        className={cn(
          'h-8 w-8 p-0',
          gridLayouts[tabName] === '2x2' &&
            'bg-black text-white hover:bg-gray-800'
        )}
        onClick={() => setGridLayout(tabName, '2x2')}
      >
        <Grid2X2 className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={gridLayouts[tabName] === '3x3' ? 'default' : 'outline'}
        className={cn(
          'h-8 w-8 p-0',
          gridLayouts[tabName] === '3x3' &&
            'bg-black text-white hover:bg-gray-800'
        )}
        onClick={() => setGridLayout(tabName, '3x3')}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <Tabs defaultValue={tab} className="w-full">
      <TabsList className={tabListClasses}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={tabTriggerClasses}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              <span className={countBadgeClasses}>{tab.count}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <TabsContent value="posts" className="mt-6">
        {posts.length > 0 && <GridSelector tabName="posts" />}
        {posts.length === 0 ? (
          <EmptyState
            title="게시글이 없습니다"
            description="아직 작성한 게시글이 없습니다."
          />
        ) : (
          <div className={getGridClassName(gridLayouts.posts)}>
            {posts.map((post) => {
              // 데이터 검증
              if (!post || !post.id) {
                console.error('[ProfileTabs] Invalid post object:', post)
                return null
              }

              // 필수 필드 체크 및 기본값 설정
              const formattedPost: MainPostFormatted = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.summary || post.excerpt || '',
                content: post.content || '',
                viewCount: post.viewCount,
                createdAt: post.createdAt,
                isPinned: false,
                readingTime: Math.ceil((post.content?.length || 0) / 300),
                status: 'PUBLISHED',
                category: {
                  id: post.categoryId || 'general',
                  name: post.categoryName || '일반',
                  slug: post.categorySlug || 'general',
                  color: post.categoryColor || '#6366f1',
                  icon: post.categoryIcon || null,
                },
                tags: post.tags || [],
                author: post.author || {
                  id: 'unknown',
                  name: 'Unknown',
                  image: null,
                  username: null,
                },
                likeCount:
                  post._count?.mainLikes || post._count?.communityLikes || 0,
                commentCount:
                  post._count?.mainComments ||
                  post._count?.communityComments ||
                  0,
                bookmarkCount: 0,
              }
              return (
                <div key={post.id} className={getCardClass(gridLayouts.posts)}>
                  <PostCard
                    post={formattedPost}
                    className={
                      gridLayouts.posts === '1x1' ? 'min-h-[250px]' : ''
                    }
                    currentUserId={currentUserId}
                  />
                </div>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="comments" className="mt-6">
        {comments.length > 0 && <GridSelector tabName="comments" />}
        {comments.length === 0 ? (
          <EmptyState
            title="댓글이 없습니다"
            description="아직 작성한 댓글이 없습니다."
          />
        ) : (
          <div className={getGridClassName(gridLayouts.comments)}>
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                currentUserId={currentUserId}
                comment={{
                  id: comment.id,
                  content: comment.content,
                  createdAt: comment.createdAt,
                  isEdited: comment.isEdited,
                  author: comment.author,
                  post: comment.post
                    ? {
                        id: comment.post.id,
                        title: comment.post.title,
                        slug: comment.post.slug,
                        type: comment.post.type as 'MAIN' | 'COMMUNITY',
                        communityId: comment.post.communityId,
                        communityName: comment.post.communityName,
                        categoryId: comment.post.categoryId,
                        categoryName: comment.post.categoryName,
                        categorySlug: comment.post.categorySlug,
                        categoryColor: comment.post.categoryColor,
                        categoryIcon: comment.post.categoryIcon,
                      }
                    : undefined,
                  stats: comment.stats,
                }}
                showPost={true}
                showAuthor={true}
                variant={
                  getCardVariant('comments') as
                    | 'default'
                    | 'compact'
                    | 'minimal'
                }
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="bookmarks" className="mt-6">
        {bookmarks.length > 0 && <GridSelector tabName="bookmarks" />}
        {bookmarks.length === 0 ? (
          <EmptyState
            title="북마크가 없습니다"
            description="북마크한 게시글이 없습니다."
          />
        ) : (
          <div className={getGridClassName(gridLayouts.bookmarks)}>
            {bookmarks.map((post) => {
              // 데이터 검증
              if (!post || !post.id) {
                console.error(
                  '[ProfileTabs] Invalid bookmark post object:',
                  post
                )
                return null
              }

              // 필수 필드 체크 및 기본값 설정
              const formattedPost: MainPostFormatted = {
                id: post.id,
                title: post.title,
                slug: post.slug,
                excerpt: post.summary || post.excerpt || '',
                content: post.content || '',
                viewCount: post.viewCount,
                createdAt: post.createdAt,
                isPinned: false,
                readingTime: Math.ceil((post.content?.length || 0) / 300),
                status: 'PUBLISHED',
                category: {
                  id: post.categoryId || 'general',
                  name: post.categoryName || '일반',
                  slug: post.categorySlug || 'general',
                  color: post.categoryColor || '#6366f1',
                  icon: post.categoryIcon || null,
                },
                tags: post.tags || [],
                author: post.author || {
                  id: 'unknown',
                  name: 'Unknown',
                  image: null,
                  username: null,
                },
                likeCount:
                  post._count?.mainLikes || post._count?.communityLikes || 0,
                commentCount:
                  post._count?.mainComments ||
                  post._count?.communityComments ||
                  0,
                bookmarkCount: 0,
              }
              return (
                <div key={post.id} className={getCardClass(gridLayouts.posts)}>
                  <PostCard
                    post={formattedPost}
                    className={
                      gridLayouts.posts === '1x1' ? 'min-h-[250px]' : ''
                    }
                    currentUserId={currentUserId}
                  />
                </div>
              )
            })}
          </div>
        )}
      </TabsContent>

      <TabsContent value="communities" className="mt-6">
        {communities.length > 0 && <GridSelector tabName="communities" />}
        {communities.length === 0 ? (
          <EmptyState
            title="커뮤니티가 없습니다"
            description="아직 가입한 커뮤니티가 없습니다."
          />
        ) : (
          <div className={getGridClassName(gridLayouts.communities)}>
            {communities.map((item, index) => {
              // 색상 테마 설정
              const colorThemes = [
                {
                  bg: 'bg-blue-500',
                  card: 'bg-blue-50',
                  text: 'text-blue-600',
                },
                {
                  bg: 'bg-yellow-500',
                  card: 'bg-yellow-50',
                  text: 'text-yellow-600',
                },
                {
                  bg: 'bg-green-500',
                  card: 'bg-green-50',
                  text: 'text-green-600',
                },
                {
                  bg: 'bg-orange-500',
                  card: 'bg-orange-50',
                  text: 'text-orange-600',
                },
              ]

              return (
                <CommunityCard
                  key={item.id}
                  community={{
                    id: item.community.id,
                    name: item.community.name,
                    slug: item.community.slug,
                    description: item.community.description,
                    avatar: item.community.avatar,
                    banner: item.community.banner,
                    memberCount: item.community._count.members,
                    postCount: item.community._count.posts,
                    visibility: item.community.visibility,
                    createdAt: item.community.createdAt,
                    updatedAt: item.community.updatedAt,
                    owner: item.community.owner
                      ? {
                          name: item.community.owner.name,
                          image: item.community.owner.image,
                        }
                      : undefined,
                  }}
                  currentUserRole={
                    item.role as 'MEMBER' | 'MODERATOR' | 'ADMIN' | 'OWNER'
                  }
                  showJoinButton={false}
                  showStats={true}
                  variant={
                    gridLayouts.communities === '1x1' ? 'featured' : 'full'
                  }
                  index={index}
                  colorTheme={colorThemes[index % colorThemes.length]}
                />
              )
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
