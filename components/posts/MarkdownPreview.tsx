'use client'

import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import { getDefaultBlurPlaceholder } from '@/lib/image-utils'

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
            img: ({ src, alt }) => {
              // src가 string인지 확인
              const imageSrc = typeof src === 'string' ? src : ''

              // 외부 이미지 URL인 경우 일반 img 태그 사용
              if (imageSrc.startsWith('http')) {
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt={alt || ''}
                    className="max-w-full h-auto rounded mb-4"
                  />
                )
              }

              // 내부 이미지는 Next.js Image 컴포넌트 사용
              return (
                <div className="relative w-full mb-4">
                  <Image
                    src={imageSrc || '/placeholder.svg'}
                    alt={alt || ''}
                    width={800}
                    height={600}
                    className="rounded"
                    placeholder="blur"
                    blurDataURL={getDefaultBlurPlaceholder('post')}
                    style={{
                      width: '100%',
                      height: 'auto',
                    }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
                    loading="lazy"
                  />
                </div>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </Suspense>
  )
}
