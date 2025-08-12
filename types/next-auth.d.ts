import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role: 'USER' | 'MANAGER' | 'ADMIN'
    }
  }

  interface User {
    id: string
    role: 'USER' | 'MANAGER' | 'ADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'USER' | 'MANAGER' | 'ADMIN'
  }
}

// Kakao SDK 타입 정의
declare global {
  interface Window {
    Kakao: {
      init: (appKey: string) => void
      isInitialized: () => boolean
      Share?: {
        sendDefault: (settings: object) => void
      }
      Link?: {
        sendDefault: (settings: object) => void
      }
    }
  }
}
