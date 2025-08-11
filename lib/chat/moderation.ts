// 채팅 메시지 검열 시스템

// 금지어 목록 (욕설, 비속어, 스팸 키워드)
const BANNED_WORDS = [
  // 한국어 욕설/비속어 (일부만 포함, 실제로는 더 포괄적인 목록 필요)
  '시발',
  '씨발',
  '개새끼',
  '병신',
  '지랄',
  '닥쳐',
  '꺼져',
  '죽어',
  '좆',
  '창녀',
  '걸레',
  '년',
  '놈',
  '새끼',
  '썅',
  '씹',

  // 변형된 형태들
  'ㅅㅂ',
  'ㅄ',
  'ㅂㅅ',
  'ㅈㄹ',
  '시1발',
  '씨8',
  '개ㅅㅋ',

  // 영어 욕설 (기본적인 것들)
  'fuck',
  'shit',
  'bitch',
  'ass',
  'damn',
  'hell',

  // 광고/스팸 키워드
  '카지노',
  '도박',
  '토토',
  '베팅',
  '대출',
  '성인',
  '19금',
  '광고문의',
  '텔레그램',
  '라인',
  '카톡',
  'bit.ly',
  'tinyurl',
]

// 스팸 패턴 정규표현식
const SPAM_PATTERNS = [
  // 연속된 같은 문자 (예: ㅋㅋㅋㅋㅋㅋㅋㅋ)
  /(.)\1{5,}/gi,

  // URL 패턴 (짧은 URL 서비스들)
  /(?:bit\.ly|tinyurl\.com|goo\.gl|ow\.ly|t\.co|buff\.ly)/gi,

  // 전화번호 패턴
  /\d{3}[-.\s]?\d{3,4}[-.\s]?\d{4}/g,

  // 이메일 패턴 (스팸용)
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // 금융 관련 패턴
  /(?:계좌|입금|송금|이체).{0,10}\d{3,}/gi,
]

// 검열 결과 타입
export interface ModerationResult {
  isClean: boolean
  issues: string[]
  severity: 'low' | 'medium' | 'high'
  shouldBlock: boolean
  filteredContent?: string
}

// 금지어 체크 함수
function checkBannedWords(content: string): string[] {
  const issues: string[] = []
  const lowerContent = content.toLowerCase()

  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      issues.push(`금지어 감지: ${word}`)
    }
  }

  return issues
}

// 스팸 패턴 체크 함수
function checkSpamPatterns(content: string): string[] {
  const issues: string[] = []

  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`스팸 패턴 감지`)
    }
  }

  // 대문자 남용 체크
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length
  if (upperCaseRatio > 0.5 && content.length > 10) {
    issues.push('과도한 대문자 사용')
  }

  // 특수문자 남용 체크
  const specialCharRatio =
    (content.match(/[!@#$%^&*()]/g) || []).length / content.length
  if (specialCharRatio > 0.3 && content.length > 10) {
    issues.push('과도한 특수문자 사용')
  }

  return issues
}

// 메시지 필터링 함수 (금지어를 * 로 대체)
function filterContent(content: string): string {
  let filtered = content

  for (const word of BANNED_WORDS) {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  }

  return filtered
}

// 심각도 판단 함수
function determineSeverity(issues: string[]): 'low' | 'medium' | 'high' {
  if (issues.length === 0) return 'low'

  const hasBannedWords = issues.some((issue) => issue.includes('금지어'))
  const hasSpamPatterns = issues.some((issue) => issue.includes('스팸'))

  if (hasBannedWords && hasSpamPatterns) return 'high'
  if (hasBannedWords) return 'medium'
  if (hasSpamPatterns) return 'medium'

  return 'low'
}

// 메인 검열 함수
export function moderateMessage(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return {
      isClean: true,
      issues: [],
      severity: 'low',
      shouldBlock: false,
    }
  }

  const issues: string[] = []

  // 금지어 체크
  const bannedWordIssues = checkBannedWords(content)
  issues.push(...bannedWordIssues)

  // 스팸 패턴 체크
  const spamIssues = checkSpamPatterns(content)
  issues.push(...spamIssues)

  // 심각도 판단
  const severity = determineSeverity(issues)

  // 차단 여부 결정 (심각한 경우만 차단)
  const shouldBlock = severity === 'high' || issues.length >= 3

  // 필터링된 내용 생성 (항상 필터링, 차단과 무관)
  const filteredContent = filterContent(content)

  return {
    isClean: issues.length === 0,
    issues,
    severity,
    shouldBlock,
    filteredContent,
  }
}

// 사용자 평판 기반 검열 강도 조정
export function moderateWithUserContext(
  content: string,
  userReputation: number // 0-100
): ModerationResult {
  const baseResult = moderateMessage(content)

  // 평판이 높은 사용자는 검열 완화
  if (userReputation > 80 && baseResult.severity === 'medium') {
    return {
      ...baseResult,
      severity: 'low',
      shouldBlock: false,
      filteredContent: filterContent(content),
    }
  }

  // 평판이 낮은 사용자는 검열 강화
  if (userReputation < 30 && baseResult.issues.length > 0) {
    return {
      ...baseResult,
      severity: 'medium',
      shouldBlock: true,
    }
  }

  return baseResult
}

// 채팅방 유형별 검열 강도 조정
export function moderateByChannelType(
  content: string,
  channelType: 'public' | 'private' | 'dm'
): ModerationResult {
  const baseResult = moderateMessage(content)

  // DM은 검열 완화
  if (channelType === 'dm') {
    return {
      ...baseResult,
      shouldBlock: false,
      filteredContent: content, // DM에서는 필터링 안 함
    }
  }

  // 공개 채널은 검열 강화
  if (channelType === 'public' && baseResult.issues.length > 0) {
    return {
      ...baseResult,
      severity: baseResult.severity === 'low' ? 'medium' : baseResult.severity,
      shouldBlock: baseResult.issues.length >= 2, // 더 엄격한 기준
    }
  }

  return baseResult
}

// 실시간 타이핑 검열 (가벼운 체크만)
export function quickModerateTyping(content: string): boolean {
  const lowerContent = content.toLowerCase()

  // 심각한 금지어만 빠르게 체크
  const severeBannedWords = ['시발', '씨발', '개새끼', '병신']

  for (const word of severeBannedWords) {
    if (lowerContent.includes(word)) {
      return false // 타이핑 차단
    }
  }

  return true // 타이핑 허용
}

// 메시지 히스토리 기반 스팸 감지
export function detectSpamByHistory(
  currentMessage: string,
  messageHistory: Array<{ content: string; timestamp: Date }>
): boolean {
  // 최근 5분 내 메시지만 확인
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  const recentMessages = messageHistory.filter(
    (msg) => msg.timestamp > fiveMinutesAgo
  )

  // 같은 메시지 반복 체크
  const duplicateCount = recentMessages.filter(
    (msg) => msg.content === currentMessage
  ).length

  if (duplicateCount >= 3) {
    return true // 스팸으로 감지
  }

  // 너무 빠른 메시지 연속 전송 체크
  if (recentMessages.length >= 10) {
    const timeDiff = Date.now() - recentMessages[0].timestamp.getTime()
    const messagesPerSecond = recentMessages.length / (timeDiff / 1000)

    if (messagesPerSecond > 0.5) {
      return true // 초당 0.5개 이상은 스팸
    }
  }

  return false
}
