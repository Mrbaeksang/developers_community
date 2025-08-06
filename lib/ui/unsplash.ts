// Unsplash 유틸리티 함수들

// 추천 배너 이미지들 (기본 10개) - 밝고 선명한 이미지로 교체
export const RECOMMENDED_BANNER_IMAGES = [
  {
    id: 'nature-1',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=300&fit=crop',
    description: '화창한 자연 풍경',
    tags: ['nature', 'landscape'],
  },
  {
    id: 'tech-1',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=300&fit=crop',
    description: '밝고 화려한 기술 배경',
    tags: ['technology', 'modern'],
  },
  {
    id: 'abstract-1',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop',
    description: '다채로운 그라데이션',
    tags: ['abstract', 'colorful'],
  },
  {
    id: 'city-1',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&h=300&fit=crop',
    description: '밝은 도시 풍경',
    tags: ['city', 'urban'],
  },
  {
    id: 'space-1',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&h=300&fit=crop',
    description: '화려한 밤하늘',
    tags: ['space', 'stars'],
  },
  {
    id: 'ocean-1',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=300&fit=crop',
    description: '맑은 바다 풍경',
    tags: ['ocean', 'beach'],
  },
  {
    id: 'mountain-1',
    url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&h=300&fit=crop',
    description: '밝은 산 풍경',
    tags: ['mountain', 'sky'],
  },
  {
    id: 'code-1',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=300&fit=crop',
    description: '밝은 코딩 환경',
    tags: ['coding', 'development'],
  },
  {
    id: 'minimal-1',
    url: 'https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=1200&h=300&fit=crop',
    description: '깔끔한 워크스페이스',
    tags: ['minimal', 'clean'],
  },
  {
    id: 'creative-1',
    url: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=1200&h=300&fit=crop',
    description: '화려한 색상 패턴',
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
