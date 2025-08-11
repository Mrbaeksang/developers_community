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
          '/profile/edit',
          '/communities/create',
          '/main/posts/create',
          '/main/posts/*/edit',
          '/communities/*/posts/create',
          '/communities/*/posts/*/edit',
          '/communities/*/settings',
          '/notifications',
          '/chat',
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
          '/profile/edit',
          '/communities/create',
          '/main/posts/create',
          '/main/posts/*/edit',
          '/communities/*/posts/create',
          '/communities/*/posts/*/edit',
          '/communities/*/settings',
          '/notifications',
          '/chat',
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
      // 한국 검색엔진들
      {
        userAgent: 'Yeti', // 네이버 봇
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
      {
        userAgent: 'Daumoa', // 다음 봇
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
      {
        userAgent: 'NaverBot', // 네이버 봇 (추가)
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
    ],
    sitemap: `${process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr'}/sitemap.xml`,
    host: process.env.NEXT_PUBLIC_API_URL || 'https://devcom.kr',
  }
}
