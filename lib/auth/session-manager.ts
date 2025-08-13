import { signOut } from 'next-auth/react'

/**
 * 세션 관리 유틸리티
 * 자동 갱신, 만료 처리, 보안 강화
 */

interface SessionConfig {
  maxAge: number // 초 단위
  updateAge: number // 초 단위
  warningTime: number // 만료 경고 시간 (초)
}

const defaultConfig: SessionConfig = {
  maxAge: 30 * 24 * 60 * 60, // 30일
  updateAge: 24 * 60 * 60, // 24시간
  warningTime: 60 * 60, // 1시간 전 경고
}

class SessionManager {
  private config: SessionConfig
  private sessionCheckInterval: NodeJS.Timeout | null = null
  private warningShown = false
  private lastActivity: number = Date.now()
  private activityHandler: (() => void) | null = null
  private originalFetch: typeof window.fetch | null = null

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * 세션 모니터링 시작
   */
  startMonitoring(onWarning?: () => void, onExpired?: () => void): void {
    // 이전 모니터링 정리
    this.stopMonitoring()

    // 사용자 활동 추적
    this.setupActivityTracking()

    // 주기적 세션 체크 (5분마다)
    this.sessionCheckInterval = setInterval(
      () => {
        this.checkSession(onWarning, onExpired)
      },
      5 * 60 * 1000
    )

    // 즉시 한번 체크
    this.checkSession(onWarning, onExpired)
  }

  /**
   * 세션 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval)
      this.sessionCheckInterval = null
    }
    this.removeActivityTracking()
  }

  /**
   * 세션 상태 체크
   */
  private async checkSession(
    onWarning?: () => void,
    onExpired?: () => void
  ): Promise<void> {
    try {
      // 세션 만료 시간 계산
      const sessionExpiry = this.getSessionExpiry()
      if (!sessionExpiry) return

      const now = Date.now()
      const timeUntilExpiry = sessionExpiry - now

      // 만료됨
      if (timeUntilExpiry <= 0) {
        await this.handleExpiredSession(onExpired)
        return
      }

      // 만료 경고
      if (
        timeUntilExpiry <= this.config.warningTime * 1000 &&
        !this.warningShown
      ) {
        this.warningShown = true
        onWarning?.()
      }

      // 자동 갱신 체크
      if (this.shouldRefreshSession()) {
        await this.refreshSession()
      }
    } catch (error) {
      console.error('Session check failed:', error)
    }
  }

  /**
   * 세션 만료 시간 가져오기
   */
  private getSessionExpiry(): number | null {
    // JWT 토큰에서 만료 시간 추출
    const sessionData = this.getSessionData()
    if (!sessionData?.expires) return null

    return new Date(sessionData.expires).getTime()
  }

  /**
   * 세션 데이터 가져오기
   */
  private getSessionData(): { expires?: string } | null {
    // NextAuth 세션 쿠키 파싱
    const sessionCookie = document.cookie
      .split('; ')
      .find(
        (row) =>
          row.startsWith('next-auth.session-token=') ||
          row.startsWith('__Secure-next-auth.session-token=')
      )

    if (!sessionCookie) return null

    try {
      // 쿠키값 디코딩 (NextAuth는 JWT를 직접 저장하지 않음)
      // 실제 세션 데이터는 서버에서 가져와야 함
      return { expires: this.calculateExpiry() }
    } catch {
      return null
    }
  }

  /**
   * 만료 시간 계산 (마지막 활동 기준)
   */
  private calculateExpiry(): string {
    const expiry = new Date(this.lastActivity + this.config.maxAge * 1000)
    return expiry.toISOString()
  }

  /**
   * 세션 갱신 필요 여부
   */
  private shouldRefreshSession(): boolean {
    const now = Date.now()
    const timeSinceLastActivity = now - this.lastActivity

    // updateAge 시간이 지났고 사용자가 활동 중이면 갱신
    return (
      timeSinceLastActivity < 5 * 60 * 1000 && // 5분 내 활동
      timeSinceLastActivity > this.config.updateAge * 1000
    )
  }

  /**
   * 세션 갱신
   */
  private async refreshSession(): Promise<void> {
    try {
      // NextAuth 세션 갱신 트리거
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        this.warningShown = false
        // Session refreshed successfully
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }

  /**
   * 만료된 세션 처리
   */
  private async handleExpiredSession(onExpired?: () => void): Promise<void> {
    this.stopMonitoring()

    // 콜백 실행
    onExpired?.()

    // 자동 로그아웃
    await signOut({
      callbackUrl: '/auth/signin?expired=true',
      redirect: true,
    })
  }

  /**
   * 사용자 활동 추적 설정
   */
  private setupActivityTracking(): void {
    // 활동 시간 업데이트 함수 (참조 저장)
    this.activityHandler = () => {
      this.lastActivity = Date.now()
      this.warningShown = false
    }

    // 사용자 인터랙션 이벤트
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
    events.forEach((event) => {
      if (this.activityHandler) {
        document.addEventListener(event, this.activityHandler, {
          passive: true,
        })
      }
    })

    // API 호출 시에도 활동으로 간주 (원본 fetch 저장)
    if (!this.originalFetch && this.activityHandler) {
      this.originalFetch = window.fetch
      const handler = this.activityHandler
      const originalFetch = this.originalFetch
      window.fetch = (...args) => {
        handler()
        return originalFetch(...args)
      }
    }
  }

  /**
   * 활동 추적 제거
   */
  private removeActivityTracking(): void {
    if (this.activityHandler) {
      const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
      const handler = this.activityHandler
      events.forEach((event) => {
        document.removeEventListener(event, handler)
      })
      this.activityHandler = null
    }

    // 원본 fetch 복원
    if (this.originalFetch) {
      window.fetch = this.originalFetch
      this.originalFetch = null
    }
  }

  /**
   * 남은 세션 시간 (초)
   */
  getRemainingTime(): number {
    const expiry = this.getSessionExpiry()
    if (!expiry) return 0

    const remaining = Math.max(0, expiry - Date.now())
    return Math.floor(remaining / 1000)
  }

  /**
   * 세션 활성 여부
   */
  isSessionActive(): boolean {
    return this.getRemainingTime() > 0
  }

  /**
   * 수동 세션 갱신
   */
  async manualRefresh(): Promise<boolean> {
    try {
      await this.refreshSession()
      return true
    } catch {
      return false
    }
  }
}

// 싱글톤 인스턴스
let sessionManager: SessionManager | null = null

/**
 * SessionManager 인스턴스 가져오기
 */
export function getSessionManager(
  config?: Partial<SessionConfig>
): SessionManager {
  if (!sessionManager) {
    sessionManager = new SessionManager(config)
  }
  return sessionManager
}

/**
 * 세션 모니터링 시작 헬퍼
 */
export function startSessionMonitoring(
  onWarning?: () => void,
  onExpired?: () => void
): void {
  const manager = getSessionManager()
  manager.startMonitoring(onWarning, onExpired)
}

/**
 * 세션 모니터링 중지 헬퍼
 */
export function stopSessionMonitoring(): void {
  sessionManager?.stopMonitoring()
}

/**
 * 남은 세션 시간 포맷팅
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '만료됨'

  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  if (days > 0) {
    return `${days}일 ${hours}시간`
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`
  } else {
    return `${minutes}분`
  }
}
