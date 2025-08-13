import { Metadata } from 'next'

interface PageMetaProps {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  author?: string
}

export function generatePageMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  author,
}: PageMetaProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'
  const fullUrl = url || baseUrl
  const ogImage = image || `${baseUrl}/og-image.png`

  const metadata: Metadata = {
    title: `${title} | 바이브 코딩`,
    description,
    keywords:
      keywords ||
      '코딩 공부, 프로그래밍, 개발자, React, JavaScript, TypeScript',
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: '바이브 코딩',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ko_KR',
      type: type === 'article' ? 'article' : 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  }

  if (type === 'article' && author) {
    metadata.authors = [{ name: author }]
  }

  return metadata
}
