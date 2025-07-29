import { notFound } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  Github,
  FileText,
  MessageSquare,
  Heart,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string
  image: string | null
  bio: string | null
  website: string | null
  github: string | null
  location: string | null
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
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users/${userId}`,
      { cache: 'no-store' }
    )

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch profile')
    }

    const data = await res.json()
    return data as UserProfile
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    notFound()
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  const profile = await getProfile(id)

  const isOwnProfile = session?.user?.id === profile.id

  return (
    <div className="container max-w-4xl py-8">
      {/* Profile Header */}
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <AvatarImage src={profile.image || undefined} />
              <AvatarFallback className="text-2xl font-black bg-primary/20">
                {profile.name?.[0] || profile.email[0].toUpperCase()}
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
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <LinkIcon className="h-4 w-4" />
                    웹사이트
                  </a>
                )}
                {profile.github && (
                  <a
                    href={`https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Github className="h-4 w-4" />
                    {profile.github}
                  </a>
                )}
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
        <TabsList className="grid grid-cols-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <TabsTrigger value="posts" className="font-bold">
            게시글
          </TabsTrigger>
          <TabsTrigger value="comments" className="font-bold">
            댓글
          </TabsTrigger>
          <TabsTrigger value="likes" className="font-bold">
            좋아요
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="py-8 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>아직 작성한 게시글이 없습니다.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="py-8 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>아직 작성한 댓글이 없습니다.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes">
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardContent className="py-8 text-center text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4" />
              <p>아직 좋아요한 게시글이 없습니다.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
