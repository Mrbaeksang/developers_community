import { notFound } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  Users,
  MessageSquare,
  Heart,
  Calendar,
  Mail,
  BookOpen,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostCard } from '@/components/posts'
import type { Post } from '@/lib/types'

interface UserProfile {
  id: string
  name: string | null
  email: string
  image: string | null
  bio: string | null
  createdAt: string
  role: 'USER' | 'MANAGER' | 'ADMIN'
  _count: {
    mainPosts: number
    mainComments: number
    mainLikes: number
  }
}

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${userId}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data.user
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return null
  }
}

async function getUserPosts(userId: string): Promise<Post[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${userId}/posts`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      return []
    }

    const data = await res.json()
    return data.posts
  } catch (error) {
    console.error('Failed to fetch user posts:', error)
    return []
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const resolvedParams = await params
  const userId = resolvedParams.id

  const [user, posts] = await Promise.all([
    getUserProfile(userId),
    getUserPosts(userId),
  ])

  if (!user) {
    notFound()
  }

  const memberSince = formatDistanceToNow(new Date(user.createdAt), {
    addSuffix: true,
    locale: ko,
  })

  const roleMap = {
    USER: { label: '사용자', color: 'bg-secondary' },
    MANAGER: { label: '매니저', color: 'bg-blue-500/10 text-blue-600' },
    ADMIN: { label: '관리자', color: 'bg-red-500/10 text-red-600' },
  }

  const userRole = roleMap[user.role]

  return (
    <div className="container max-w-6xl py-8">
      {/* Profile Header */}
      <Card className="mb-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <Avatar className="h-32 w-32 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-4xl font-bold bg-primary/20">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black">
                    {user.name || '익명 사용자'}
                  </h1>
                  <Badge
                    className={`px-3 py-1 font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${userRole.color}`}
                  >
                    {userRole.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    가입 {memberSince}
                  </div>
                </div>
              </div>

              {user.bio && <p className="text-muted-foreground">{user.bio}</p>}

              <div className="flex flex-wrap gap-4">
                <StatCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label="작성한 글"
                  value={user._count.mainPosts}
                />
                <StatCard
                  icon={<MessageSquare className="h-5 w-5" />}
                  label="작성한 댓글"
                  value={user._count.mainComments}
                />
                <StatCard
                  icon={<Heart className="h-5 w-5" />}
                  label="받은 좋아요"
                  value={user._count.mainLikes}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger value="posts" className="font-bold">
            게시글 ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="about" className="font-bold">
            소개
          </TabsTrigger>
          <TabsTrigger value="activity" className="font-bold">
            활동
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {posts.length > 0 ? (
            <div className="grid gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              ))}
            </div>
          ) : (
            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <CardContent className="py-12 text-center text-muted-foreground">
                아직 작성한 게시글이 없습니다.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="about">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="font-black">소개</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  프로필 정보
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">이름</span>
                    <span className="font-bold">{user.name || '미설정'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">이메일</span>
                    <span className="font-bold">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">가입일</span>
                    <span className="font-bold">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader>
              <CardTitle className="font-black">활동 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-black">
                      {user._count.mainPosts}
                    </div>
                    <p className="text-sm text-muted-foreground">게시글</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-6 text-center">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-black">
                      {user._count.mainComments}
                    </div>
                    <p className="text-sm text-muted-foreground">댓글</p>
                  </CardContent>
                </Card>
                <Card className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-6 text-center">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-black">
                      {user._count.mainLikes}
                    </div>
                    <p className="text-sm text-muted-foreground">받은 좋아요</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xl font-black">{value}</div>
        <div className="text-xs text-muted-foreground font-bold">{label}</div>
      </div>
    </div>
  )
}
