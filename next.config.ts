import type { NextConfig } from 'next'
import withBundleAnalyzer from '@next/bundle-analyzer'

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  /* config options here */
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

    return config
  },
}

export default bundleAnalyzer(nextConfig)
