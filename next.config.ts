import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Node.js 24 호환성을 위한 설정
    serverMinification: false,
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

export default nextConfig
