'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import imageCompression from 'browser-image-compression'

interface ImageUploaderProps {
  onImageInsert: (url: string) => void
  maxSize?: number // bytes
  className?: string
  disabled?: boolean
  showPreview?: boolean
}

export function ImageUploader({
  onImageInsert,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className,
  disabled = false,
  showPreview = true,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadImage = useCallback(
    async (file: File) => {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다')
        return
      }

      setIsUploading(true)
      setUploadProgress(0)

      // 클라이언트 이미지 압축 (비용 최적화)
      let compressedFile = file
      try {
        const options = {
          maxSizeMB: 2, // 최대 2MB로 압축
          maxWidthOrHeight: 1920, // 최대 1920px (Full HD)
          useWebWorker: true,
          fileType: 'image/webp', // WebP로 변환하여 추가 압축
          initialQuality: 0.85, // 품질 85% (시각적 차이 거의 없음)
        }

        // 원본이 2MB 이상이면 압축
        if (file.size > 2 * 1024 * 1024) {
          toast.info('이미지 최적화 중...')
          compressedFile = await imageCompression(file, options)

          // 압축 결과 알림
          const compressionRate = Math.round(
            (1 - compressedFile.size / file.size) * 100
          )
          if (compressionRate > 0) {
            toast.success(`이미지 ${compressionRate}% 압축 완료`)
          }
        }
      } catch (compressionError) {
        console.warn(
          'Image compression failed, using original:',
          compressionError
        )
        // 압축 실패시 원본 사용
      }

      // 압축 후에도 크기 체크
      if (compressedFile.size > maxSize) {
        toast.error(
          `파일 크기는 ${Math.round(maxSize / 1024 / 1024)}MB를 초과할 수 없습니다`
        )
        setIsUploading(false)
        return
      }

      // Show preview
      if (showPreview) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }

      try {
        // Simulate progress (실제로는 XMLHttpRequest나 fetch with stream을 사용)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 100)

        const formData = new FormData()
        formData.append('file', compressedFile)

        // Get CSRF token from cookie
        const csrfToken = document.cookie
          .split('; ')
          .find((row) => row.startsWith('csrf-token='))
          ?.split('=')[1]

        const headers: Record<string, string> = {}
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          headers,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          throw new Error('업로드 실패')
        }

        const data = await response.json()

        const imageUrl = data.data?.url || data.url

        if (!imageUrl) {
          console.error('❌ No image URL in response:', data)
          throw new Error('이미지 URL을 받지 못했습니다')
        }

        // Always insert the image at original size
        // The user can resize it in the editor using the resize handles
        onImageInsert(imageUrl)

        // Clear preview after success
        setTimeout(() => {
          setPreview(null)
          setUploadProgress(0)
        }, 1500)
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('이미지 업로드에 실패했습니다')
        setPreview(null)
        setUploadProgress(0)
      } finally {
        setIsUploading(false)
      }
    },
    [maxSize, onImageInsert, showPreview]
  )

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        await uploadImage(file)
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
    multiple: false,
    disabled: disabled || isUploading,
    noClick: true, // We'll handle click separately
  })

  // Handle paste
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (disabled || isUploading) return

      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await uploadImage(file)
          }
          break
        }
      }
    },
    [disabled, isUploading, uploadImage]
  )

  // Add paste listener
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  // Handle click upload
  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadImage(file)
      // Reset input
      e.target.value = ''
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setUploadProgress(0)
  }

  // Size selection removed - images are inserted at original size
  // and can be resized in the editor

  return (
    <div className={cn('relative', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Dropzone area */}
      <div {...getRootProps()}>
        <input {...getInputProps()} />

        {/* Upload button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={disabled || isUploading}
          className={cn(
            'h-8 w-8 p-0',
            isUploading ? 'cursor-wait' : 'hover:bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="이미지 업로드 (클릭, 드래그, 붙여넣기 가능)"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>

        {/* Drag overlay */}
        {isDragActive && (
          <div className="fixed inset-0 z-50 bg-blue-500/10 pointer-events-none">
            <div className="flex h-full items-center justify-center">
              <div className="rounded-lg border-4 border-dashed border-blue-500 bg-white p-8 shadow-xl">
                <Upload className="mx-auto h-12 w-12 text-blue-500 mb-2" />
                <p className="text-lg font-medium text-blue-700">
                  이미지를 여기에 드롭하세요
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && showPreview && (
        <div className="absolute left-0 top-10 z-50 rounded-lg border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Upload preview"
              className="max-h-32 max-w-[200px] rounded"
            />
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={clearPreview}
                className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border border-black shadow-sm hover:shadow-md"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {isUploading && uploadProgress > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                <div className="text-white text-sm font-medium">
                  {uploadProgress}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
