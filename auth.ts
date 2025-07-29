import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log(
        'JWT Callback - trigger:',
        trigger,
        'user:',
        user?.id,
        'token.sub:',
        token.sub
      )

      if (user) {
        // 첫 로그인 시 DB에서 사용자 정보 가져오기
        console.log('JWT - 첫 로그인, user.id:', user.id)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { globalRole: true },
        })
        console.log('JWT - DB에서 조회한 사용자:', dbUser)
        token.role = dbUser?.globalRole || 'USER'
        console.log('JWT - 설정된 token.role:', token.role)
      }

      // 세션 업데이트 시 DB에서 최신 역할 정보 가져오기
      if (trigger === 'update' && token.sub) {
        console.log('JWT - 세션 업데이트, token.sub:', token.sub)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        })
        console.log('JWT - 업데이트 시 DB 조회:', dbUser)
        token.role = dbUser?.globalRole || 'USER'
      }

      // 기존 세션에도 role이 없다면 다시 조회
      if (!token.role && token.sub) {
        console.log('JWT - role이 없어서 다시 조회, token.sub:', token.sub)
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        })
        console.log('JWT - 재조회 결과:', dbUser)
        token.role = dbUser?.globalRole || 'USER'
      }

      console.log('JWT - 최종 token.role:', token.role)
      return token
    },
    session({ session, token }) {
      console.log('Session Callback - 전체 token:', token)
      console.log('Session Callback - token.role:', token.role)
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as 'USER' | 'MANAGER' | 'ADMIN'
      }
      console.log(
        'Session Callback - 최종 session.user.role:',
        session.user.role
      )
      console.log('Session Callback - 최종 session.user:', session.user)
      return session
    },
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID!,
      clientSecret: process.env.AUTH_KAKAO_SECRET!,
    }),
  ],
})
