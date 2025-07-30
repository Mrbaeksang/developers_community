import { EventEmitter } from 'events'

// 전역 알림 이벤트 이미터
class NotificationEmitter extends EventEmitter {
  private static instance: NotificationEmitter

  private constructor() {
    super()
    this.setMaxListeners(100) // 동시 연결 수 제한
  }

  static getInstance(): NotificationEmitter {
    if (!NotificationEmitter.instance) {
      NotificationEmitter.instance = new NotificationEmitter()
    }
    return NotificationEmitter.instance
  }
}

// 전역 타입 확장
declare global {
  var notificationEmitter: NotificationEmitter | undefined
}

// 개발 환경에서 핫 리로드 시 인스턴스 재사용
if (!global.notificationEmitter) {
  global.notificationEmitter = NotificationEmitter.getInstance()
}

export const notificationEmitter = global.notificationEmitter
