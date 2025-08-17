import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/auth/',
          '/_next/',
          '/static/',
          '/dashboard/',
          '/users/bookmarks',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/auth/',
          '/_next/',
          '/static/',
          '/dashboard/',
          '/users/bookmarks',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/settings/',
          '/auth/',
          '/_next/',
          '/static/',
        ],
      },
      // 한국 검색엔진들 (콘텐츠 접근 최대화)
      {
        userAgent: 'Yeti', // 네이버 봇
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
      {
        userAgent: 'Daumoa', // 다음 봇
        allow: '/',
        disallow: ['/api/', '/admin/', '/_next/'],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'}/sitemap.xml`,
    host: process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr',
  }
}
