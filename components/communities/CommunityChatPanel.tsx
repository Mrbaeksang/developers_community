'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Send,
  Paperclip,
  LogIn,
  Image as ImageIcon,
  File,
  X,
  Edit2,
  Trash2,
  MessageCircle,
  Users,
  ChevronLeft,
} from 'lucide-react'
import NextImage from 'next/image'
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
import { type ChatMessage } from '@/hooks/use-chat-events'
import { useCommunityChat } from '@/hooks/use-community-chat'
import { uploadChatFile } from '@/lib/chat/utils'
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 초기 메시지 로드
  useEffect(() => {
    if (!activeChannelId) return

    const loadMessages = async () => {
      try {
        const res = await fetch(
          `/api/chat/channels/${activeChannelId}/messages?limit=50`
        )
        if (res.ok) {
          const data = await res.json()
          setMessages(data.data?.messages || data.messages || [])
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [activeChannelId])

  // 실시간 메시지 수신 처리
  useEffect(() => {
    if (!setOnMessage || !activeChannelId) return

    // 메시지 핸들러 설정
    const messageHandler = (message: ChatMessage | null) => {
      if (message) {
        setMessages((prev) => [...prev, message])
      }
    }

    setOnMessage(messageHandler)

    // cleanup: 컴포넌트 언마운트 시 핸들러 제거
    return () => {
      setOnMessage(null)
    }
  }, [activeChannelId, setOnMessage])

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return
    if (!session?.user) return
    if (!activeChannelId) return

    setSending(true)
    let fileData = null

    // 파일 업로드
    if (selectedFile) {
      setUploading(true)
      try {
        fileData = await uploadChatFile(selectedFile)
      } catch (error) {
        console.error('File upload failed:', error)
        setUploading(false)
        setSending(false)
        return
      }
      setUploading(false)
    }

    try {
      const res = await fetch(
        `/api/chat/channels/${activeChannelId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content:
              newMessage.trim() || (fileData ? '파일을 전송했습니다' : ''),
            type: fileData ? 'FILE' : 'TEXT',
            fileId: fileData?.fileId,
          }),
        }
      )

      if (res.ok) {
        setNewMessage('')
        setSelectedFile(null)
        scrollToBottom()
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

  // 타이핑 인디케이터 전송
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    sendTypingIndicator()
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
        className="fixed right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all z-40"
        title="채팅 열기"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <Card
      className={cn(
        'h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col bg-white',
        className
      )}
    >
      <CardHeader className="p-4 border-b-2 border-black">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-black flex items-center">
            <MessageCircle className="mr-2 h-5 w-5" />
            {communityName} 채팅
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              {onlineCount}명 온라인
            </div>
            {onToggle && (
              <Button
                onClick={onToggle}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
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
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.author?.id === session?.user?.id &&
                      'flex-row-reverse'
                  )}
                >
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
                  <div
                    className={cn(
                      'flex-1 max-w-[70%]',
                      message.author?.id === session?.user?.id &&
                        'flex flex-col items-end'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.author?.name ||
                          message.author?.username ||
                          '익명'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>

                    {editingMessageId === message.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
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
                      <div
                        className={cn(
                          'p-3 rounded-lg border-2 border-black',
                          message.author?.id === session?.user?.id
                            ? 'bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]'
                        )}
                      >
                        {message.type === 'FILE' && message.file ? (
                          <div className="space-y-2">
                            {message.file.type.startsWith('image/') ? (
                              <NextImage
                                src={message.file.url}
                                alt={message.file.filename}
                                width={400}
                                height={300}
                                className="max-w-full rounded border-2 border-black"
                              />
                            ) : (
                              <a
                                href={message.file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm underline"
                              >
                                <File className="h-4 w-4" />
                                {message.file.filename}
                              </a>
                            )}
                            {message.content && (
                              <p className="text-sm">{message.content}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        )}
                      </div>
                    )}

                    {message.author?.id === session?.user?.id && (
                      <div className="flex gap-1 mt-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditingMessageId(message.id)
                            setEditingContent(message.content)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 타이핑 인디케이터 */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {typingUsers.slice(0, 3).map((userId: string) => (
                      <div
                        key={userId}
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
        <div className="p-4 border-t-2 border-black">
          {!session ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                채팅에 참여하려면 로그인이 필요합니다
              </p>
              <Link href="/login">
                <Button className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 rounded border-2 border-black bg-muted">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <span className="text-sm flex-1 truncate">
                    {selectedFile.name}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="border-2 border-black"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 border-2 border-black"
                  disabled={sending || uploading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={
                    (!newMessage.trim() && !selectedFile) ||
                    sending ||
                    uploading
                  }
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
