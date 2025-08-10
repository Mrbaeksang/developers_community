'use client'

import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Megaphone, Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/core/utils'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { EmptyState } from '@/components/shared/EmptyState'

interface Author {
  id: string
  name: string | null
  username: string | null
  image: string | null
}

interface Announcement {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  author: Author
}

interface CommunityAnnouncementsProps {
  announcements: Announcement[]
}

export default function CommunityAnnouncements({
  announcements,
}: CommunityAnnouncementsProps) {
  if (announcements.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="아직 공지사항이 없습니다"
        description="커뮤니티의 중요한 소식이 여기에 표시됩니다"
        size="lg"
      />
    )
  }

  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={cn(
            'bg-white border-2 border-black rounded-lg p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
            announcement.isPinned && 'border-yellow-500'
          )}
        >
          <div className="space-y-4">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {announcement.isPinned && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-500 text-white border-2 border-black"
                    >
                      <Pin className="h-3 w-3 mr-1" />
                      고정됨
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-2 border-black">
                    <Megaphone className="h-3 w-3 mr-1" />
                    공지사항
                  </Badge>
                </div>
                <h3 className="text-lg font-bold">{announcement.title}</h3>
              </div>
            </div>

            {/* 내용 */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{announcement.content}</p>
            </div>

            {/* 작성자 정보 */}
            <div className="pt-4 border-t-2 border-dashed border-gray-300">
              <AuthorAvatar
                author={announcement.author}
                size="md"
                showName
                showDate
                date={
                  announcement.createdAt &&
                  !isNaN(Date.parse(announcement.createdAt))
                    ? formatDistanceToNow(new Date(announcement.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })
                    : '방금 전'
                }
                enableDropdown
                dropdownAlign="start"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
