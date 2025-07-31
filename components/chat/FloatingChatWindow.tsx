'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

interface FloatingChatWindowProps {
  channelId: string
}

export default function FloatingChatWindow({
  channelId,
}: FloatingChatWindowProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // 메시지 로드
  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000) // 5초마다 새 메시지 확인
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/channels/${channelId}/messages`, {
        credentials: 'include', // 쿠키를 포함하여 요청
      })
      if (!res.ok) throw new Error('Failed to fetch messages')
      const data = await res.json()
      setMessages(data.messages)
      scrollToBottom()
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 쿠키를 포함하여 요청
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setNewMessage('')
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">메시지를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              아직 메시지가 없습니다. 첫 메시지를 보내보세요!
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <Avatar className="h-8 w-8 border-2 border-black">
                  <AvatarImage src={message.author.image || ''} />
                  <AvatarFallback className="text-xs font-bold">
                    {message.author.name?.[0] ||
                      message.author.username?.[0] ||
                      '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm">
                      {message.author.name || message.author.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  <p className="text-sm break-words">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      {session ? (
        <form
          onSubmit={sendMessage}
          className="p-4 border-t-2 border-black flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={sending}
            className="flex-1 border-2 border-black"
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-2 border-black"
            disabled
            title="파일 첨부 (준비중)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="p-4 border-t-2 border-black">
          <Link href="/auth/signin" className="block">
            <Button
              className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              variant="default"
            >
              <LogIn className="h-4 w-4 mr-2" />
              로그인하고 채팅 참여하기
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
