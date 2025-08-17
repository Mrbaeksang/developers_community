import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 네이버 검색봇 최우선 (네이버 권장사항)
      {
        userAgent: 'Yeti', // 네이버 봇
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // 기타 검색엔진
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
        ],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'}/sitemap.xml`,
    host: process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr',
  }
}
