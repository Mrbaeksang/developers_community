import { notFound } from 'next/navigation'
import { Calendar, FileText, MessageSquare, Heart, Bookmark } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  createdAt: string
  _count: {
    mainPosts: number
    communityPosts: number
    mainComments: number
    mainLikes: number
    mainBookmarks: number
  }
}

async function getProfile(userId: string) {
  try {
    // 직접 DB에서 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            mainPosts: {
              where: {
                status: 'PUBLISHED',
              },
            },
            communityPosts: {
              where: {
                status: 'PUBLISHED',
              },
            },
            mainComments: true,
            mainLikes: true,
            mainBookmarks: true,
          },
        },
      },
    })

    if (!user) {
      notFound()
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
      _count: user._count,
    } as UserProfile
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    notFound()
  }
}

// 사용자의 게시글 목록 가져오기
async function getUserPosts(userId: string) {
  const [mainPosts, communityPosts] = await Promise.all([
    prisma.mainPost.findMany({
      where: {
        authorId: userId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
    prisma.communityPost.findMany({
      where: {
        authorId: userId,
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        commentCount: true,
        community: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    }),
  ])

  return { mainPosts, communityPosts }
}

// 사용자의 댓글 목록 가져오기
async function getUserComments(userId: string) {
  const comments = await prisma.mainComment.findMany({
    where: {
      authorId: userId,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  })

  return comments
}

// 사용자가 좋아요한 게시글 목록 가져오기
async function getUserLikedPosts(userId: string) {
  const likes = await prisma.mainLike.findMany({
    where: {
      userId: userId,
    },
    select: {
      post: {
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  return likes.map(like => ({ ...like.post, likedAt: like.createdAt }))
}

// 사용자의 북마크 목록 가져오기 (본인만 볼 수 있음)
async function getUserBookmarks(userId: string) {
  const bookmarks = await prisma.mainBookmark.findMany({
    where: {
      userId: userId,
    },
    select: {
      post: {
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          viewCount: true,
          likeCount: true,
          commentCount: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  return bookmarks.map(bookmark => ({ ...bookmark.post, bookmarkedAt: bookmark.createdAt }))
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  const isOwnProfile = session?.user?.id === id
  const profile = await getProfile(id)
  
  // 프로필 데이터 가져오기
  const [posts, comments, likedPosts, bookmarks] = await Promise.all([
    getUserPosts(id),
    getUserComments(id),
    getUserLikedPosts(id),
    isOwnProfile ? getUserBookmarks(id) : Promise.resolve([]), // 북마크는 본인만
  ])

  return (
    <div className="container max-w-4xl py-8">
      {/* Profile Header */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AvatarImage src={profile.image || undefined} />
              <AvatarFallback className="text-2xl font-black bg-primary/20">
                {profile.name?.[0] || profile.email?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-black">
                    {profile.name || '이름 없음'}
                  </h1>
                  {profile.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                </div>
                {isOwnProfile && (
                  <Button
                    asChild
                    variant="outline"
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Link href="/settings/profile">프로필 편집</Link>
                  </Button>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.createdAt).toLocaleDateString('ko-KR')} 가입
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-black">
              {profile._count.mainPosts}
            </div>
            <p className="text-sm text-muted-foreground">게시글</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-black">
              {profile._count.communityPosts}
            </div>
            <p className="text-sm text-muted-foreground">커뮤니티 글</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-black">
              {profile._count.mainComments}
            </div>
            <p className="text-sm text-muted-foreground">댓글</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-black">
              {profile._count.mainLikes}
            </div>
            <p className="text-sm text-muted-foreground">좋아요</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-black">
              {profile._count.mainBookmarks}
            </div>
            <p className="text-sm text-muted-foreground">북마크</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className={`grid ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'} border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
          <TabsTrigger value="posts" className="font-bold">
            게시글
          </TabsTrigger>
          <TabsTrigger value="comments" className="font-bold">
            댓글
          </TabsTrigger>
          <TabsTrigger value="likes" className="font-bold">
            좋아요
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger value="bookmarks" className="font-bold">
              북마크
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="posts">
          {posts.mainPosts.length === 0 && posts.communityPosts.length === 0 ? (
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>아직 작성한 게시글이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.mainPosts.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2">메인 게시글</h3>
                  <div className="space-y-2">
                    {posts.mainPosts.map((post) => (
                      <Card key={post.id} className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/main/posts/${post.id}`} className="hover:underline">
                                <h4 className="font-bold">{post.title}</h4>
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{post.category?.name}</span>
                                <span>조회 {post.viewCount}</span>
                                <span>좋아요 {post.likeCount}</span>
                                <span>댓글 {post.commentCount}</span>
                                <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {posts.communityPosts.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2">커뮤니티 게시글</h3>
                  <div className="space-y-2">
                    {posts.communityPosts.map((post) => (
                      <Card key={post.id} className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/communities/${post.community?.slug}/posts/${post.id}`} className="hover:underline">
                                <h4 className="font-bold">{post.title}</h4>
                              </Link>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{post.community?.name}</span>
                                <span>조회 {post.viewCount}</span>
                                <span>좋아요 {post.likeCount}</span>
                                <span>댓글 {post.commentCount}</span>
                                <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments">
          {comments.length === 0 ? (
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="py-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                <p>아직 작성한 댓글이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <Card key={comment.id} className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-4">
                    <p className="text-sm">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>게시글:</span>
                      <Link href={`/main/posts/${comment.post.slug}`} className="hover:underline font-medium">
                        {comment.post.title}
                      </Link>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes">
          {likedPosts.length === 0 ? (
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4" />
                <p>아직 좋아요한 게시글이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {likedPosts.map((post) => (
                <Card key={post.id} className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/main/posts/${post.id}`} className="hover:underline">
                          <h4 className="font-bold">{post.title}</h4>
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{post.category?.name}</span>
                          <span>조회 {post.viewCount}</span>
                          <span>좋아요 {post.likeCount}</span>
                          <span>댓글 {post.commentCount}</span>
                          <span>좋아요한 날짜: {new Date(post.likedAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {isOwnProfile && (
          <TabsContent value="bookmarks">
            {bookmarks.length === 0 ? (
              <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-4" />
                  <p>아직 북마크한 게시글이 없습니다.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((post) => (
                  <Card key={post.id} className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/main/posts/${post.id}`} className="hover:underline">
                            <h4 className="font-bold">{post.title}</h4>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">{post.excerpt}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{post.category?.name}</span>
                            <span>조회 {post.viewCount}</span>
                            <span>좋아요 {post.likeCount}</span>
                            <span>댓글 {post.commentCount}</span>
                            <span>북마크한 날짜: {new Date(post.bookmarkedAt).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
