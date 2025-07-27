import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'USER' | 'MANAGER' | 'ADMIN'
    } & DefaultSession['user']
  }

  interface User {
    role: 'USER' | 'MANAGER' | 'ADMIN'
  }
}
