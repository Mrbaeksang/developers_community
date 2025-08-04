'use client'

import { useDropzone } from 'react-dropzone'
import { ReactNode } from 'react'

interface DropzoneAreaProps {
  onDrop: (file: File) => Promise<void>
  isDragActive: boolean
  children: ReactNode
}

export default function DropzoneArea({ onDrop, children }: DropzoneAreaProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        await onDrop(file)
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: false,
    noClick: true,
  })

  return (
    <div {...getRootProps()} className="relative">
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-4 border-dashed border-blue-500 bg-blue-50/90">
          <p className="text-lg font-medium text-blue-700">
            이미지를 여기에 드롭하세요
          </p>
        </div>
      )}
      {children}
    </div>
  )
}
