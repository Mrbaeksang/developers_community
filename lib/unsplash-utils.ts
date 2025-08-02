// Unsplash 유틸리티 함수들

// 추천 배너 이미지들 (기본 10개)
export const RECOMMENDED_BANNER_IMAGES = [
  {
    id: 'nature-1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop',
    description: '아름다운 자연 풍경',
    tags: ['nature', 'landscape'],
  },
  {
    id: 'tech-1',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=300&fit=crop',
    description: '현대적인 기술',
    tags: ['technology', 'modern'],
  },
  {
    id: 'abstract-1',
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1200&h=300&fit=crop',
    description: '추상적 패턴',
    tags: ['abstract', 'colorful'],
  },
  {
    id: 'city-1',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=300&fit=crop',
    description: '도시 풍경',
    tags: ['city', 'urban'],
  },
  {
    id: 'space-1',
    url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1200&h=300&fit=crop',
    description: '우주와 별',
    tags: ['space', 'stars'],
  },
  {
    id: 'ocean-1',
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=300&fit=crop',
    description: '바다와 파도',
    tags: ['ocean', 'waves'],
  },
  {
    id: 'mountain-1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=300&fit=crop',
    description: '산과 하늘',
    tags: ['mountain', 'sky'],
  },
  {
    id: 'code-1',
    url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=300&fit=crop',
    description: '코딩과 개발',
    tags: ['coding', 'development'],
  },
  {
    id: 'minimal-1',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop',
    description: '미니멀 디자인',
    tags: ['minimal', 'clean'],
  },
  {
    id: 'creative-1',
    url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=300&fit=crop',
    description: '창의적 패턴',
    tags: ['creative', 'artistic'],
  },
]

// Unsplash 검색을 위한 기본 키워드들
export const SEARCH_KEYWORDS = [
  'technology',
  'nature',
  'abstract',
  'minimal',
  'coding',
  'development',
  'creative',
  'modern',
  'geometric',
  'gradient',
  'space',
  'ocean',
  'mountain',
  'city',
  'art',
  'design',
]

// Unsplash 이미지 URL 생성 (검색 기반)
export function getUnsplashImageUrl(
  query: string,
  width: number = 1200,
  height: number = 300
): string {
  const baseUrl = 'https://images.unsplash.com'
  const searchUrl = `${baseUrl}/photo-1506905925346-21bda4d32df4` // 기본 이미지

  // 실제 구현에서는 Unsplash API를 사용하여 검색 결과를 가져옵니다
  // 지금은 기본 이미지 URL에 파라미터를 추가하는 방식으로 구현
  return `${searchUrl}?w=${width}&h=${height}&fit=crop&q=${encodeURIComponent(query)}`
}

// 추천 이미지 중 랜덤 선택
export function getRandomRecommendedImage() {
  const randomIndex = Math.floor(
    Math.random() * RECOMMENDED_BANNER_IMAGES.length
  )
  return RECOMMENDED_BANNER_IMAGES[randomIndex]
}

// ID로 추천 이미지 찾기
export function getRecommendedImageById(id: string) {
  return RECOMMENDED_BANNER_IMAGES.find((image) => image.id === id)
}
