# 프로젝트 구조

## 📡 디렉토리 구조

```
my_project/
├── app/
│   ├── (auth)/              # 인증 레이아웃
│   │   └── signin/         ✓ 로그인 페이지
│   ├── (main)/              # 메인 사이트 레이아웃
│   │   ├── posts/          ✗ 게시글 목록
│   │   └── posts/[id]/     ✗ 게시글 상세
│   ├── (community)/         # 커뮤니티 레이아웃
│   │   ├── page.tsx        ✗ 커뮤니티 목록
│   │   └── [id]/           ✗ 커뮤니티 상세
│   ├── (dashboard)/         # 대시보드 레이아웃
│   │   └── page.tsx        ✓ 대시보드
│   ├── api/
│   │   ├── auth/[...nextauth]/  ✓ NextAuth 라우트
│   │   ├── main/               # 메인 사이트 API
│   │   │   ├── posts/          ✗ CRUD
│   │   │   ├── categories/     ✗ 카테고리
│   │   │   └── tags/           ✗ 태그
│   │   ├── communities/        # 커뮤니티 API
│   │   │   ├── route.ts        ✗ 목록/생성
│   │   │   └── [id]/           ✗ 상세/가입/탈퇴
│   │   └── chat/               # 채팅 API
│   │       └── rooms/          ✗ 채팅방/메시지
│   └── page.tsx             ✓ 메인 페이지
├── components/
│   ├── ui/                  # shadcn/ui 컴포넌트
│   ├── feature/             # 기능별 컴포넌트
│   └── shared/              # 공통 컴포넌트
├── lib/
│   ├── prisma.ts            ✓ Prisma 클라이언트
│   └── utils.ts             ✓ 유틸리티
├── prisma/
│   ├── schema.prisma        ✓ 데이터베이스 스키마
│   └── seed.ts              ✓ 시드 데이터
└── auth.ts                  ✓ NextAuth 설정
```

## 🎯 API 라우트 매핑

### 메인 사이트 API
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/main/posts` | GET/POST | 게시글 목록/작성 | ✗ |
| `/api/main/posts/[id]` | GET/PUT/DELETE | 게시글 상세/수정/삭제 | ✗ |
| `/api/main/posts/[id]/approve` | POST | 게시글 승인 | ✗ |
| `/api/main/posts/[id]/comments` | POST | 댓글 작성 | ✗ |
| `/api/main/comments/[id]` | DELETE | 댓글 삭제 | ✗ |
| `/api/main/categories` | GET | 카테고리 목록 | ✗ |
| `/api/main/tags` | GET | 태그 목록 | ✗ |
| `/api/main/tags/[id]/posts` | GET | 태그별 게시글 | ✗ |

### 커뮤니티 API
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/communities` | GET/POST | 커뮤니티 목록/생성 | ✗ |
| `/api/communities/[id]` | GET | 커뮤니티 상세 | ✗ |
| `/api/communities/[id]/join` | POST | 커뮤니티 가입 | ✗ |
| `/api/communities/[id]/leave` | DELETE | 커뮤니티 탈퇴 | ✗ |
| `/api/communities/[id]/posts` | GET/POST | 커뮤니티 게시글 | ✗ |
| `/api/community-posts/[id]` | PUT/DELETE | 게시글 수정/삭제 | ✗ |
| `/api/community-posts/[id]/comments` | POST | 댓글 작성 | ✗ |

### 채팅 API
| 경로 | 메서드 | 설명 | 상태 |
|------|---------|------|------|
| `/api/chat/rooms` | GET/POST | 채팅방 목록/생성 | ✗ |
| `/api/chat/rooms/[id]/messages` | GET/POST | 메시지 조회/전송 | ✗ |

## 📄 페이지 구현 현황

### 인증 (✓ 완료)
- ✓ `/` - 메인 페이지
- ✓ `/signin` - 로그인 페이지

### 메인 사이트 (✗ 미구현)
- ✗ `/main/posts` - 게시글 목록
- ✗ `/main/posts/[id]` - 게시글 상세

### 커뮤니티 (✗ 미구현)
- ✗ `/communities` - 커뮤니티 목록
- ✗ `/communities/[id]` - 커뮤니티 상세

### 대시보드 (✓ 완료)
- ✓ `/dashboard` - 사용자 대시보드

## 🛠️ 기술 스택

- **Framework**: Next.js 15.4.4 (App Router)
- **Auth**: NextAuth.js v5
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand
- **API**: tRPC (planned)