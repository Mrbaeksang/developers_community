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
      if (user) {
        // 첫 로그인 시 DB에서 사용자 정보 가져오기
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { globalRole: true },
        })
        token.role = dbUser?.globalRole || 'USER'
      }

      // 세션 업데이트 시 DB에서 최신 역할 정보 가져오기
      if (trigger === 'update' && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        })
        token.role = dbUser?.globalRole || 'USER'
      }

      // 기존 세션에도 role이 없다면 다시 조회
      if (!token.role && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        })
        token.role = dbUser?.globalRole || 'USER'
      }

      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as 'USER' | 'MANAGER' | 'ADMIN'
      }
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
