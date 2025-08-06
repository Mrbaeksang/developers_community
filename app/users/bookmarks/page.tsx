import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bookmark, Calendar, Eye, MessageSquare, Heart } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatCount } from '@/lib/post-format-utils'

interface BookmarkedPost {
  bookmarkId: string
  bookmarkedAt: string
  post: {
    id: string
    title: string
    excerpt: string
    slug: string
    viewCount: number
    likeCount: number
    commentCount: number
    createdAt: string
    category: {
      id: string
      name: string
      slug: string
      color: string
    }
    author: {
      id: string
      name: string
      image?: string
    }
    stats: {
      commentCount: number
      likeCount: number
      bookmarkCount: number
    }
  }
}

async function getBookmarks() {
  const session = await auth()
  if (!session?.user?.id) return []

  try {
    const baseUrl =
      process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/users/bookmarks`, {
      cache: 'no-store',
    })

    if (!res.ok) return []
    const data = await res.json()

    // 새로운 응답 형식 처리: { success: true, data: { bookmarks } }
    const bookmarks =
      data.success && data.data ? data.data.bookmarks : data.bookmarks || []

    return bookmarks
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
    return []
  }
}

export default async function BookmarksPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const bookmarks = await getBookmarks()

  return (
    <div className="container py-8 max-w-4xl">
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-black flex items-center">
            <Bookmark className="mr-3 h-7 w-7" />내 북마크
          </CardTitle>
          <p className="text-muted-foreground">
            저장한 게시글 {bookmarks.length}개
          </p>
        </CardHeader>
      </Card>

      {bookmarks.length === 0 ? (
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="py-12 text-center">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">
              아직 북마크한 게시글이 없습니다
            </p>
            <p className="text-muted-foreground mb-6">
              관심 있는 게시글을 북마크하고 나중에 다시 읽어보세요
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/main/posts">
                <Button className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                  메인 게시글 둘러보기
                </Button>
              </Link>
              <Link href="/communities">
                <Button
                  variant="outline"
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  커뮤니티 둘러보기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((bookmark: BookmarkedPost) => {
            const post = bookmark.post
            const postUrl = `/main/posts/${post.id}`

            return (
              <Link key={bookmark.bookmarkId} href={postUrl}>
                <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: post.category.color }}
                          className="text-white border-2 border-black"
                        >
                          {post.category.name}
                        </Badge>
                      </div>
                      <time className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(bookmark.bookmarkedAt), 'M월 d일', {
                          locale: ko,
                        })}{' '}
                        저장
                      </time>
                    </div>

                    <h3 className="text-lg font-bold mb-2 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Eye className="mr-1 h-4 w-4" />
                          {formatCount(post.viewCount)}
                        </span>
                        <span className="flex items-center">
                          <Heart className="mr-1 h-4 w-4" />
                          {post.stats.likeCount}
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          {post.stats.commentCount}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{post.author.name}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
