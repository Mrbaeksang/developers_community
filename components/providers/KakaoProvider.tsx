'use client'

// Kakao SDK 초기화는 layout.tsx의 Script onLoad에서 처리
// 이 Provider는 Kakao SDK가 로드되었는지 체크만 수행
export function KakaoProvider({ children }: { children: React.ReactNode }) {
  // SDK는 layout.tsx에서 초기화되므로 여기서는 children만 반환
  return <>{children}</>
}
