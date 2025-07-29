import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
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
