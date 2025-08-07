/**
 * Security Configuration Center
 * 보안 관련 모든 설정을 중앙화하여 관리
 */

export const SecurityConfig = {
  // Rate Limiting 설정
  rateLimit: {
    // 활성화 여부
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',

    // Redis 사용 여부 (false면 메모리 사용)
    useRedis: process.env.RATE_LIMIT_USE_REDIS !== 'false',

    // 관리자 우회 허용
    bypassForAdmin: true,

    // IP 기반 Rate Limiting (비로그인 사용자)
    ipBased: {
      enabled: true,
      // IP당 최대 요청 수 (더 엄격)
      multiplier: 0.5, // 로그인 사용자 대비 50%만 허용
    },

    // Trust Score 설정
    trustScore: {
      // 캐시 시간 (초)
      cacheTTL: 3600,

      // 재계산 주기 (시간)
      recalculationInterval: 24,

      // 최소 신뢰도 (이하는 추가 제한)
      minimumScore: 0.2,
    },

    // Action별 커스텀 설정 (기본값 오버라이드)
    customLimits: {
      // 예: 특정 action에 대한 커스텀 설정
      'auth.login': {
        windowMs: 15 * 60 * 1000, // 15분
        maxRequests: 5,
        blockDuration: 30 * 60, // 30분
      },
      'post.like': {
        windowMs: 60 * 1000, // 1분
        maxRequests: 10,
        blockDuration: 3 * 60, // 3분
      },
    },

    // 에러 메시지
    messages: {
      rateLimitExceeded: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      blocked: '일시적으로 차단되었습니다. {minutes}분 후 다시 시도해주세요.',
      unauthorized: '인증이 필요합니다.',
      banned: '계정이 차단되었습니다. 관리자에게 문의하세요.',
    },
  },

  // Pattern Detection 설정
  patternDetection: {
    enabled: true,

    // Burst 감지
    burst: {
      // 짧은 시간 내 요청 수
      threshold: 10,
      windowMs: 1000, // 1초
      action: 'throttle', // throttle, block, alert
    },

    // 의심스러운 패턴
    suspicious: {
      // 연속 실패 횟수
      maxFailures: 5,
      // 다양한 엔드포인트 스캔
      endpointScanThreshold: 20,
      // 시간당 고유 action 수
      uniqueActionsPerHour: 50,
    },

    // 지리적 이상 감지
    geoAnomaly: {
      enabled: false, // 현재 비활성화
      // 짧은 시간 내 다른 지역에서 접속
      timeWindow: 60 * 60 * 1000, // 1시간
      maxDistance: 1000, // km
    },
  },

  // Abuse Prevention 설정
  abusePrevention: {
    // 자동 차단 설정
    autoBlock: {
      enabled: true,
      // 위반 횟수별 처벌
      violations: [
        { count: 3, duration: 60 * 60 }, // 3회: 1시간
        { count: 5, duration: 24 * 60 * 60 }, // 5회: 24시간
        { count: 10, duration: 7 * 24 * 60 * 60 }, // 10회: 7일
      ],
    },

    // 보고 시스템
    reporting: {
      // 신고 임계값 (자동 검토)
      autoReviewThreshold: 3,
      // 신고 유효 기간 (일)
      reportValidityDays: 30,
    },

    // Honeypot 설정 (봇 감지)
    honeypot: {
      enabled: true,
      // 숨겨진 필드 이름
      fieldName: 'website_url_validation',
    },
  },

  // Monitoring 설정
  monitoring: {
    // 메트릭 수집
    metrics: {
      enabled: true,
      // 수집 주기 (초)
      collectionInterval: 60,
      // 보관 기간 (일)
      retentionDays: 30,
    },

    // 알림 설정
    alerts: {
      enabled: true,
      // 알림 채널
      channels: ['console', 'redis'], // email, slack 추가 가능

      // 알림 임계값
      thresholds: {
        // 분당 차단 수
        blockRate: 10,
        // 시간당 위반 수
        violationRate: 50,
        // 동시 차단 사용자 수
        concurrentBlocks: 20,
      },
    },

    // 로깅 설정
    logging: {
      // 로그 레벨
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      // 상세 로깅 (개발용)
      verbose: process.env.NODE_ENV !== 'production',
      // 로그 저장
      persist: true,
    },
  },

  // Adaptive Rate Limiting 설정
  adaptive: {
    enabled: false, // 현재 비활성화 (Phase 5에서 구현)

    // CPU 기반 조절
    cpu: {
      // CPU 사용률 임계값
      threshold: 80,
      // 감소 비율
      reductionFactor: 0.5,
    },

    // 메모리 기반 조절
    memory: {
      // 메모리 사용률 임계값
      threshold: 85,
      // 감소 비율
      reductionFactor: 0.6,
    },

    // 응답 시간 기반 조절
    responseTime: {
      // 평균 응답 시간 임계값 (ms)
      threshold: 1000,
      // 감소 비율
      reductionFactor: 0.7,
    },
  },

  // Migration 설정 (기존 시스템과의 호환성)
  migration: {
    // 호환 모드 (기존 시스템과 병행 운영)
    compatibilityMode: true,

    // 기존 시스템 매핑
    legacyMapping: {
      general: ['post.read', 'post.list'],
      auth: ['auth.login', 'auth.register'],
      like: ['post.like', 'post.unlike', 'post.bookmark', 'post.unbookmark'],
    },

    // A/B 테스트 설정
    abTesting: {
      enabled: false,
      // 새 시스템 사용 비율 (0-1)
      newSystemRatio: 0.1,
    },
  },
}

// 환경별 설정 오버라이드
if (process.env.NODE_ENV === 'development') {
  // 개발 환경: 느슨한 제한
  SecurityConfig.rateLimit.customLimits = {
    ...SecurityConfig.rateLimit.customLimits,
    'auth.login': {
      windowMs: 60 * 1000,
      maxRequests: 100,
      blockDuration: 10,
    },
  }
  SecurityConfig.monitoring.logging.verbose = true
} else if (process.env.NODE_ENV === 'test') {
  // 테스트 환경: Rate Limiting 비활성화
  SecurityConfig.rateLimit.enabled = false
  SecurityConfig.patternDetection.enabled = false
  SecurityConfig.abusePrevention.autoBlock.enabled = false
}

// Helper functions
export function getRateLimitMessage(
  type: 'exceeded' | 'blocked' | 'unauthorized' | 'banned',
  minutes?: number
): string {
  const message =
    SecurityConfig.rateLimit.messages[
      type === 'exceeded'
        ? 'rateLimitExceeded'
        : type === 'blocked'
          ? 'blocked'
          : type === 'unauthorized'
            ? 'unauthorized'
            : 'banned'
    ]

  if (type === 'blocked' && minutes) {
    return message.replace('{minutes}', minutes.toString())
  }

  return message
}

export function shouldUseNewSystem(): boolean {
  if (!SecurityConfig.migration.abTesting.enabled) {
    return !SecurityConfig.migration.compatibilityMode
  }

  return Math.random() < SecurityConfig.migration.abTesting.newSystemRatio
}

export function getLegacyActionMapping(legacyKey: string): string[] {
  return (
    SecurityConfig.migration.legacyMapping[
      legacyKey as keyof typeof SecurityConfig.migration.legacyMapping
    ] || []
  )
}
