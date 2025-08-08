import Image from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { useState, useCallback, useRef } from 'react'
import type { NodeViewProps } from '@tiptap/react'

// React component for resizable image
function ResizableImageComponent({ node, updateAttributes }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [width, setWidth] = useState(node.attrs.width || 'auto')
  const imgRef = useRef<HTMLImageElement>(null)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)
      startX.current = e.clientX
      startWidth.current = imgRef.current?.offsetWidth || 0

      const handleMouseMove = (e: MouseEvent) => {
        if (!imgRef.current) return
        const deltaX = e.clientX - startX.current
        const newWidth = Math.max(
          100,
          Math.min(1200, startWidth.current + deltaX)
        )
        setWidth(`${newWidth}px`)
        updateAttributes({ width: `${newWidth}px` })
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [updateAttributes]
  )

  return (
    <NodeViewWrapper className="relative inline-block group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || '이미지'}
        className="max-w-full h-auto rounded-md border cursor-pointer"
        style={{ width, display: 'block' }}
        draggable={false}
      />
      {/* Resize handle */}
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-tl-sm ${
          isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity`}
        onMouseDown={handleMouseDown}
        style={{ zIndex: 10 }}
      />
    </NodeViewWrapper>
  )
}

// Custom Image extension with resize functionality
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
          }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {}
          }
          return {
            height: attributes.height,
          }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },
})
