// 기본 배너 옵션들 (노션 스타일)
export const defaultBanners = [
  {
    id: 'gradient-sunset',
    name: '석양 그라데이션',
    url: 'https://picsum.photos/1200/300?random=sunset',
    gradient: 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600',
    preview: 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600',
  },
  {
    id: 'gradient-ocean',
    name: '바다 그라데이션',
    url: 'https://picsum.photos/1200/300?random=ocean',
    gradient: 'bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600',
    preview: 'bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600',
  },
  {
    id: 'gradient-forest',
    name: '숲 그라데이션',
    url: 'https://picsum.photos/1200/300?random=forest',
    gradient: 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600',
    preview: 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-600',
  },
  {
    id: 'gradient-night',
    name: '밤하늘 그라데이션',
    url: 'https://picsum.photos/1200/300?random=night',
    gradient: 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900',
    preview: 'bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900',
  },
  {
    id: 'gradient-dawn',
    name: '새벽 그라데이션',
    url: 'https://picsum.photos/1200/300?random=dawn',
    gradient: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400',
    preview: 'bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400',
  },
  {
    id: 'gradient-autumn',
    name: '가을 그라데이션',
    url: 'https://picsum.photos/1200/300?random=autumn',
    gradient: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
    preview: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500',
  },
  {
    id: 'solid-blue',
    name: '블루',
    url: 'https://picsum.photos/1200/300?random=blue',
    gradient: 'bg-blue-500',
    preview: 'bg-blue-500',
  },
  {
    id: 'solid-green',
    name: '그린',
    url: 'https://picsum.photos/1200/300?random=green',
    gradient: 'bg-green-500',
    preview: 'bg-green-500',
  },
  {
    id: 'solid-purple',
    name: '퍼플',
    url: 'https://picsum.photos/1200/300?random=purple',
    gradient: 'bg-purple-500',
    preview: 'bg-purple-500',
  },
  {
    id: 'solid-orange',
    name: '오렌지',
    url: 'https://picsum.photos/1200/300?random=orange',
    gradient: 'bg-orange-500',
    preview: 'bg-orange-500',
  },
]

// 랜덤 기본 배너 선택
export function getRandomDefaultBanner() {
  const randomIndex = Math.floor(Math.random() * defaultBanners.length)
  return defaultBanners[randomIndex]
}

// 배너 ID로 기본 배너 찾기
export function getDefaultBannerById(id: string) {
  return defaultBanners.find((banner) => banner.id === id)
}

// 배너 타입 확인 (Unsplash 지원 추가)
export function getBannerType(
  banner: string
): 'default' | 'upload' | 'unsplash' | 'none' {
  if (!banner) return 'none'
  if (banner.startsWith('default:')) return 'default'
  if (banner.startsWith('unsplash:')) return 'unsplash'
  return 'upload'
}

// 배너 URL 생성 (Unsplash 지원 추가)
export function getBannerUrl(banner: string): string {
  if (!banner) {
    // 랜덤 기본 배너 반환
    return getRandomDefaultBanner().url
  }

  if (banner.startsWith('default:')) {
    const bannerId = banner.replace('default:', '')
    const defaultBanner = getDefaultBannerById(bannerId)
    return defaultBanner?.url || getRandomDefaultBanner().url
  }

  if (banner.startsWith('unsplash:')) {
    // Unsplash 이미지는 unsplash: 접두사를 제거하고 URL 반환
    return banner.replace('unsplash:', '')
  }

  return banner // 업로드된 이미지 URL
}
