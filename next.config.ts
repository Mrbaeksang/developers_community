import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NODE_ENV === 'development'
                ? // Development: More permissive for DX
                  `
                  default-src 'self';
                  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel-scripts.com;
                  style-src 'self' 'unsafe-inline';
                  img-src 'self' blob: data: https: https://*.public.blob.vercel-storage.com;
                  font-src 'self' data:;
                  connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com https://vitals.vercel-insights.com https://region1.google-analytics.com https://*.vercel-scripts.com ws://localhost:* http://localhost:*;
                  form-action 'self' http://localhost:3000 http://localhost:3006;
                  frame-ancestors 'none';
                  base-uri 'self';
                `
                    .replace(/\s{2,}/g, ' ')
                    .trim()
                : // Production: OAuth 지원 CSP
                  `
                  default-src 'self';
                  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://developers.kakao.com https://accounts.google.com https://apis.google.com https://vercel.live https://*.vercel-scripts.com;
                  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://accounts.google.com;
                  img-src 'self' blob: data: https: https://*.public.blob.vercel-storage.com;
                  font-src 'self' https://fonts.gstatic.com data:;
                  connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com https://vitals.vercel-insights.com https://region1.google-analytics.com https://*.vercel-scripts.com https://accounts.google.com https://kauth.kakao.com https://kapi.kakao.com;
                  frame-src 'self' https://accounts.google.com https://kauth.kakao.com;
                  form-action 'self';
                  frame-ancestors 'none';
                  base-uri 'none';
                  upgrade-insecure-requests;
                `
                    .replace(/\s{2,}/g, ' ')
                    .trim(),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Vercel Blob Storage 이미지 캐싱 최적화
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1년 캐시
          },
        ],
      },
      {
        source: '/:all*.(jpg|jpeg|gif|png|webp|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 정적 이미지 1년 캐시
          },
        ],
      },
      {
        source: '/:all*.blob.vercel-storage.com/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, s-maxage=31536000', // 브라우저 30일, CDN 1년
          },
        ],
      },
    ]
  },
  experimental: {
    // Node.js 24 호환성을 위한 설정
    serverMinification: false,
    // 패키지 최적화
    optimizePackageImports: [
      'lucide-react',
      'react-icons',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'date-fns',
      'framer-motion',
      '@tanstack/react-query',
      'react-hook-form',
      '@hookform/resolvers',
      'sonner',
      'react-day-picker',
      'react-dropzone',
      'react-intersection-observer',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },
  // 이미지 최적화 설정 (비용 절감)
  images: {
    // WebP 포맷 우선 사용
    formats: ['image/webp', 'image/avif'],
    // 이미지 크기 최적화
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 최소화 활성화
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1년
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      // Vercel Blob Storage 추가
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
      // Kakao CDN 추가 (모든 서브도메인)
      {
        protocol: 'https',
        hostname: '*.kakaocdn.net',
        pathname: '/**',
      },
    ],
  },
  // webpack 설정 추가
  webpack: (config) => {
    // webpack 호환성 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // rate-limiter-flexible의 drizzle-orm 의존성 문제 해결
    config.resolve.alias = {
      ...config.resolve.alias,
      'drizzle-orm': false,
    }

    return config
  },
}

export default bundleAnalyzer(nextConfig)
