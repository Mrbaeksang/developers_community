'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Send,
  Paperclip,
  LogIn,
  Image,
  File,
  X,
  Edit2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useChatEvents, type ChatMessage } from '@/hooks/use-chat-events'
import { useTypingIndicator } from '@/hooks/use-typing-indicator'
import { uploadChatFile } from '@/lib/chat-utils'

// ChatMessage 타입을 use-chat-events에서 가져와서 사용

interface FloatingChatWindowProps {
  channelId: string
  onNewMessage?: (message: ChatMessage) => void
}

export default function FloatingChatWindow({
  channelId,
  onNewMessage,
}: FloatingChatWindowProps) {
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

  // 실시간 채팅 연결
  const {
    isConnected,
    onlineInfo,
    typingUsers,
    setOnMessage,
    setOnMessageUpdate,
    setOnMessageDelete,
    sendTypingStatus,
  } = useChatEvents(channelId)

  // 타이핑 인디케이터
  const { startTyping, stopTyping } = useTypingIndicator(sendTypingStatus)

  // 메시지 로드 (초기 로드만, 실시간은 SSE로 처리)
  useEffect(() => {
    fetchMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId])

  // 실시간 메시지 수신 설정
  useEffect(() => {
    setOnMessage((newMessage: ChatMessage) => {
      setMessages((prev) => {
        // 중복 메시지 방지
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev
        }
        return [...prev, newMessage]
      })

      // 부모 컴포넌트에 새 메시지 알림
      if (onNewMessage) {
        onNewMessage(newMessage)
      }

      scrollToBottom()
    })
  }, [setOnMessage, onNewMessage])

  // 실시간 메시지 업데이트 설정
  useEffect(() => {
    setOnMessageUpdate((updatedMessage: ChatMessage) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
      )
    })
  }, [setOnMessageUpdate])

  // 실시간 메시지 삭제 설정
  useEffect(() => {
    setOnMessageDelete((messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    })
  }, [setOnMessageDelete])

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
    if ((!newMessage.trim() && !selectedFile) || sending) return

    setSending(true)
    stopTyping() // 타이핑 상태 중지

    try {
      let fileId: string | undefined

      // 파일이 선택된 경우 먼저 업로드
      if (selectedFile) {
        setUploading(true)
        const uploadResult = await uploadChatFile(selectedFile)
        fileId = uploadResult.fileId
        setUploading(false)
      }

      // 메시지 전송
      const res = await fetch(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content:
            newMessage.trim() ||
            (selectedFile ? `파일: ${selectedFile.name}` : ''),
          fileId,
          type: selectedFile
            ? selectedFile.type.startsWith('image/')
              ? 'IMAGE'
              : 'FILE'
            : 'TEXT',
        }),
      })

      if (!res.ok) throw new Error('Failed to send message')

      // 폼 초기화 (실시간으로 메시지가 추가되므로 수동 추가는 제거)
      setNewMessage('')
      setSelectedFile(null)
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
      setUploading(false)
    } finally {
      setSending(false)
    }
  }

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.')
        return
      }
      setSelectedFile(file)
    }
  }

  // 파일 선택 제거
  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 타이핑 상태 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    startTyping()
  }

  // 메시지 수정 시작
  const startEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  // 메시지 수정 취소
  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingContent('')
  }

  // 메시지 수정 저장
  const saveEditMessage = async (messageId: string) => {
    if (!editingContent.trim()) return

    try {
      const res = await fetch(
        `/api/chat/channels/${channelId}/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: editingContent.trim() }),
        }
      )

      if (!res.ok) throw new Error('Failed to update message')

      // 서버에서 브로드캐스트된 실시간 업데이트가 자동으로 반영됨
      cancelEditMessage()
    } catch (error) {
      console.error('Failed to update message:', error)
      alert('메시지 수정에 실패했습니다.')
    }
  }

  // 메시지 삭제
  const deleteMessage = async (messageId: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return

    try {
      const res = await fetch(
        `/api/chat/channels/${channelId}/messages/${messageId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (!res.ok) throw new Error('Failed to delete message')

      // 서버에서 브로드캐스트된 실시간 삭제가 자동으로 반영됨
    } catch (error) {
      console.error('Failed to delete message:', error)
      alert('메시지 삭제에 실패했습니다.')
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
              <div key={message.id} className="flex gap-3 group">
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
                      {message.updatedAt !== message.createdAt && ' (수정됨)'}
                    </span>

                    {/* 수정/삭제 버튼 (자기 메시지만) */}
                    {session?.user?.id === message.author.id && (
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            startEditMessage(message.id, message.content)
                          }
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* 메시지 내용 */}
                  <div className="text-sm break-words">
                    {editingMessageId === message.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEditMessage(message.id)
                            } else if (e.key === 'Escape') {
                              cancelEditMessage()
                            }
                          }}
                          className="flex-1 text-sm h-8"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => saveEditMessage(message.id)}
                          className="h-8"
                        >
                          저장
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEditMessage}
                          className="h-8"
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      message.content
                    )}

                    {/* 파일 첨부 표시 */}
                    {message.file && (
                      <div className="mt-2 p-2 border border-gray-200 rounded-md bg-gray-50">
                        {message.type === 'IMAGE' ? (
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line jsx-a11y/alt-text */}
                            <Image className="h-4 w-4" aria-hidden="true" />
                            <a
                              href={message.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {message.file.filename}
                            </a>
                            <span className="text-xs text-gray-500">
                              ({(message.file.size / 1024 / 1024).toFixed(2)}MB)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <a
                              href={message.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {message.file.filename}
                            </a>
                            <span className="text-xs text-gray-500">
                              ({(message.file.size / 1024 / 1024).toFixed(2)}MB)
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* 타이핑 인디케이터 */}
          {typingUsers.length > 0 && (
            <div className="text-xs text-muted-foreground italic px-4 py-1">
              {typingUsers.length === 1
                ? '누군가 입력 중...'
                : `${typingUsers.length}명이 입력 중...`}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* 연결 상태 및 온라인 사용자 표시 */}
      <div className="px-4 py-1 text-xs text-muted-foreground border-t border-gray-200 flex justify-between items-center">
        <span
          className={`flex items-center gap-1 ${isConnected ? 'text-green-600' : 'text-red-600'}`}
        >
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}
          />
          {isConnected ? '실시간 연결됨' : '연결 끊김'}
        </span>
        <span>온라인: {onlineInfo.count}명</span>
      </div>

      {/* 입력 영역 */}
      {session ? (
        <div className="p-4 border-t-2 border-black">
          {/* 선택된 파일 표시 */}
          {selectedFile && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-300 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedFile.type.startsWith('image/') ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <span className="text-sm truncate">{selectedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={removeSelectedFile}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="메시지를 입력하세요..."
              disabled={sending || uploading}
              className="flex-1 border-2 border-black"
            />

            {/* 파일 선택 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-2 border-black"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              title="파일 첨부"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              type="submit"
              size="icon"
              disabled={
                (!newMessage.trim() && !selectedFile) || sending || uploading
              }
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              {uploading ? '...' : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
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
