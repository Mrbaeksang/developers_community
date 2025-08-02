// 기본 아바타 옵션들 (더 다양하게 확장)
export const DEFAULT_AVATARS = [
  // 개발/기술
  { emoji: '🚀', color: '#FF6B6B', name: 'rocket' },
  { emoji: '💻', color: '#4ECDC4', name: 'computer' },
  { emoji: '🔧', color: '#C7CEEA', name: 'tool' },
  { emoji: '⚡', color: '#48DBFB', name: 'lightning' },
  { emoji: '🤖', color: '#A55EEA', name: 'robot' },
  { emoji: '📱', color: '#26DE81', name: 'mobile' },
  { emoji: '💾', color: '#FD79A8', name: 'disk' },
  { emoji: '🖥️', color: '#45AAF2', name: 'desktop' },

  // 창의/디자인
  { emoji: '🎨', color: '#FFE66D', name: 'art' },
  { emoji: '✨', color: '#FA8072', name: 'sparkle' },
  { emoji: '🌈', color: '#A29BFE', name: 'rainbow' },
  { emoji: '🎭', color: '#FF7675', name: 'drama' },
  { emoji: '🖌️', color: '#FDCB6E', name: 'brush' },
  { emoji: '📸', color: '#74B9FF', name: 'camera' },

  // 학습/지식
  { emoji: '📚', color: '#95E1D3', name: 'book' },
  { emoji: '💡', color: '#FF9FF3', name: 'idea' },
  { emoji: '🧠', color: '#6C5CE7', name: 'brain' },
  { emoji: '🔬', color: '#00B894', name: 'science' },
  { emoji: '🎓', color: '#FDCB6E', name: 'graduation' },
  { emoji: '📝', color: '#81ECEC', name: 'note' },

  // 엔터테인먼트
  { emoji: '🎮', color: '#FF6348', name: 'game' },
  { emoji: '🎸', color: '#FDCB6E', name: 'guitar' },
  { emoji: '🎵', color: '#A29BFE', name: 'music' },
  { emoji: '🎬', color: '#FF7675', name: 'movie' },
  { emoji: '🎪', color: '#FD79A8', name: 'circus' },
  { emoji: '🎲', color: '#00CEC9', name: 'dice' },

  // 스포츠/활동
  { emoji: '🏆', color: '#F8B500', name: 'trophy' },
  { emoji: '⚽', color: '#00B894', name: 'soccer' },
  { emoji: '🏃', color: '#6C5CE7', name: 'runner' },
  { emoji: '🏋️', color: '#E17055', name: 'fitness' },
  { emoji: '🎯', color: '#54A0FF', name: 'target' },
  { emoji: '🏅', color: '#FDCB6E', name: 'medal' },

  // 자연/환경
  { emoji: '🌟', color: '#FFA502', name: 'star' },
  { emoji: '🔥', color: '#F368E0', name: 'fire' },
  { emoji: '🌸', color: '#FD79A8', name: 'flower' },
  { emoji: '🌱', color: '#00B894', name: 'plant' },
  { emoji: '🌙', color: '#74B9FF', name: 'moon' },
  { emoji: '☀️', color: '#FDCB6E', name: 'sun' },
  { emoji: '⭐', color: '#E17055', name: 'star2' },
  { emoji: '🌊', color: '#0984E3', name: 'wave' },

  // 동물
  { emoji: '🐱', color: '#FF7675', name: 'cat' },
  { emoji: '🐶', color: '#74B9FF', name: 'dog' },
  { emoji: '🦊', color: '#E17055', name: 'fox' },
  { emoji: '🐼', color: '#636E72', name: 'panda' },
  { emoji: '🐧', color: '#00CEC9', name: 'penguin' },
  { emoji: '🦄', color: '#A29BFE', name: 'unicorn' },

  // 음식
  { emoji: '🍕', color: '#E17055', name: 'pizza' },
  { emoji: '☕', color: '#8D4004', name: 'coffee' },
  { emoji: '🍔', color: '#FDCB6E', name: 'burger' },
  { emoji: '🍰', color: '#FD79A8', name: 'cake' },
  { emoji: '🍎', color: '#FF7675', name: 'apple' },
  { emoji: '🥑', color: '#00B894', name: 'avocado' },
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
