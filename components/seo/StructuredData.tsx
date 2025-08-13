import Script from 'next/script'

interface ArticleData {
  title?: string
  description?: string
  author?: {
    name?: string
    url?: string
  }
  publishedAt?: string
  updatedAt?: string
  image?: string
  url?: string
}

interface ProfileData {
  name?: string
  bio?: string
  url?: string
  image?: string
  social?: string[]
}

interface StructuredDataProps {
  type?: 'website' | 'article' | 'profile' | 'organization'
  data?: ArticleData | ProfileData
}

export function StructuredData({
  type = 'website',
  data,
}: StructuredDataProps) {
  const generateStructuredData = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'

    switch (type) {
      case 'website':
        return {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: '바이브 코딩',
          alternateName: 'Dev Community',
          url: baseUrl,
          description:
            '코딩 공부 어디서 시작할지 모르겠다면? 프로그래밍 언어 추천부터 신입 개발자 취업까지!',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/main/posts?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          inLanguage: 'ko-KR',
        }

      case 'organization':
        return {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Dev Community',
          url: baseUrl,
          logo: `${baseUrl}/logo.png`,
          sameAs: [
            'https://github.com/devcom-kr',
            'https://twitter.com/devcom_kr',
          ],
        }

      case 'article':
        const articleData = data as ArticleData
        return {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: articleData?.title || '',
          description: articleData?.description || '',
          author: {
            '@type': 'Person',
            name: articleData?.author?.name || 'Unknown',
            url: articleData?.author?.url || baseUrl,
          },
          datePublished: articleData?.publishedAt || new Date().toISOString(),
          dateModified: articleData?.updatedAt || new Date().toISOString(),
          image: articleData?.image || `${baseUrl}/og-image.png`,
          publisher: {
            '@type': 'Organization',
            name: 'Dev Community',
            logo: {
              '@type': 'ImageObject',
              url: `${baseUrl}/logo.png`,
            },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleData?.url || baseUrl,
          },
        }

      case 'profile':
        const profileData = data as ProfileData
        return {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: profileData?.name || '',
          description: profileData?.bio || '',
          url: profileData?.url || baseUrl,
          image: profileData?.image || '',
          sameAs: profileData?.social || [],
        }

      default:
        return null
    }
  }

  const structuredData = generateStructuredData()

  if (!structuredData) return null

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData),
      }}
      strategy="afterInteractive"
    />
  )
}
