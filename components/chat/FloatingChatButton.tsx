'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import FloatingChatWindow from './FloatingChatWindow'

interface FloatingChatButtonProps {
  channelId: string
  channelName: string
}

export default function FloatingChatButton({
  channelId,
  channelName,
}: FloatingChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [size, setSize] = useState({ width: 400, height: 600 })
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [unreadCount] = useState(0)

  // 창 크기 조절
  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(
        300,
        Math.min(800, startWidth + e.clientX - startX)
      )
      const newHeight = Math.max(
        400,
        Math.min(800, startHeight + e.clientY - startY)
      )
      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 창 이동
  const handleDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX - position.x
    const startY = e.clientY - position.y

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - size.width - 40, e.clientX - startX)
      )
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - size.height - 40, e.clientY - startY)
      )
      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 키보드 단축키
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all z-50"
        title="채팅 열기 (Ctrl + /)"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    )
  }

  return (
    <div
      className={cn(
        'fixed z-50 transition-all duration-200',
        isMinimized && 'pointer-events-none'
      )}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
        width: isMinimized ? 'auto' : `${size.width}px`,
        height: isMinimized ? 'auto' : `${size.height}px`,
      }}
    >
      {isMinimized ? (
        <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] pointer-events-auto">
          <CardHeader className="p-3 cursor-move" onMouseDown={handleDrag}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">{channelName}</CardTitle>
              <div className="flex gap-1">
                <Button
                  onClick={() => setIsMinimized(false)}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="h-full border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
          <CardHeader
            className="p-4 cursor-move border-b-2 border-black"
            onMouseDown={handleDrag}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center">
                <MessageCircle className="mr-2 h-5 w-5" />
                {channelName}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  onClick={() => setIsMinimized(true)}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="최소화"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="닫기 (Ctrl + /)"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <FloatingChatWindow channelId={channelId} />
          </CardContent>
          {/* 크기 조절 핸들 */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={handleResize}
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-black" />
          </div>
        </Card>
      )}
    </div>
  )
}
