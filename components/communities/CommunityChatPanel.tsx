'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Send,
  LogIn,
  X,
  Edit2,
  Trash2,
  MessageCircle,
  Users,
  ChevronLeft,
  Reply,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthorAvatar } from '@/components/shared/AuthorAvatar'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { type ChatMessage } from '@/hooks/use-chat-events-polling'
import { useCommunityChat } from '@/hooks/use-community-chat'
import { cn } from '@/lib/core/utils'

interface CommunityChatPanelProps {
  communityId: string // 실제로는 slug 값이 전달됨
  communityName: string
  channelId?: string // 커뮤니티의 기본 채널 ID
  isOpen?: boolean
  onToggle?: () => void
  className?: string
}

export default function CommunityChatPanel({
  communityId,
  communityName,
  channelId,
  isOpen = true,
  onToggle,
  className,
}: CommunityChatPanelProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [replyingToMessage, setReplyingToMessage] =
    useState<ChatMessage | null>(null)
  const [lastReadAt, setLastReadAt] = useState<Date | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 커뮤니티 채널이 없으면 채널 생성 또는 가져오기
  const [activeChannelId, setActiveChannelId] = useState<string | null>(
    channelId || null
  )

  // 채널 정보 가져오기
  useEffect(() => {
    if (!channelId && communityId) {
      // 커뮤니티의 기본 채널을 가져오거나 생성 (communityId는 실제로 slug)
      fetch(`/api/communities/${communityId}/chat/channel`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.channel) {
            setActiveChannelId(data.data.channel.id)
          }
        })
        .catch(console.error)
    }
  }, [communityId, channelId])

  // 커뮤니티 채팅 통합 훅
  const { typingUsers, onlineCount, setOnMessage, sendTypingIndicator } =
    useCommunityChat(activeChannelId, session?.user?.id || null)

  // 초기 메시지 로드 및 마지막 읽은 시간 가져오기
  useEffect(() => {
    if (!activeChannelId || !session?.user?.id) return

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat/channels/${activeChannelId}/messages?limit=50`
        )
        if (res.ok) {
          const data = await res.json()
          setMessages(data.data?.messages || data.messages || [])
        }

        // 사용자의 마지막 읽은 시간 가져오기
        const memberRes = await fetch(
          `/api/chat/channels/${activeChannelId}/members/${session.user.id}`
        )
        if (memberRes.ok) {
          const memberData = await memberRes.json()
          if (memberData.data?.lastReadAt) {
            setLastReadAt(new Date(memberData.data.lastReadAt))
          }
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [activeChannelId, session?.user?.id])

  // 실시간 메시지 수신 처리
  useEffect(() => {
    if (!setOnMessage || !activeChannelId) return

    // 메시지 핸들러 설정
    const messageHandler = (message: ChatMessage | null) => {
      if (message) {
        setMessages((prev) => {
          // 중복 방지: 이미 존재하는 메시지인지 확인
          const exists = prev.some((m) => m.id === message.id)
          if (exists) {
            // 메시지 업데이트 (수정된 경우)
            return prev.map((m) => (m.id === message.id ? message : m))
          }
          // 새 메시지 추가
          return [...prev, message]
        })

        // 본인이 아닌 메시지일 때 lastReadAt 업데이트
        if (session?.user?.id && message.author?.id !== session.user.id) {
          fetch(
            `/api/chat/channels/${activeChannelId}/members/${session.user.id}`,
            {
              method: 'PATCH',
            }
          ).catch(console.error)
        }
      }
    }

    setOnMessage(messageHandler)

    // cleanup: 컴포넌트 언마운트 시 핸들러 제거
    return () => {
      setOnMessage(() => null)
    }
  }, [activeChannelId, setOnMessage, session?.user?.id])

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    if (!session?.user) return
    if (!activeChannelId) return

    setSending(true)

    try {
      const res = await fetch(
        `/api/chat/channels/${activeChannelId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage.trim(),
            type: 'TEXT',
            replyToId: replyingToMessage?.id,
          }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        // 전송한 메시지 즉시 추가 (실시간 수신 전)
        if (data.success && data.data?.message) {
          const newMessage = data.data.message
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMessage.id)
            if (!exists) {
              return [...prev, newMessage]
            }
            return prev
          })
        }
        setNewMessage('')
        setReplyingToMessage(null)
        // 약간의 지연 후 스크롤 (메시지가 DOM에 렌더링될 시간 확보)
        setTimeout(() => scrollToBottom(), 100)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  // 메시지 수정
  const handleUpdateMessage = async (messageId: string) => {
    if (!editingContent.trim() || !activeChannelId) return

    try {
      const res = await fetch(
        `/api/chat/channels/${activeChannelId}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editingContent }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? data.data.message : msg))
        )
        setEditingMessageId(null)
        setEditingContent('')
      }
    } catch (error) {
      console.error('Failed to update message:', error)
    }
  }

  // 메시지 삭제
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChannelId) return

    try {
      const res = await fetch(
        `/api/chat/channels/${activeChannelId}/messages/${messageId}`,
        {
          method: 'DELETE',
        }
      )

      if (res.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  // 스크롤 최하단으로
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 자동 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 타이핑 인디케이터 전송 (디바운싱 및 쓰로틀링 강화)
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingCallRef = useRef<number>(0)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    const now = Date.now()
    const timeSinceLastCall = now - lastTypingCallRef.current

    // 디바운싱: 이전 타이머 취소
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current)
    }

    // 10초 이내에 다시 호출하지 않음 (rate limit 회피)
    if (timeSinceLastCall < 10000) {
      return // 타이핑 인디케이터 전송 건너뛰기
    }

    // 1초 후에 타이핑 인디케이터 전송 (디바운싱)
    typingDebounceRef.current = setTimeout(() => {
      lastTypingCallRef.current = Date.now()
      sendTypingIndicator()
    }, 1000)
  }

  // 키보드 단축키
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 h-14 w-14 rounded-lg bg-white text-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all z-40"
        title="커뮤니티 채팅 열기"
      >
        <div className="flex flex-col items-center justify-center gap-0.5">
          <Users className="h-5 w-5" />
          <span className="text-[8px] font-black">CHAT</span>
        </div>
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        'h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col bg-white overflow-hidden',
        className
      )}
    >
      <CardHeader className="p-3 sm:p-4 border-b-2 border-black">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-black flex items-center">
            <MessageCircle className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{communityName} 채팅</span>
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">{onlineCount}명 온라인</span>
              <span className="sm:hidden">{onlineCount}</span>
            </div>
            {onToggle && (
              <Button
                onClick={onToggle}
                size="icon"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">메시지를 불러오는 중...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={MessageCircle}
              title="아직 메시지가 없습니다"
              description="첫 메시지를 보내보세요!"
              size="sm"
            />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 p-3 sm:p-4" ref={scrollAreaRef}>
            <div className="space-y-1.5 sm:space-y-2">
              {messages.map((message, index) => {
                // 메시지 그룹화 로직
                const prevMessage = messages[index - 1]

                const isSameAuthor =
                  prevMessage?.author?.id === message.author?.id
                const timeDiff = prevMessage
                  ? new Date(message.createdAt).getTime() -
                    new Date(prevMessage.createdAt).getTime()
                  : 0
                const isWithin5Minutes = timeDiff < 5 * 60 * 1000 // 5분 이내

                const isGroupStart = !isSameAuthor || !isWithin5Minutes

                // 읽음 표시선 로직 - 이 메시지가 마지막으로 읽은 메시지 다음에 오는 첫 번째 메시지인지 확인
                const shouldShowReadLine =
                  lastReadAt &&
                  session?.user?.id &&
                  message.author?.id !== session.user.id && // 본인 메시지가 아닌 경우만
                  new Date(message.createdAt) > lastReadAt &&
                  (!prevMessage ||
                    new Date(prevMessage.createdAt) <= lastReadAt)

                return (
                  <React.Fragment key={message.id}>
                    {/* 읽음 표시선 */}
                    {shouldShowReadLine && (
                      <div className="flex items-center my-4">
                        <div className="flex-1 h-px bg-red-400"></div>
                        <div className="px-3 py-1 bg-red-400 text-white text-xs rounded-full font-medium">
                          새로운 메시지
                        </div>
                        <div className="flex-1 h-px bg-red-400"></div>
                      </div>
                    )}
                    <div
                      className={cn(
                        'group flex gap-3',
                        message.author?.id === session?.user?.id &&
                          'flex-row-reverse',
                        !isGroupStart && 'mt-1' // 그룹 내 메시지는 간격 줄임
                      )}
                    >
                      {/* 아바타는 그룹의 첫 번째 메시지에만 표시 */}
                      <div className="w-8 h-8 flex-shrink-0">
                        {isGroupStart && (
                          <AuthorAvatar
                            author={{
                              id: message.author?.id || '',
                              name: message.author?.name || null,
                              username: message.author?.username || null,
                              image: message.author?.image || null,
                            }}
                            size="sm"
                            showName={false}
                          />
                        )}
                      </div>
                      <div
                        className={cn(
                          'flex-1 max-w-[85%] sm:max-w-[70%]',
                          message.author?.id === session?.user?.id &&
                            'flex flex-col items-end'
                        )}
                      >
                        {/* 작성자 정보는 그룹의 첫 번째 메시지에만 표시 */}
                        {isGroupStart && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {message.author?.name ||
                                message.author?.username ||
                                '익명'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {message.createdAt &&
                              !isNaN(Date.parse(message.createdAt))
                                ? formatDistanceToNow(
                                    new Date(message.createdAt),
                                    {
                                      addSuffix: true,
                                      locale: ko,
                                    }
                                  )
                                : '방금'}
                            </span>
                          </div>
                        )}

                        {editingMessageId === message.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingContent}
                              onChange={(e) =>
                                setEditingContent(e.target.value)
                              }
                              className="flex-1 border-2 border-black"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateMessage(message.id)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateMessage(message.id)}
                            >
                              수정
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessageId(null)
                                setEditingContent('')
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        ) : (
                          <div className="relative overflow-hidden">
                            <div
                              className={cn(
                                'inline-block p-2 sm:p-3 rounded-2xl relative transition-all',
                                message.author?.id === session?.user?.id
                                  ? 'bg-black text-white rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                              )}
                            >
                              {/* 답글 원본 표시 - 메시지 박스 안에 포함 */}
                              {message.replyTo && (
                                <div className="mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-gray-200 border-opacity-30">
                                  <div
                                    className={cn(
                                      'flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs opacity-70 overflow-hidden',
                                      message.author?.id ===
                                        session?.user?.id && 'justify-end'
                                    )}
                                  >
                                    <Reply className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                    <span className="truncate max-w-[60px] sm:max-w-[80px]">
                                      {message.replyTo.author?.name ||
                                        '알 수 없음'}
                                    </span>
                                    <span className="flex-shrink-0">•</span>
                                    <span className="truncate flex-1">
                                      {message.replyTo.content}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <p
                                className={cn(
                                  'text-xs sm:text-sm whitespace-pre-wrap break-words',
                                  message.author?.id === session?.user?.id &&
                                    'text-right'
                                )}
                              >
                                {message.content}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 메시지 액션 버튼들 - 호버시에만 표시 */}
                        <div
                          className={cn(
                            'flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
                            message.author?.id === session?.user?.id &&
                              'justify-end'
                          )}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:bg-gray-200"
                            onClick={() => setReplyingToMessage(message)}
                            title="답글"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </Button>

                          {/* 수정/삭제 버튼 - 본인 메시지만 */}
                          {message.author?.id === session?.user?.id && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-gray-200"
                                onClick={() => {
                                  setEditingMessageId(message.id)
                                  setEditingContent(message.content)
                                }}
                                title="수정"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 hover:bg-gray-200"
                                onClick={() => handleDeleteMessage(message.id)}
                                title="삭제"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                )
              })}

              {/* 타이핑 인디케이터 */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map((user, index) => (
                      <div
                        key={`typing-user-${user.userId}-${index}`}
                        className="h-6 w-6 rounded-full bg-muted border-2 border-white"
                      />
                    ))}
                  </div>
                  <span>
                    {typingUsers.length === 1
                      ? '누군가 입력 중...'
                      : `${typingUsers.length}명이 입력 중...`}
                  </span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        )}

        {/* 입력 영역 */}
        <div className="p-3 sm:p-4 border-t-2 border-black flex-shrink-0">
          {!session ? (
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                채팅에 참여하려면 로그인이 필요합니다
              </p>
              <Link href="/login">
                <Button
                  size="sm"
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <LogIn className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  로그인
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* 답글 미리보기 */}
              {replyingToMessage && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Reply className="h-4 w-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">
                        {replyingToMessage.author?.name || '익명'}
                      </span>
                      에게 답글
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {replyingToMessage.content}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:bg-gray-200"
                    onClick={() => setReplyingToMessage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 border-2 border-black"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
