# Vercel 배포 타임아웃 문제 해결

## 🚨 문제 상황

Vercel 배포에서 `/api/chat/channels/[channelId]/events` 경로에서 100% 타임아웃 에러 발생

### 원인 분석

1. **SSE(Server-Sent Events)는 Vercel 서버리스와 호환 불가**
   - SSE는 장시간 연결 유지 필요
   - Vercel 서버리스 함수는 최대 실행 시간 제한:
     - 무료: 10초
     - Hobby: 60초  
     - Pro: 300초 (5분)

2. **높은 콜드 스타트 비율 (50.9%)**
   - 함수가 자주 유휴 상태가 되어 재시작 필요

3. **캐시 미스 100%**
   - 실시간 이벤트 특성상 캐싱 불가

## ✅ 해결 방법

### 1. SSE → Polling 방식으로 변경 (완료)

**수정된 파일들:**
- `/app/api/chat/channels/[channelId]/events/route.ts` - SSE 제거
- `/hooks/use-chat-events-polling.ts` - Polling 방식 구현 (신규)
- `/components/chat/FloatingChatWindow.tsx` - Polling 훅 사용

**Polling 구현 내용:**
- 3초마다 새 메시지 확인
- 10초마다 온라인 사용자 확인
- React Query로 효율적인 캐싱

### 2. 추가 권장사항

#### A. 실시간 서비스 도입 (권장)

**Pusher 사용 예시:**
```typescript
// 1. Pusher 설치
npm install pusher pusher-js

// 2. 환경변수 설정 (.env)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=ap3

// 3. 서버에서 이벤트 발송
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
})

// 메시지 전송 시
pusher.trigger(`chat-${channelId}`, 'new-message', message)

// 4. 클라이언트에서 수신
import Pusher from 'pusher-js'

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
})

const channel = pusher.subscribe(`chat-${channelId}`)
channel.bind('new-message', (message: ChatMessage) => {
  // 메시지 처리
})
```

**Supabase Realtime 사용 예시:**
```typescript
// Supabase는 이미 Realtime 지원
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// 실시간 구독
const channel = supabase
  .channel(`chat:${channelId}`)
  .on('broadcast', { event: 'message' }, (payload) => {
    // 메시지 처리
  })
  .subscribe()
```

#### B. vercel.json 최적화

```json
{
  "functions": {
    "app/api/chat/channels/[channelId]/messages/route.ts": {
      "maxDuration": 10
    },
    "app/api/**/route.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["icn1"]
}
```

#### C. 번들 크기 최적화

```bash
# 번들 분석
npm run build
ANALYZE=true npm run build

# 불필요한 의존성 제거
npm uninstall unused-package
```

## 📊 예상 개선 효과

1. **타임아웃 에러 100% → 0%**
2. **응답 시간 개선**: 1.53초 → 200ms 이하
3. **콜드 스타트 감소**: 50.9% → 10% 이하
4. **사용자 경험**: 실시간 느낌 유지 (3초 폴링)

## 🚀 배포 절차

```bash
# 1. 변경사항 커밋
git add .
git commit -m "fix: Vercel 배포 타임아웃 문제 해결 - SSE를 Polling으로 변경"

# 2. Vercel 배포
git push origin main

# 3. Vercel 대시보드에서 확인
# - Functions 탭에서 타임아웃 감소 확인
# - Observability에서 에러율 감소 확인
```

## 📌 주의사항

1. **Polling의 한계**
   - 완전한 실시간은 아님 (3초 지연)
   - 서버 부하 증가 가능

2. **장기적 해결책**
   - Pusher, Ably, Supabase Realtime 등 도입 권장
   - Next.js App Router의 Server Actions 활용 고려

## 🔗 참고 자료

- [Vercel Function Limits](https://vercel.com/docs/functions/limitations)
- [Pusher Docs](https://pusher.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)