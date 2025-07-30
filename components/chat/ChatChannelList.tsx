'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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

export default function ChatChannelList() {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openChannels, setOpenChannels] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/chat/channels')
      if (!res.ok) {
        throw new Error('채널 목록을 불러오는데 실패했습니다.')
      }
      const data = await res.json()
      setChannels(data.channels)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            채팅 목록을 불러오는 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
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
            <div className="text-center text-muted-foreground py-4">
              참여 가능한 채팅방이 없습니다.
            </div>
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
                        <AvatarImage src={channel.community?.avatar || ''} />
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
