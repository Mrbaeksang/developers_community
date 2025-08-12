'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Mail, AtSign, Edit, Share2 } from 'lucide-react'
import Link from 'next/link'
import ShareModal from '@/components/posts/ShareModal'

interface ProfileHeaderProps {
  profile: {
    id: string
    name: string | null
    username: string | null
    email: string | null
    image: string | null
    bio: string | null
    createdAt: string
    _count?: {
      mainPosts: number
      communityPosts: number
      mainComments: number
      mainBookmarks: number
      communityMemberships: number
    }
  }
  isOwnProfile: boolean
}

export function ProfileHeader({ profile, isOwnProfile }: ProfileHeaderProps) {
  const [showShareModal, setShowShareModal] = useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
    })
  }

  const handleShare = () => {
    setShowShareModal(true)
  }

  const getActivityBadge = () => {
    if (!profile._count) return null
    const totalActivity =
      profile._count.mainPosts +
      profile._count.communityPosts +
      profile._count.mainComments

    if (totalActivity >= 100) {
      return { label: '열정 유저', variant: 'default' as const }
    }
    if (totalActivity >= 50) {
      return { label: '활발한 유저', variant: 'secondary' as const }
    }
    if (totalActivity >= 10) {
      return { label: '성장 중', variant: 'outline' as const }
    }
    return null
  }

  const activityBadge = getActivityBadge()

  const headerClasses =
    'border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white rounded-lg p-6'
  const avatarClasses =
    'h-32 w-32 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
  const buttonClasses =
    'border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all font-bold'

  return (
    <>
      <div className={headerClasses}>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar className={avatarClasses}>
              <AvatarImage
                src={profile.image || undefined}
                alt={profile.name || 'User'}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-3xl font-black">
                {profile.name?.[0] || profile.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black text-black">
                      {profile.name || '이름 없음'}
                    </h1>
                    {activityBadge && (
                      <Badge
                        variant={activityBadge.variant}
                        className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold"
                      >
                        {activityBadge.label}
                      </Badge>
                    )}
                  </div>
                  {profile.username && (
                    <p className="text-muted-foreground flex items-center gap-1 font-medium">
                      <AtSign className="h-4 w-4" />
                      {profile.username}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isOwnProfile && (
                    <Button asChild variant="default" className={buttonClasses}>
                      <Link href="/settings/profile">
                        <Edit className="h-4 w-4 mr-2" />
                        프로필 편집
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className={buttonClasses}
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="text-gray-700 leading-relaxed text-base">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="font-medium">{profile.email}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {formatDate(profile.createdAt)} 가입
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ShareModal 추가 */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={`${profile.name || '사용자'}의 프로필`}
      />
    </>
  )
}
