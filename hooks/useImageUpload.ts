'use client'

import { useState, useCallback } from 'react'
import { toast as sonnerToast } from 'sonner'

interface UseImageUploadOptions {
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  onSuccess?: (url: string, fileName: string) => void
  onError?: (error: Error) => void
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    acceptedTypes = ['image/'],
    onSuccess,
    onError,
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const isAcceptedType = acceptedTypes.some((type) =>
        file.type.startsWith(type)
      )
      if (!isAcceptedType) {
        return `파일 형식이 올바르지 않습니다. 허용된 형식: ${acceptedTypes.join(
          ', '
        )}`
      }

      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024)
        return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`
      }

      return null
    },
    [acceptedTypes, maxSize]
  )

  const uploadImage = useCallback(
    async (file: File) => {
      // Validate file
      const validationError = validateFile(file)
      if (validationError) {
        sonnerToast.error(validationError)
        return null
      }

      setIsUploading(true)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error?.message || '파일 업로드에 실패했습니다.')
        }

        const result = await response.json()
        const uploadedUrl = result.data.url

        setUploadProgress(100)
        sonnerToast.success('파일이 업로드되었습니다.')

        if (onSuccess) {
          onSuccess(uploadedUrl, file.name)
        }

        return uploadedUrl
      } catch (error) {
        console.error('File upload failed:', error)
        const errorMessage =
          error instanceof Error ? error.message : '파일 업로드에 실패했습니다.'
        sonnerToast.error(errorMessage)

        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage))
        }

        return null
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    },
    [validateFile, onSuccess, onError]
  )

  const uploadMultipleImages = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const uploadedUrls: string[] = []

      for (const file of fileArray) {
        const url = await uploadImage(file)
        if (url) {
          uploadedUrls.push(url)
        }
      }

      return uploadedUrls
    },
    [uploadImage]
  )

  return {
    uploadImage,
    uploadMultipleImages,
    isUploading,
    uploadProgress,
    validateFile,
  }
}
