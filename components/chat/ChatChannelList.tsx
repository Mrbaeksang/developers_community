'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SkeletonLoader } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import dynamic from 'next/dynamic'

const FloatingChatButton = dynamic(
  () => import('@/components/chat/FloatingChatButton'),
  { ssr: false }
)

interface ChatChannel {
  id: string
  name: string
  description: string | null
  type: 'COMMUNITY' | 'GLOBAL'
  communityId: string | null
  community: {
    id: string
    name: string
    slug: string
    avatar: string | null
  } | null
  lastMessage: {
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      name: string | null
      username: string | null
    }
  } | null
  unreadCount: number
}

// 채팅 채널 가져오기 함수
const fetchChannels = async (): Promise<ChatChannel[]> => {
  const res = await fetch('/api/chat/channels', {
    credentials: 'include', // 쿠키를 포함하여 요청
  })
  if (!res.ok) {
    throw new Error('채널 목록을 불러오는데 실패했습니다.')
  }
  const data = await res.json()

  // 새로운 응답 형식 처리: { success: true, data: { channels } }
  return data.success && data.data ? data.data.channels : data.channels || data
}

export default function ChatChannelList() {
  const [openChannels, setOpenChannels] = useState<Set<string>>(new Set())

  // React Query로 채널 목록 관리
  const {
    data: channels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['chatChannels'],
    queryFn: fetchChannels,
    staleTime: 30 * 1000, // 30초간 fresh
    gcTime: 2 * 60 * 1000, // 2분간 캐시
    refetchInterval: 60 * 1000, // 1분마다 자동 새로고침 (실시간 채팅용)
  })

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-black flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            실시간 채팅
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 rounded-lg border-2 border-black">
              <SkeletonLoader lines={3} />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-black flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            실시간 채팅
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            {error instanceof Error
              ? error.message
              : '채널 목록을 불러오는데 실패했습니다.'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-black flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            실시간 채팅
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {channels.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="참여 가능한 채팅방이 없습니다"
              description="커뮤니티에 가입하거나 전체 채팅에 참여해보세요"
              size="sm"
            />
          ) : (
            channels.map((channel) => (
              <div
                key={channel.id}
                className="p-3 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200 cursor-pointer"
                onClick={() => {
                  const newOpenChannels = new Set(openChannels)
                  newOpenChannels.add(channel.id)
                  setOpenChannels(newOpenChannels)
                }}
              >
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div className="mt-1">
                    {channel.type === 'GLOBAL' ? (
                      <Globe className="h-5 w-5 text-primary" />
                    ) : (
                      <Avatar className="h-8 w-8 border-2 border-black">
                        <AvatarImage
                          src={
                            channel.community?.avatar?.startsWith('default:')
                              ? ''
                              : channel.community?.avatar || ''
                          }
                        />
                        <AvatarFallback className="text-xs font-bold">
                          {channel.community?.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm truncate">
                        {channel.type === 'GLOBAL'
                          ? '전체 채팅'
                          : channel.community?.name}
                      </h4>
                      {channel.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="ml-2 h-5 px-1.5 text-xs border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {channel.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {channel.lastMessage ? (
                      <div>
                        <p className="text-xs text-muted-foreground truncate">
                          <span className="font-medium">
                            {channel.lastMessage.author.name ||
                              channel.lastMessage.author.username}
                            :
                          </span>{' '}
                          {channel.lastMessage.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(
                            new Date(channel.lastMessage.createdAt),
                            { addSuffix: true, locale: ko }
                          )}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        아직 메시지가 없습니다
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 열린 채팅창들 */}
      {Array.from(openChannels).map((channelId) => {
        const channel = channels.find((ch) => ch.id === channelId)
        if (!channel) return null

        return (
          <FloatingChatButton
            key={channelId}
            channelId={channelId}
            channelName={
              channel.type === 'GLOBAL'
                ? '전체 채팅'
                : channel.community?.name || channel.name
            }
          />
        )
      })}
    </>
  )
}
