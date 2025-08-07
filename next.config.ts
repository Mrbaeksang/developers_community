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
                  img-src 'self' blob: data: https:;
                  font-src 'self' data:;
                  connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com https://vitals.vercel-insights.com https://region1.google-analytics.com https://*.vercel-scripts.com ws://localhost:* http://localhost:*;
                  form-action 'self' http://localhost:3000 http://localhost:3006;
                  frame-ancestors 'none';
                  base-uri 'self';
                `
                    .replace(/\s{2,}/g, ' ')
                    .trim()
                : // Production: Stricter security
                  `
                  default-src 'self';
                  script-src 'self' https://vercel.live https://*.vercel-scripts.com;
                  style-src 'self' 'unsafe-inline';
                  img-src 'self' blob: data: https:;
                  font-src 'self' data:;
                  connect-src 'self' https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com https://vitals.vercel-insights.com https://region1.google-analytics.com https://*.vercel-scripts.com;
                  form-action 'self';
                  frame-ancestors 'none';
                  base-uri 'self';
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
  // 이미지 도메인 설정
  images: {
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
