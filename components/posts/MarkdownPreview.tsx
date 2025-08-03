'use client'

import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import remarkGfm from 'remark-gfm'

// Lazy load ReactMarkdown only
const ReactMarkdown = lazy(() => import('react-markdown'))

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      }
    >
      <div className={className}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
            ),
            p: ({ children }) => <p className="mb-4">{children}</p>,
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4">{children}</ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              if (className) {
                return (
                  <pre className="bg-gray-100 rounded p-4 overflow-x-auto mb-4">
                    <code className={className}>{children}</code>
                  </pre>
                )
              }
              return (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                  {children}
                </code>
              )
            },
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded mb-4"
              />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Suspense>
  )
}
