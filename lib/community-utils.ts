// 기본 아바타 옵션들
export const DEFAULT_AVATARS = [
  { emoji: '🚀', color: '#FF6B6B', name: 'rocket' },
  { emoji: '💻', color: '#4ECDC4', name: 'computer' },
  { emoji: '🎨', color: '#FFE66D', name: 'art' },
  { emoji: '📚', color: '#95E1D3', name: 'book' },
  { emoji: '🔧', color: '#C7CEEA', name: 'tool' },
  { emoji: '🌟', color: '#FFA502', name: 'star' },
  { emoji: '🎮', color: '#FF6348', name: 'game' },
  { emoji: '🏆', color: '#F8B500', name: 'trophy' },
  { emoji: '💡', color: '#FF9FF3', name: 'idea' },
  { emoji: '🎯', color: '#54A0FF', name: 'target' },
  { emoji: '🔥', color: '#F368E0', name: 'fire' },
  { emoji: '⚡', color: '#48DBFB', name: 'lightning' },
  { emoji: '🌈', color: '#A29BFE', name: 'rainbow' },
  { emoji: '🌸', color: '#FD79A8', name: 'flower' },
  { emoji: '🎸', color: '#FDCB6E', name: 'guitar' },
  { emoji: '🏃', color: '#6C5CE7', name: 'runner' },
]

// 기본 아바타 찾기
export function getDefaultAvatar(name: string) {
  const avatar = DEFAULT_AVATARS.find((a) => a.name === name)
  return avatar || null
}

// 아바타 이름으로 기본 아바타 선택
export function getAvatarFromName(communityName: string) {
  const firstChar = communityName.charCodeAt(0)
  const avatarIndex = firstChar % DEFAULT_AVATARS.length
  return DEFAULT_AVATARS[avatarIndex]
}
