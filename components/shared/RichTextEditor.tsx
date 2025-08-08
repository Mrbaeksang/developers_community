'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
} from 'lucide-react'
import { ImageUploader } from './ImageUploader'
import { ResizableImage } from './ResizableImage'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요...',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md border cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    shouldRerenderOnTransaction: false, // Better performance
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const handleImageInsert = useCallback(
    (url: string) => {
      if (!editor) return

      try {
        // Insert image at original size
        // User can resize it using the resize handles
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'image',
            attrs: {
              src: url,
              alt: '이미지',
            },
          })
          .run()
      } catch (error) {
        // Error inserting image
        console.error('❌ Failed to insert image:', url, error)
      }
    },
    [editor]
  )

  if (!editor) {
    return (
      <div className="min-h-[200px] animate-pulse bg-gray-100 rounded-md" />
    )
  }

  return (
    <div className="border-2 border-black rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-within:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
      {/* Toolbar */}
      <div className="border-b-2 border-black bg-gray-50 p-2 flex flex-wrap items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          }`}
          title="굵게"
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          }`}
          title="기울임"
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="mx-1 w-px bg-gray-300 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
          title="글머리 기호"
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`hover:bg-gray-100 ${
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          }`}
          title="번호 목록"
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`hover:bg-gray-100 ${
            editor.isActive('blockquote') ? 'bg-gray-200' : ''
          }`}
          title="인용"
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`hover:bg-gray-100 ${
            editor.isActive('codeBlock') ? 'bg-gray-200' : ''
          }`}
          title="코드 블록"
          disabled={disabled}
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="mx-1 w-px bg-gray-300 h-6" />

        <ImageUploader
          onImageInsert={handleImageInsert}
          disabled={disabled}
          showPreview={false}
        />

        <div className="mx-1 w-px bg-gray-300 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          title="실행 취소"
          disabled={disabled || !editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          title="다시 실행"
          disabled={disabled || !editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[300px] prose prose-sm max-w-none">
        <EditorContent editor={editor} className="min-h-[250px] outline-none" />
      </div>
    </div>
  )
}
