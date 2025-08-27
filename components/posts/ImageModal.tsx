'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
}

export function ImageModal({
  isOpen,
  onClose,
  src,
  alt = '',
}: ImageModalProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Handle browser back button on mobile
  useEffect(() => {
    if (!isOpen) return

    const handlePopState = () => {
      onClose()
    }

    // Add a dummy history entry when modal opens
    window.history.pushState({ modalOpen: true }, '')

    // Listen for back button
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen, onClose])

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleReset = useCallback(() => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case 'r':
          handleRotate()
          break
        case '0':
          handleReset()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleZoomIn, handleZoomOut, handleRotate, handleReset])

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'image.jpg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }, [src, alt])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart, scale]
  )

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY > 0) {
      handleZoomOut()
    } else {
      handleZoomIn()
    }
  }

  if (!isOpen) return null

  return typeof window !== 'undefined'
    ? createPortal(
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
            onClick={onClose}
          />

          {/* Modal Content */}
          <div
            className="fixed z-50 overflow-hidden bg-black/95 border-0 rounded-lg"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '95vw',
              maxWidth: '1200px',
              height: '90vh',
            }}
          >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="text-white hover:bg-white/20"
                  title="축소 (-)"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <span className="text-white min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="text-white hover:bg-white/20"
                  title="확대 (+)"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRotate}
                  className="text-white hover:bg-white/20"
                  title="회전 (R)"
                >
                  <RotateCw className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                  title="다운로드"
                >
                  <Download className="h-5 w-5" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                title="닫기 (ESC)"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Image Container */}
            <div
              className="relative flex items-center justify-center w-full h-full overflow-auto"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                cursor:
                  scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            >
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease',
                  transformOrigin: 'center',
                }}
                className="select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alt}
                  className="max-w-[85vw] max-h-[75vh] object-contain"
                  draggable={false}
                />
              </div>
            </div>

            {/* Help text */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/60 text-xs sm:text-sm bg-black/60 px-3 py-1 rounded">
              <span className="hidden sm:inline">
                마우스 휠로 확대/축소 • 드래그로 이동 • 단축키: +/- 확대축소, R
                회전
              </span>
              <span className="sm:hidden">
                터치로 확대/축소 • 드래그로 이동
              </span>
            </div>
          </div>
        </>,
        document.body
      )
    : null
}
